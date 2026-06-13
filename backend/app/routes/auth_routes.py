from flask import Blueprint
from flask_jwt_extended import jwt_required

from ..controllers.auth_controller import current_user, login, resend_otp, signup, verify_otp

auth_bp = Blueprint('auth', __name__)

auth_bp.post('/signup')(signup)
auth_bp.post('/verify-otp')(verify_otp)
auth_bp.post('/resend-otp')(resend_otp)
auth_bp.post('/login')(login)
auth_bp.get('/me')(jwt_required()(current_user))
