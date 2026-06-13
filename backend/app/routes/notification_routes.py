from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.notification_controller import (
    get_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read
)

notification_bp = Blueprint('notification_bp', __name__)

notification_bp.get('')(jwt_required()(get_notifications))
notification_bp.patch('/<int:id>/read')(jwt_required()(mark_notification_as_read))
notification_bp.patch('/read-all')(jwt_required()(mark_all_notifications_as_read))
