from flask import Blueprint
from ..controllers.payment_controller import create_payment_order, verify_payment, process_cash_payment
from ..middleware import roles_required

payment_bp = Blueprint('payment', __name__)

payment_bp.post('/create-order')(roles_required('cashier')(create_payment_order))
payment_bp.post('/verify')(roles_required('cashier')(verify_payment))
payment_bp.post('/charge-cash')(roles_required('cashier')(process_cash_payment))
