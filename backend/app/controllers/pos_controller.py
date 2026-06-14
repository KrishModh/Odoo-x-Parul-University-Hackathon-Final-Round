from decimal import Decimal
from uuid import uuid4

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models import CafeTable, Category, Order, OrderItem, OrderStatus, Product
from ..services.sample_pos_data import SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, calculate_totals
from .notification_controller import create_notification


def get_categories():
    categories = Category.query.order_by(Category.display_order.asc(), Category.name.asc()).all()
    return jsonify({'data': [category.to_dict() for category in categories] or SAMPLE_CATEGORIES})


def get_products():
    products = Product.query.filter_by(is_active=True).order_by(Product.name.asc()).all()
    return jsonify({'data': [product.to_dict() for product in products] or SAMPLE_PRODUCTS})


def get_tables():
    tables = CafeTable.query.filter_by(is_active=True).order_by(CafeTable.id.asc()).all()
    return jsonify({'data': [table.to_dict() for table in tables]})


def create_order():
    payload = request.get_json(silent=True) or {}
    table_id = payload.get('table_id')
    items = payload.get('items') or []

    if not table_id:
        return jsonify({'message': 'Please select a table before creating an order.'}), 422
    if not items:
        return jsonify({'message': 'Cart is empty. Add at least one item.'}), 422

    table = db.session.get(CafeTable, table_id)
    if not table or not table.is_active:
        return jsonify({'message': 'Selected table is not available.'}), 422

    normalized_items, error = _normalize_items(items)
    if error:
        return jsonify({'message': error}), 422

    subtotal, gst, total = calculate_totals(normalized_items)
    order = Order(
        order_number=f'POS-{uuid4().hex[:8].upper()}',
        table_id=table.id,
        cashier_id=int(get_jwt_identity()),
        status=OrderStatus.SENT_TO_KITCHEN,
        subtotal=subtotal,
        gst=gst,
        total=total,
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
    
    # Generate notifications for New order / New cashier order
    create_notification(
        title="New Order Received",
        message=f"Order {order.order_number} has been received for Table {order.table.name if order.table else 'Takeaway'}.",
        notification_type="new_order"
    )
    create_notification(
        title="New Cashier Order",
        message=f"A new cashier order {order.order_number} has been placed.",
        notification_type="cashier_order"
    )

    return jsonify({'message': 'Order sent to kitchen.', 'data': order.to_dict()}), 201


def _normalize_items(items):
    normalized = []
    for item in items:
        quantity = int(item.get('quantity') or 0)
        product_id = item.get('product_id')
        if quantity <= 0:
            return [], 'Every item must have a quantity greater than zero.'

        product = db.session.get(Product, product_id) if product_id else None
        if product:
            if not product.is_active:
                return [], f'{product.name} is not available.'
            if product.quantity < quantity:
                return [], f'Only {product.quantity} {product.name} left in stock.'
            normalized.append({'product_id': product.id, 'name': product.name, 'price': float(product.price), 'quantity': quantity})
            continue

        sample = next((sample_product for sample_product in SAMPLE_PRODUCTS if sample_product['id'] == product_id), None)
        if not sample:
            return [], 'One or more cart products are not available.'
        normalized.append({'product_id': sample['id'], 'name': sample['name'], 'price': sample['price'], 'quantity': quantity})

    return normalized, None


def deduct_order_inventory(order):
    if order.inventory_deducted:
        return None

    for item in order.items:
        if not item.product_id:
            continue
        product = db.session.get(Product, item.product_id)
        if not product or not product.is_active:
            return f'{item.product_name} is not available.'
        if product.quantity < item.quantity:
            return f'Only {product.quantity} {product.name} left in stock.'

    for item in order.items:
        if not item.product_id:
            continue
        product = db.session.get(Product, item.product_id)
        product.quantity = max(0, product.quantity - item.quantity)
        product.stock_status = _stock_status(product.quantity, product.is_active)
        if product.quantity <= 5:
            create_notification(
                title="Low Stock Warning",
                message=f"Product '{product.name}' is running low (Remaining stock: {product.quantity}).",
                notification_type="low_stock"
            )

    order.inventory_deducted = True
    return None


def _stock_status(quantity, is_active=True):
    if not is_active:
        return 'archived'
    if quantity <= 0:
        return 'out_of_stock'
    if quantity <= 5:
        return 'low_stock'
    return 'in_stock'


def cancel_order(order_id):
    try:
        order = db.session.get(Order, order_id)
        if not order:
            return jsonify({'message': 'Order not found.'}), 404
        
        # Check order lifecycle status
        if order.status == OrderStatus.CANCELLED:
            return jsonify({'message': 'Order is already cancelled.'}), 400
            
        if order.kitchen_status in ['preparing', 'completed']:
            return jsonify({'message': 'Order already accepted by kitchen.'}), 400
        
        # Restore stock if inventory was deducted
        if order.inventory_deducted:
            for item in order.items:
                if not item.product_id:
                    continue
                product = db.session.get(Product, item.product_id)
                if product:
                    product.quantity += item.quantity
                    product.stock_status = _stock_status(product.quantity, product.is_active)
            order.inventory_deducted = False

        # Set status to CANCELLED
        order.status = OrderStatus.CANCELLED
        order.kitchen_status = 'cancelled'
        
        # Reset table status if associated
        if order.table:
            order.table.status = 'available'
        
        db.session.commit()
        
        # Generate cancellation notifications
        create_notification(
            title="Order Cancelled",
            message=f"Order {order.order_number} has been cancelled.",
            notification_type="order_cancelled"
        )
        
        return jsonify({'message': 'Order cancelled successfully.', 'data': order.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error cancelling order: {e}")
        return jsonify({'message': 'Failed to cancel order.'}), 500
