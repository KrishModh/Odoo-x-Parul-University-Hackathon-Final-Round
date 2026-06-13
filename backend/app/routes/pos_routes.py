from flask import Blueprint

from ..controllers.pos_controller import create_order, get_categories, get_products, get_tables
from ..middleware import roles_required

pos_bp = Blueprint('pos', __name__)

pos_bp.get('/categories')(roles_required('cashier', 'admin')(get_categories))
pos_bp.get('/products')(roles_required('cashier', 'admin')(get_products))
pos_bp.get('/tables')(roles_required('cashier', 'admin')(get_tables))
pos_bp.post('/orders')(roles_required('cashier')(create_order))
