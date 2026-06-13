from flask import Blueprint
from flask_jwt_extended import jwt_required

from ..controllers.auth_controller import current_user, login, signup

auth_bp = Blueprint('auth', __name__)

auth_bp.post('/signup')(signup)
auth_bp.post('/login')(login)
auth_bp.get('/me')(jwt_required()(current_user))
