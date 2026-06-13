from decimal import Decimal
from uuid import uuid4

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models import CafeTable, Category, Order, OrderItem, OrderStatus, Product
from ..services.sample_pos_data import SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, SAMPLE_TABLES, calculate_totals


def get_categories():
    categories = Category.query.order_by(Category.display_order.asc(), Category.name.asc()).all()
    return jsonify({'data': [category.to_dict() for category in categories] or SAMPLE_CATEGORIES})


def get_products():
    products = Product.query.filter_by(is_active=True).order_by(Product.name.asc()).all()
    return jsonify({'data': [product.to_dict() for product in products] or SAMPLE_PRODUCTS})


def get_tables():
    tables = CafeTable.query.order_by(CafeTable.id.asc()).all()
    return jsonify({'data': [table.to_dict() for table in tables] or SAMPLE_TABLES})


def create_order():
    payload = request.get_json(silent=True) or {}
    table_id = payload.get('table_id')
    items = payload.get('items') or []

    if not table_id:
        return jsonify({'message': 'Please select a table before creating an order.'}), 422
    if not items:
        return jsonify({'message': 'Cart is empty. Add at least one item.'}), 422

    table_exists = db.session.get(CafeTable, table_id) or any(table['id'] == table_id for table in SAMPLE_TABLES)
    if not table_exists:
        return jsonify({'message': 'Selected table is not available.'}), 422

    normalized_items, error = _normalize_items(items)
    if error:
        return jsonify({'message': error}), 422

    subtotal, gst, total = calculate_totals(normalized_items)
    order = Order(
        order_number=f'POS-{uuid4().hex[:8].upper()}',
        table_id=table_id if db.session.get(CafeTable, table_id) else None,
        cashier_id=int(get_jwt_identity()),
        status=OrderStatus.CART,
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
    return jsonify({'message': 'Order saved to cart.', 'data': order.to_dict()}), 201


def _normalize_items(items):
    normalized = []
    for item in items:
        quantity = int(item.get('quantity') or 0)
        product_id = item.get('product_id')
        if quantity <= 0:
            return [], 'Every item must have a quantity greater than zero.'

        product = db.session.get(Product, product_id) if product_id else None
        if product:
            normalized.append({'product_id': product.id, 'name': product.name, 'price': float(product.price), 'quantity': quantity})
            continue

        sample = next((sample_product for sample_product in SAMPLE_PRODUCTS if sample_product['id'] == product_id), None)
        if not sample:
            return [], 'One or more cart products are not available.'
        normalized.append({'product_id': sample['id'], 'name': sample['name'], 'price': sample['price'], 'quantity': quantity})

    return normalized, None
