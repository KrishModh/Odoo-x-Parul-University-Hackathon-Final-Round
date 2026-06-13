from flask import Blueprint

from ..controllers.cashier_controller import dashboard
from ..middleware import roles_required

cashier_bp = Blueprint('cashier', __name__)

cashier_bp.get('/dashboard')(roles_required('cashier')(dashboard))
