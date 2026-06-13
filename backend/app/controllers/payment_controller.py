import razorpay
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
from flask import current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models import CafeTable, Order, OrderItem, OrderStatus, Coupon
from ..services.sample_pos_data import calculate_totals, SAMPLE_TABLES
from .pos_controller import _normalize_items

def create_payment_order():
    payload = request.get_json(silent=True) or {}
    table_id = payload.get('table_id')
    items = payload.get('items') or []
    customer_name = payload.get('customer_name')
    customer_email = payload.get('customer_email')
    customer_phone = payload.get('customer_phone')
    coupon_code = payload.get('coupon_code')
    
    if not table_id:
        return jsonify({'message': 'Please select a table before creating an order.'}), 422
    if not items:
        return jsonify({'message': 'Cart is empty. Add at least one item.'}), 422
    if not customer_name:
        return jsonify({'message': 'Customer name is required.'}), 422
    if not customer_email:
        return jsonify({'message': 'Customer email is required.'}), 422
    if not customer_phone:
        return jsonify({'message': 'Customer phone number is required.'}), 422

    # Validate table
    table_exists = db.session.get(CafeTable, table_id) or any(table['id'] == table_id for table in SAMPLE_TABLES)
    if not table_exists:
        return jsonify({'message': 'Selected table is not available.'}), 422

    # Normalize items and calculate total
    normalized_items, error = _normalize_items(items)
    if error:
        return jsonify({'message': error}), 422

    subtotal, gst, total = calculate_totals(normalized_items)

    # Process coupon if provided
    discount_amount = Decimal('0.00')
    calculated_final_total = total
    validated_coupon_code = None

    if coupon_code:
        validated_coupon_code = coupon_code.strip().upper()
        coupon = Coupon.query.filter_by(code=validated_coupon_code).first()
        if not coupon:
            return jsonify({'message': 'Coupon code is invalid.'}), 422
        if not coupon.is_active:
            return jsonify({'message': 'Coupon is inactive.'}), 422
        if coupon.expiry_date:
            now = datetime.now(timezone.utc)
            expiry_date = coupon.expiry_date.replace(tzinfo=timezone.utc) if coupon.expiry_date.tzinfo is None else coupon.expiry_date
            if now > expiry_date:
                return jsonify({'message': 'Coupon has expired.'}), 422
        if coupon.max_usage is not None and coupon.used_count >= coupon.max_usage:
            return jsonify({'message': 'Coupon usage limit has been reached.'}), 422
        if subtotal < coupon.min_order_amount:
            return jsonify({'message': f'Minimum order amount of ₹{float(coupon.min_order_amount):.2f} required to apply this coupon.'}), 422

        if coupon.discount_type == 'percentage':
            discount_amount = (subtotal * (coupon.discount_value / Decimal('100.0'))).quantize(Decimal('0.01'))
        elif coupon.discount_type == 'fixed':
            discount_amount = coupon.discount_value.quantize(Decimal('0.01'))

        if discount_amount > subtotal:
            discount_amount = subtotal

        # Recalculate gst on discounted subtotal
        gst = ((subtotal - discount_amount) * Decimal('0.05')).quantize(Decimal('0.01'))
        calculated_final_total = (subtotal - discount_amount + gst).quantize(Decimal('0.01'))

    # Initialize Razorpay Client
    key_id = current_app.config['RAZORPAY_KEY_ID']
    secret = current_app.config['RAZORPAY_SECRET']
    if not key_id or not secret:
        return jsonify({'message': 'Razorpay payment gateway is not configured on the server.'}), 500

    try:
        client = razorpay.Client(auth=(key_id, secret))
        # Amount in paise using calculated_final_total
        razorpay_amount = int(float(calculated_final_total) * 100)
        
        razorpay_order = client.order.create({
            'amount': razorpay_amount,
            'currency': 'INR',
            'payment_capture': '1'
        })
    except Exception as e:
        print(f"Razorpay order creation failed: {e}")
        return jsonify({'message': 'Payment gateway failed to initialize. Please try again.'}), 500

    try:
        # Create database Order
        order = Order(
            order_number=f'POS-{uuid4().hex[:8].upper()}',
            table_id=table_id if db.session.get(CafeTable, table_id) else None,
            cashier_id=int(get_jwt_identity()),
            status=OrderStatus.CART,
            subtotal=subtotal,
            gst=gst,
            total=total,
            coupon_code=validated_coupon_code,
            discount_amount=discount_amount,
            final_total=calculated_final_total,
            payment_status='pending',
            razorpay_order_id=razorpay_order['id'],
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone
        )
        db.session.add(order)
        db.session.flush()

        for item in normalized_items:
            db.session.add(OrderItem(
                order_id=order.id,
                product_id=item.get('product_id'),
                product_name=item['name'],
                quantity=item['quantity'],
                unit_price=Decimal(str(item['price'])),
                line_total=Decimal(str(item['price'])) * item['quantity'],
            ))

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Saving order failed: {e}")
        return jsonify({'message': 'Failed to save order details. Please try again.'}), 500

    return jsonify({
        'order_id': razorpay_order['id'],
        'amount': razorpay_amount,
        'currency': 'INR',
        'razorpay_key': key_id,
        'db_order_id': order.id
    }), 201


