from flask import Blueprint
from ..controllers.kitchen_controller import get_kitchen_orders, update_kitchen_order_status
from ..middleware import roles_required

kitchen_bp = Blueprint('kitchen', __name__)

kitchen_bp.get('/orders')(roles_required('kitchen', 'admin')(get_kitchen_orders))
kitchen_bp.patch('/orders/<int:order_id>/status')(roles_required('kitchen', 'admin')(update_kitchen_order_status))
