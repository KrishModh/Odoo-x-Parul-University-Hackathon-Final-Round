import secrets
import traceback
from datetime import datetime, timezone

from flask import jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity

from ..extensions import db
from ..models.kitchen_user import KitchenUser
from ..services.email_service import send_otp_email
from ..utils.validators import (
    validate_resend_otp_payload,
    validate_signup_payload,
    validate_verify_otp_payload,
)
from .auth_controller import (
    OTP_RESEND_COOLDOWN,
    OTP_TTL,
    _build_otp,
    _resend_available_in,
    _utcnow,
)


def kitchen_signup():
    payload = request.get_json(silent=True) or {}
    errors = validate_signup_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    
    # Ensure KitchenUser.email has a DB index to prevent slow O(N) sequential scans
    existing_user = KitchenUser.query.filter_by(email=email).first()
    if existing_user:
        message = 'An account with this email already exists.'
        if not existing_user.is_verified:
            message = 'An account with this email already exists but is still waiting for verification.'
        return jsonify({'message': message, 'requires_verification': not existing_user.is_verified}), 409

    try:
        user = KitchenUser(
            name=payload['name'].strip(),
            email=email,
            role='kitchen',
            cafe_name=str(payload.get('cafe_name', '')).strip() or 'Velluto Cafe',
            employee_code=f'KIT-{secrets.token_hex(3).upper()}'
        )
        user.set_password(payload['password'])
        
        otp_code, otp_expiry = _build_otp()
        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        
        db.session.add(user)
        # Commit changes to the DB first. If it fails, no useless email is sent.
        db.session.commit()

        # PERFORMANCE FIX: Call external email service AFTER DB commit.
        # Ideally, offload this to a background queue (e.g., Celery, Flask-Executor).
        send_otp_email(to=user.email, name=user.name, otp_code=otp_code)

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'Account creation failed. Please try again.'}), 500

    return jsonify({
        'message': 'We sent a 6-digit verification code to your email.',
        'email': user.email,
        'expires_in': int(OTP_TTL.total_seconds()),
        'resend_available_in': int(OTP_RESEND_COOLDOWN.total_seconds()),
    }), 201


def kitchen_verify_otp():
    payload = request.get_json(silent=True) or {}
    errors = validate_verify_otp_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    otp_code = payload['otp_code'].strip()
    
    user = KitchenUser.query.filter_by(email=email).first()

    if not user:
        return jsonify({'message': 'No account was found for that email address.'}), 404
    if user.is_verified:
        return jsonify({'message': 'This email is already verified.'}), 409
    if not user.otp_code or not user.otp_expiry:
        return jsonify({'message': 'No active verification code was found. Please request a new OTP.'}), 400
    if user.otp_expiry < _utcnow():
        return jsonify({'message': 'This verification code has expired. Please request a new OTP.', 'otp_expired': True}), 400
    if user.otp_code != otp_code:
        return jsonify({'message': 'The verification code is incorrect.'}), 400

    try:
        user.is_verified = True
        user.otp_code = None
        user.otp_expiry = None
        db.session.commit()
    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'We could not verify your email right now. Please try again.'}), 500

    return jsonify({'message': 'Email verified successfully. You can now log in.'})


def kitchen_resend_otp():
    payload = request.get_json(silent=True) or {}
    errors = validate_resend_otp_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    user = KitchenUser.query.filter_by(email=email).first()

    if not user:
        return jsonify({'message': 'No account was found for that email address.'}), 404
    if user.is_verified:
        return jsonify({'message': 'This email is already verified.'}), 409

    now = _utcnow()
    resend_available_in = _resend_available_in(user, now)
    if resend_available_in > 0:
        return jsonify({
            'message': f'Please wait {resend_available_in} seconds before requesting another OTP.',
            'resend_available_in': resend_available_in,
        }), 429

    try:
        otp_code, otp_expiry = _build_otp(now)
        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        
        db.session.commit()
        
        # PERFORMANCE FIX: Send email after committing state to database
        send_otp_email(to=user.email, name=user.name, otp_code=otp_code)
    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'We could not send a new OTP right now. Please try again.'}), 500

    return jsonify({
        'message': 'A new verification code has been sent to your email.',
        'email': user.email,
        'expires_in': int(OTP_TTL.total_seconds()),
        'resend_available_in': int(OTP_RESEND_COOLDOWN.total_seconds()),
    })


def kitchen_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email', '')).strip().lower()
    password = str(payload.get('password', ''))

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 422

    user = KitchenUser.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'The email or password is incorrect.'}), 401
    if not user.is_active:
        return jsonify({'message': 'This account has been deactivated.'}), 403
    if not user.is_verified:
        return jsonify({
            'message': 'Please verify your email before logging in.',
            'requires_verification': True,
            'email': user.email,
        }), 403

    return jsonify(_kitchen_auth_response(user, 'Welcome back.'))


def kitchen_current_user():
    user = db.session.get(KitchenUser, int(get_jwt_identity()))
    if not user:
        return jsonify({'message': 'Kitchen staff account not found.'}), 404
    
    # Note: Because KitchenUser holds everything natively in its own table here,
    # it avoids the redundant N+1 query join issue that the regular Employee model had.
    return jsonify({'user': user.to_dict()})


def _kitchen_auth_response(user, message):
    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return {'message': message, 'access_token': token, 'user': user.to_dict()}