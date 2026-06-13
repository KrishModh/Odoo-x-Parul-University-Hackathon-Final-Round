from decimal import Decimal, InvalidOperation

from flask import jsonify, request

from ..extensions import db
from ..models import Category, Order, Product
from ..services.cloudinary_service import upload_image


def dashboard():
    products = Product.query.order_by(Product.name.asc()).all()
    low_stock = [product for product in products if product.quantity <= 5]
    orders_count = Order.query.count()
    return jsonify({
        'metrics': {
            'products': len(products),
            'active_products': sum(1 for product in products if product.is_active),
            'low_stock': len(low_stock),
            'orders': orders_count,
        },
        'products': [product.to_dict() for product in products],
    })


def list_categories():
    categories = Category.query.order_by(Category.display_order.asc(), Category.name.asc()).all()
    return jsonify({'data': [category.to_dict() for category in categories]})


def list_products():
    products = Product.query.order_by(Product.name.asc()).all()
    return jsonify({'data': [product.to_dict() for product in products]})


def create_product():
    data, image_error = _extract_product_payload()
    if image_error:
        return jsonify({'message': image_error}), 422

    product, error = _build_product(Product(), data)
    if error:
        return jsonify({'message': error}), 422

    db.session.add(product)
    db.session.commit()
    return jsonify({'message': 'Product added to inventory.', 'data': product.to_dict()}), 201


def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found.'}), 404

    data, image_error = _extract_product_payload()
    if image_error:
        return jsonify({'message': image_error}), 422

    product, error = _build_product(product, data, partial=True)
    if error:
        return jsonify({'message': error}), 422

    db.session.commit()
    return jsonify({'message': 'Product updated.', 'data': product.to_dict()})


def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found.'}), 404
    product.is_active = False
    product.stock_status = 'archived'
    db.session.commit()
    return jsonify({'message': 'Product archived.', 'data': product.to_dict()})


def list_orders():
    orders = Order.query.order_by(Order.created_at.desc()).limit(50).all()
    return jsonify({'data': [order.to_dict() for order in orders]})


def _extract_product_payload():
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict()
        image = request.files.get('image')
        if image:
            try:
                data['image_url'] = upload_image(image, folder='velluto-cafe/products')['secure_url']
            except Exception:
                return {}, 'Image upload failed. Check Cloudinary configuration.'
        return data, None
    return request.get_json(silent=True) or {}, None


def _build_product(product, data, partial=False):
    required = ['name', 'price', 'quantity', 'category_id']
    missing = [field for field in required if not partial and not str(data.get(field, '')).strip()]
    if missing:
        return product, f"Missing required fields: {', '.join(missing)}."

    if 'name' in data:
        product.name = str(data['name']).strip()
    if 'description' in data:
        product.description = str(data.get('description') or '').strip()
    if 'image_url' in data and str(data.get('image_url', '')).strip():
        product.image_url = str(data['image_url']).strip()
    elif not partial and not product.image_url:
        return product, 'Product image is required.'

    if 'price' in data:
        try:
            product.price = Decimal(str(data['price']))
        except (InvalidOperation, ValueError):
            return product, 'Price must be a valid number.'

    if 'quantity' in data:
        try:
            product.quantity = max(0, int(data['quantity']))
        except (TypeError, ValueError):
            return product, 'Quantity must be a whole number.'

    if 'category_id' in data:
        category = db.session.get(Category, int(data['category_id']))
        if not category:
            return product, 'Selected category does not exist.'
        product.category_id = category.id

    if 'is_active' in data:
        product.is_active = str(data['is_active']).lower() not in ('false', '0', 'no')

    product.stock_status = _stock_status(product.quantity, product.is_active)
    return product, None


def _stock_status(quantity, is_active=True):
    if not is_active:
        return 'archived'
    if quantity <= 0:
        return 'out_of_stock'
    if quantity <= 5:
        return 'low_stock'
    return 'in_stock'
