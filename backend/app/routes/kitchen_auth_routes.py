from flask import Blueprint
from flask_jwt_extended import jwt_required

from ..controllers.kitchen_auth_controller import (
    kitchen_signup,
    kitchen_verify_otp,
    kitchen_resend_otp,
    kitchen_login,
    kitchen_current_user,
)

kitchen_auth_bp = Blueprint('kitchen_auth', __name__)

kitchen_auth_bp.post('/signup')(kitchen_signup)
kitchen_auth_bp.post('/verify-otp')(kitchen_verify_otp)
kitchen_auth_bp.post('/resend-otp')(kitchen_resend_otp)
kitchen_auth_bp.post('/login')(kitchen_login)
kitchen_auth_bp.get('/me')(jwt_required()(kitchen_current_user))
