from flask import jsonify, request
from ..extensions import db
from ..models.notification import Notification

def get_notifications():
    try:
        notifications = Notification.query.order_by(Notification.created_at.desc()).limit(100).all()
        return jsonify({
            'status': 'success',
            'data': [n.to_dict() for n in notifications]
        }), 200
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return jsonify({'message': 'Failed to retrieve notifications.'}), 500

def mark_notification_as_read(notification_id):
    try:
        notification = db.session.get(Notification, notification_id)
        if not notification:
            return jsonify({'message': 'Notification not found.'}), 404
        
        notification.is_read = True
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Notification marked as read.',
            'data': notification.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error marking notification as read: {e}")
        return jsonify({'message': 'Failed to update notification.'}), 500

def mark_all_notifications_as_read():
    try:
        Notification.query.filter_by(is_read=False).update({Notification.is_read: True}, synchronize_session=False)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'All notifications marked as read.'
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error marking all notifications as read: {e}")
        return jsonify({'message': 'Failed to update notifications.'}), 500

def create_notification(title, message, notification_type='info'):
    """Helper function to create notifications internally from backend processes"""
    try:
        notification = Notification(
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception as e:
        db.session.rollback()
        print(f"Failed to create notification '{title}': {e}")
        return None
