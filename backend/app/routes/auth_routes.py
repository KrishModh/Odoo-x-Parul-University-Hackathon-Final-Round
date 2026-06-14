from flask import Blueprint
from flask_jwt_extended import jwt_required

from ..controllers.auth_controller import (
    current_user, 
    login, 
    resend_otp, 
    signup, 
    verify_otp,
    forgot_password,
    verify_reset_otp,
    reset_password,
    get_profile,
    update_profile,
    update_profile_password
)

auth_bp = Blueprint('auth', __name__)

auth_bp.post('/signup')(signup)
auth_bp.post('/verify-otp')(verify_otp)
auth_bp.post('/resend-otp')(resend_otp)
auth_bp.post('/login')(login)
auth_bp.get('/me')(jwt_required()(current_user))

# Forgot Password
auth_bp.post('/forgot-password')(forgot_password)
auth_bp.post('/verify-reset-otp')(verify_reset_otp)
auth_bp.post('/reset-password')(reset_password)

# Profile Management
auth_bp.get('/profile')(jwt_required()(get_profile))
auth_bp.patch('/profile')(jwt_required()(update_profile))
auth_bp.patch('/profile/password')(jwt_required()(update_profile_password))
