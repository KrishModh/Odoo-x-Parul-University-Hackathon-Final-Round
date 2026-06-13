from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..models import User


def dashboard():
    user = db.session.get(User, int(get_jwt_identity()))
    cafe_name = user.employee.cafe_name if user and user.employee else 'Crema Cafe'

    return jsonify({
        'message': 'Dashboard loaded successfully.',
        'data': {
            'cafe_name': cafe_name,
            'summary': [
                {'label': "Today's sales", 'value': '₹18,420', 'detail': '+12.5% from yesterday', 'tone': 'coffee'},
                {'label': 'Total orders', 'value': '86', 'detail': '14 currently active', 'tone': 'sage'},
                {'label': 'Guests served', 'value': '134', 'detail': 'Average 1.6 per order', 'tone': 'peach'},
                {'label': 'Avg. order value', 'value': '₹214', 'detail': '+₹18 this week', 'tone': 'blue'},
            ],
            'tables': [
                {'name': 'Table 01', 'status': 'occupied', 'seats': 4, 'order': 'Order #1042', 'total': '₹860'},
                {'name': 'Table 02', 'status': 'available', 'seats': 2},
                {'name': 'Table 03', 'status': 'reserved', 'seats': 4, 'order': 'Reserved · 1:30 PM'},
                {'name': 'Table 04', 'status': 'occupied', 'seats': 6, 'order': 'Order #1046', 'total': '₹1,240'},
                {'name': 'Table 05', 'status': 'available', 'seats': 2},
                {'name': 'Patio 01', 'status': 'occupied', 'seats': 4, 'order': 'Order #1048', 'total': '₹540'},
            ],
            'orders': [
                {'id': '#1048', 'customer': 'Patio 01', 'items': 3, 'time': '2 min ago', 'status': 'preparing', 'total': '₹540'},
                {'id': '#1047', 'customer': 'Takeaway', 'items': 2, 'time': '6 min ago', 'status': 'ready', 'total': '₹380'},
                {'id': '#1046', 'customer': 'Table 04', 'items': 7, 'time': '12 min ago', 'status': 'preparing', 'total': '₹1,240'},
                {'id': '#1045', 'customer': 'Maya', 'items': 2, 'time': '18 min ago', 'status': 'served', 'total': '₹320'},
            ],
            'categories': [
                {'name': 'Coffee', 'count': 18, 'emoji': '☕', 'color': '#e6d3c1'},
                {'name': 'Cold drinks', 'count': 12, 'emoji': '🥤', 'color': '#cfe3df'},
                {'name': 'Breakfast', 'count': 9, 'emoji': '🥐', 'color': '#f3ddad'},
                {'name': 'Desserts', 'count': 14, 'emoji': '🍰', 'color': '#ead0d0'},
            ],
        },
    })
