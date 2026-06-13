import secrets

from flask import jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity

from ..extensions import db
from ..models import Employee, User, UserRole
from ..utils.validators import validate_signup_payload


def signup():
    payload = request.get_json(silent=True) or {}
    errors = validate_signup_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'An account with this email already exists.'}), 409

    try:
        user = User(name=payload['name'].strip(), email=email, role=UserRole.CASHIER)
        user.set_password(payload['password'])
        db.session.add(user)
        db.session.flush()

        employee = Employee(
            user_id=user.id,
            cafe_name=payload['cafe_name'].strip(),
            employee_code=f'CSH-{secrets.token_hex(3).upper()}',
        )
        db.session.add(employee)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'message': 'Account creation failed. Please try again.'}), 500

    return jsonify(_auth_response(user, 'Your cashier account is ready.')), 201


def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email', '')).strip().lower()
    password = str(payload.get('password', ''))

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 422

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'The email or password is incorrect.'}), 401
    if not user.is_active:
        return jsonify({'message': 'This account has been deactivated.'}), 403

    return jsonify(_auth_response(user, 'Welcome back.'))


def current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({'message': 'User account not found.'}), 404
    data = user.to_dict()
    data['employee'] = user.employee.to_dict() if user.employee else None
    return jsonify({'user': data})


def _auth_response(user, message):
    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role.value})
    data = user.to_dict()
    data['employee'] = user.employee.to_dict() if user.employee else None
    return {'message': message, 'access_token': token, 'user': data}
