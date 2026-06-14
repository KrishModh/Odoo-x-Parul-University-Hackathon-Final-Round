from datetime import datetime, timezone
from flask import jsonify, request
from ..extensions import db
from ..models import Order, OrderStatus, Product, Category
from .notification_controller import create_notification

def get_kitchen_orders():
    """Fetch all active kitchen orders (status = sent_to_kitchen)."""
    try:
        orders = (
            Order.query
            .filter(Order.status == OrderStatus.SENT_TO_KITCHEN)
            .order_by(Order.created_at.asc())
            .all()
        )
        data = []
        for order in orders:
            d = order.to_dict()
            d['item_count'] = sum(i.quantity for i in order.items)
            data.append(d)
        return jsonify({'data': data}), 200
    except Exception as e:
        print(f"Error fetching kitchen orders: {e}")
        return jsonify({'message': 'Failed to retrieve kitchen orders.'}), 500


def get_kitchen_menu():
    """Return active products with category info for kitchen menu view."""
    try:
        products = (
            Product.query
            .filter_by(is_active=True)
            .order_by(Product.name.asc())
            .all()
        )
        categories = Category.query.order_by(Category.display_order.asc(), Category.name.asc()).all()
        cat_map = {c.id: c.name for c in categories}

        data = []
        for p in products:
            data.append({
                'id': p.id,
                'name': p.name,
                'price': float(p.price),
                'category': cat_map.get(p.category_id, 'Uncategorised'),
                'category_id': p.category_id,
                'is_active': p.is_active,
                'image_url': getattr(p, 'image_url', None),
            })
        return jsonify({'data': data, 'categories': [c.name for c in categories]}), 200
    except Exception as e:
        print(f"Error fetching kitchen menu: {e}")
        return jsonify({'message': 'Failed to retrieve menu items.'}), 500


def get_kitchen_stats():
    """Return quick stats for kitchen dashboard header badges."""
    try:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        completed_today = (
            Order.query
            .filter(
                Order.status == OrderStatus.SENT_TO_KITCHEN,
                Order.kitchen_status == 'completed',
                Order.kitchen_completed_at >= today_start,
            )
            .count()
        )
        to_cook = (
            Order.query
            .filter(
                Order.status == OrderStatus.SENT_TO_KITCHEN,
                Order.kitchen_status == 'to_cook',
            )
            .count()
        )
        preparing = (
            Order.query
            .filter(
                Order.status == OrderStatus.SENT_TO_KITCHEN,
                Order.kitchen_status == 'preparing',
            )
            .count()
        )
        return jsonify({
            'data': {
                'to_cook': to_cook,
                'preparing': preparing,
                'completed_today': completed_today,
            }
        }), 200
    except Exception as e:
        print(f"Error fetching kitchen stats: {e}")
        return jsonify({'message': 'Failed to retrieve stats.'}), 500


def update_kitchen_order_status(order_id):
    payload = request.get_json(silent=True) or {}
    new_status = payload.get('status')
    
    if new_status not in ['to_cook', 'preparing', 'completed']:
        return jsonify({'message': 'Invalid kitchen status.'}), 422
        
    try:
        order = db.session.get(Order, order_id)
        if not order:
            return jsonify({'message': 'Order not found.'}), 404
            
        order.kitchen_status = new_status
        if new_status == 'preparing':
            order.kitchen_started_at = datetime.now(timezone.utc)
        elif new_status == 'completed':
            order.kitchen_completed_at = datetime.now(timezone.utc)
            
        db.session.commit()

        if new_status == 'preparing':
            create_notification(
                title="Order Preparing",
                message=f"Order {order.order_number} is now being prepared in the kitchen.",
                notification_type="preparing"
            )
        elif new_status == 'completed':
            create_notification(
                title="Order Completed",
                message=f"Order {order.order_number} has been completed and is ready for pickup/serving.",
                notification_type="completed"
            )

        return jsonify({'message': 'Order status updated successfully.', 'data': order.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating kitchen order status: {e}")
        return jsonify({'message': 'Failed to update order status.'}), 500
