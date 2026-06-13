from datetime import datetime, timezone
from flask import jsonify, request
from ..extensions import db
from ..models import Order, OrderStatus

def get_kitchen_orders():
    # Fetch orders that are sent to kitchen
    try:
        orders = Order.query.filter(Order.status == OrderStatus.SENT_TO_KITCHEN).order_by(Order.created_at.asc()).all()
        return jsonify({'data': [order.to_dict() for order in orders]}), 200
    except Exception as e:
        print(f"Error fetching kitchen orders: {e}")
        return jsonify({'message': 'Failed to retrieve kitchen orders.'}), 500


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
        return jsonify({'message': 'Order status updated successfully.', 'data': order.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating kitchen order status: {e}")
        return jsonify({'message': 'Failed to update order status.'}), 500