def verify_payment():
    payload = request.get_json(silent=True) or {}
    razorpay_order_id = payload.get('razorpay_order_id')
    razorpay_payment_id = payload.get('razorpay_payment_id')
    razorpay_signature = payload.get('razorpay_signature')

    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return jsonify({'message': 'Missing signature verification parameters.'}), 422

    key_id = current_app.config['RAZORPAY_KEY_ID']
    secret = current_app.config['RAZORPAY_SECRET']
    if not key_id or not secret:
        return jsonify({'message': 'Razorpay payment gateway is not configured on the server.'}), 500

    try:
        client = razorpay.Client(auth=(key_id, secret))
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
    except Exception as e:
        print(f"Razorpay verification signature mismatch: {e}")
        return jsonify({'message': 'Payment verification failed. Invalid signature.'}), 400

    try:
        # Find database order
        order = Order.query.filter_by(razorpay_order_id=razorpay_order_id).first()
        if not order:
            return jsonify({'message': 'Associated order was not found in the database.'}), 404

        # Fetch payment details from Razorpay to save payment method
        try:
            payment_details = client.payment.fetch(razorpay_payment_id)
            payment_method = payment_details.get('method', 'card')
        except Exception:
            payment_method = 'card'

        order.payment_status = 'paid'
        order.payment_id = razorpay_payment_id
        order.payment_method = payment_method
        order.paid_at = datetime.now(timezone.utc)
        order.status = OrderStatus.SENT_TO_KITCHEN

        # Increment coupon usage count
        if order.coupon_code:
            coupon = Coupon.query.filter_by(code=order.coupon_code).first()
            if coupon:
                coupon.used_count += 1

        db.session.commit()

        # Trigger invoice sending
        from ..services.email_service import start_invoice_email_thread
        start_invoice_email_thread(order)

        return jsonify({
            'message': 'Payment verified and order finalized successfully.',
            'data': order.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error finalizing order status: {e}")
        return jsonify({'message': 'Payment verified but failed to update order status.'}), 500


def process_cash_payment():
    payload = request.get_json(silent=True) or {}
    table_id = payload.get('table_id')
    items = payload.get('items') or []
    customer_name = payload.get('customer_name')
    customer_email = payload.get('customer_email')
    customer_phone = payload.get('customer_phone')
    coupon_code = payload.get('coupon_code')

    if not table_id:
        return jsonify({'message': 'Please select a table before creating an order.'}), 422
    if not items:
        return jsonify({'message': 'Cart is empty. Add at least one item.'}), 422
    if not customer_name:
        return jsonify({'message': 'Customer name is required.'}), 422
    if not customer_email:
        return jsonify({'message': 'Customer email is required.'}), 422
    if not customer_phone:
        return jsonify({'message': 'Customer phone number is required.'}), 422

    # Validate table
    table_exists = db.session.get(CafeTable, table_id) or any(table['id'] == table_id for table in SAMPLE_TABLES)
    if not table_exists:
        return jsonify({'message': 'Selected table is not available.'}), 422

    # Normalize items and calculate total
    normalized_items, error = _normalize_items(items)
    if error:
        return jsonify({'message': error}), 422

    subtotal, gst, total = calculate_totals(normalized_items)

    # Process coupon if provided
    discount_amount = Decimal('0.00')
    calculated_final_total = total
    validated_coupon_code = None

    if coupon_code:
        validated_coupon_code = coupon_code.strip().upper()
        coupon = Coupon.query.filter_by(code=validated_coupon_code).first()
        if not coupon:
            return jsonify({'message': 'Coupon code is invalid.'}), 422
        if not coupon.is_active:
            return jsonify({'message': 'Coupon is inactive.'}), 422
        if coupon.expiry_date:
            now = datetime.now(timezone.utc)
            expiry_date = coupon.expiry_date.replace(tzinfo=timezone.utc) if coupon.expiry_date.tzinfo is None else coupon.expiry_date
            if now > expiry_date:
                return jsonify({'message': 'Coupon has expired.'}), 422
        if coupon.max_usage is not None and coupon.used_count >= coupon.max_usage:
            return jsonify({'message': 'Coupon usage limit has been reached.'}), 422
        if subtotal < coupon.min_order_amount:
            return jsonify({'message': f'Minimum order amount of ₹{float(coupon.min_order_amount):.2f} required to apply this coupon.'}), 422

        if coupon.discount_type == 'percentage':
            discount_amount = (subtotal * (coupon.discount_value / Decimal('100.0'))).quantize(Decimal('0.01'))
        elif coupon.discount_type == 'fixed':
            discount_amount = coupon.discount_value.quantize(Decimal('0.01'))

        if discount_amount > subtotal:
            discount_amount = subtotal

        # Recalculate gst on discounted subtotal
        gst = ((subtotal - discount_amount) * Decimal('0.05')).quantize(Decimal('0.01'))
        calculated_final_total = (subtotal - discount_amount + gst).quantize(Decimal('0.01'))

    try:
        # Create database Order
        order = Order(
            order_number=f'POS-{uuid4().hex[:8].upper()}',
            table_id=table_id if db.session.get(CafeTable, table_id) else None,
            cashier_id=int(get_jwt_identity()),
            status=OrderStatus.SENT_TO_KITCHEN, # Direct to kitchen as it is paid
            subtotal=subtotal,
            gst=gst,
            total=total,
            coupon_code=validated_coupon_code,
            discount_amount=discount_amount,
            final_total=calculated_final_total,
            payment_status='paid',
            payment_id=f'CASH-{uuid4().hex[:8].upper()}',
            payment_method='cash',
            paid_at=datetime.now(timezone.utc),
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone
        )
        db.session.add(order)
        db.session.flush()

        for item in normalized_items:
            db.session.add(OrderItem(
                order_id=order.id,
                product_id=item.get('product_id'),
                product_name=item['name'],
                quantity=item['quantity'],
                unit_price=Decimal(str(item['price'])),
                line_total=Decimal(str(item['price'])) * item['quantity'],
            ))

        # Increment coupon usage count
        if validated_coupon_code:
            coupon = Coupon.query.filter_by(code=validated_coupon_code).first()
            if coupon:
                coupon.used_count += 1

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Saving cash order failed: {e}")
        return jsonify({'message': 'Failed to save order details. Please try again.'}), 500

    # Automatically send invoice email
    from ..services.email_service import start_invoice_email_thread
    start_invoice_email_thread(order)

    return jsonify({
        'message': 'Cash payment completed and order sent to kitchen.',
        'data': order.to_dict()
    }), 201
