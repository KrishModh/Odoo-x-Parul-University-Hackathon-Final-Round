from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..middleware import roles_required
from ..controllers.pos_controller import cancel_order

orders_bp = Blueprint('orders', __name__)

orders_bp.patch('/<int:order_id>/cancel')(jwt_required()(roles_required('cashier', 'admin')(cancel_order)))
