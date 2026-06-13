from datetime import datetime, timezone
from decimal import Decimal
from flask import jsonify, request
from ..extensions import db
from ..models import Coupon


def create_coupon():
    payload = request.get_json(silent=True) or {}
    code = payload.get('code', '').strip().upper()
    discount_type = payload.get('discount_type')
    discount_value = payload.get('discount_value')
    min_order_amount = payload.get('min_order_amount', 0)
    expiry_date_str = payload.get('expiry_date')
    max_usage = payload.get('max_usage')
    is_active = payload.get('is_active', True)

    if not code:
        return jsonify({'message': 'Coupon code is required.'}), 422
    if discount_type not in ('percentage', 'fixed'):
        return jsonify({'message': 'Discount type must be percentage or fixed.'}), 422
    try:
        discount_value = Decimal(str(discount_value))
        if discount_value <= 0:
            return jsonify({'message': 'Discount value must be a positive number.'}), 422
    except (ValueError, TypeError):
        return jsonify({'message': 'Discount value must be a positive number.'}), 422

    try:
        min_order_amount = Decimal(str(min_order_amount))
        if min_order_amount < 0:
            return jsonify({'message': 'Minimum order amount must be greater than or equal to 0.'}), 422
    except (ValueError, TypeError):
        min_order_amount = Decimal('0.00')

    if Coupon.query.filter_by(code=code).first():
        return jsonify({'message': f'Coupon code "{code}" already exists.'}), 422

    expiry_date = None
    if expiry_date_str:
        try:
            expiry_date_str = expiry_date_str.replace('Z', '+00:00')
            expiry_date = datetime.fromisoformat(expiry_date_str)
        except Exception:
            return jsonify({'message': 'Invalid expiry date format. Use ISO format.'}), 422

    try:
        if max_usage is not None and max_usage != '':
            max_usage = int(max_usage)
            if max_usage <= 0:
                return jsonify({'message': 'Max usage must be a positive integer.'}), 422
        else:
            max_usage = None
    except ValueError:
        return jsonify({'message': 'Max usage must be a valid integer.'}), 422

    coupon = Coupon(
        code=code,
        discount_type=discount_type,
        discount_value=discount_value,
        min_order_amount=min_order_amount,
        expiry_date=expiry_date,
        max_usage=max_usage,
        is_active=is_active
    )
    db.session.add(coupon)
    db.session.commit()

    return jsonify({'message': 'Coupon created successfully.', 'data': coupon.to_dict()}), 201


def get_coupons():
    coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
    return jsonify({'data': [coupon.to_dict() for coupon in coupons]})


def delete_coupon(coupon_id):
    coupon = db.session.get(Coupon, coupon_id)
    if not coupon:
        return jsonify({'message': 'Coupon not found.'}), 404
    db.session.delete(coupon)
    db.session.commit()
    return jsonify({'message': 'Coupon deleted successfully.'})


def update_coupon_status(coupon_id):
    coupon = db.session.get(Coupon, coupon_id)
    if not coupon:
        return jsonify({'message': 'Coupon not found.'}), 404
    payload = request.get_json(silent=True) or {}
    is_active = payload.get('is_active')
    if is_active is None:
        coupon.is_active = not coupon.is_active
    else:
        coupon.is_active = bool(is_active)
    db.session.commit()
    return jsonify({'message': 'Coupon status updated successfully.', 'data': coupon.to_dict()})


def apply_coupon():
    payload = request.get_json(silent=True) or {}
    code = payload.get('code', '').strip().upper()
    subtotal = payload.get('subtotal')

    if not code:
        return jsonify({'message': 'Coupon code is required.'}), 422
    if subtotal is None:
        return jsonify({'message': 'Order subtotal is required.'}), 422

    try:
        subtotal = Decimal(str(subtotal))
        if subtotal <= 0:
            return jsonify({'message': 'Invalid subtotal.'}), 422
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid subtotal.'}), 422

    coupon = Coupon.query.filter_by(code=code).first()
    if not coupon:
        return jsonify({'message': 'Coupon code is invalid.'}), 404

    if not coupon.is_active:
        return jsonify({'message': 'Coupon is inactive.'}), 422

    if coupon.expiry_date:
        now = datetime.now(timezone.utc)
        if coupon.expiry_date.tzinfo is None:
            expiry_date = coupon.expiry_date.replace(tzinfo=timezone.utc)
        else:
            expiry_date = coupon.expiry_date
        
        if now > expiry_date:
            return jsonify({'message': 'Coupon has expired.'}), 422

    if coupon.max_usage is not None and coupon.used_count >= coupon.max_usage:
        return jsonify({'message': 'Coupon usage limit has been reached.'}), 422

    if subtotal < coupon.min_order_amount:
        return jsonify({'message': f'Minimum order amount of ₹{float(coupon.min_order_amount):.2f} required to apply this coupon.'}), 422

    # Calculate discount
    discount_amount = Decimal('0.00')
    if coupon.discount_type == 'percentage':
        discount_amount = (subtotal * (coupon.discount_value / Decimal('100.0'))).quantize(Decimal('0.01'))
    elif coupon.discount_type == 'fixed':
        discount_amount = coupon.discount_value.quantize(Decimal('0.01'))

    if discount_amount > subtotal:
        discount_amount = subtotal

    new_subtotal = subtotal
    new_gst = ((subtotal - discount_amount) * Decimal('0.05')).quantize(Decimal('0.01'))
    final_total = (subtotal - discount_amount + new_gst).quantize(Decimal('0.01'))

    return jsonify({
        'message': 'Coupon applied successfully.',
        'data': {
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'discount_amount': float(discount_amount),
            'subtotal': float(new_subtotal),
            'gst': float(new_gst),
            'final_total': float(final_total)
        }
    }), 200
