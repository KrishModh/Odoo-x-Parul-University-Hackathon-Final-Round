import secrets
import traceback
from datetime import datetime, timedelta, timezone
from ..models import KitchenUser
from flask import jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity

from ..extensions import db
from ..models import Employee, User, UserRole
from ..services.email_service import send_otp_email
from ..utils.validators import (
    validate_resend_otp_payload,
    validate_signup_payload,
    validate_verify_otp_payload,
)

OTP_TTL = timedelta(minutes=5)
OTP_RESEND_COOLDOWN = timedelta(seconds=60)


def signup():
    payload = request.get_json(silent=True) or {}
    errors = validate_signup_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        message = 'An account with this email already exists.'
        if not existing_user.is_verified:
            message = 'An account with this email already exists but is still waiting for verification.'
        return jsonify({'message': message, 'requires_verification': not existing_user.is_verified}), 409

    role_str = str(payload.get('role', 'cashier')).strip().lower()
    if role_str == 'admin':
        return jsonify({'message': 'Registration of Administrator accounts is not permitted.'}), 403
    elif role_str == 'kitchen':
        user_role = UserRole.KITCHEN
    else:
        user_role = UserRole.CASHIER

    try:
        user = User(name=payload['name'].strip(), email=email, role=user_role)
        user.set_password(payload['password'])
        otp_code, otp_expiry = _build_otp()
        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        db.session.add(user)
        db.session.flush()

        prefix = 'KIT' if user_role == UserRole.KITCHEN else 'CSH'
        employee = Employee(
            user_id=user.id,
            cafe_name=str(payload.get('cafe_name', '')).strip() or 'Velluto Cafe',
            employee_code=f'{prefix}-{secrets.token_hex(3).upper()}',
        )
        db.session.add(employee)
        send_otp_email(to=user.email, name=user.name, otp_code=otp_code)
        db.session.commit()
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


def verify_otp():
    payload = request.get_json(silent=True) or {}
    errors = validate_verify_otp_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    otp_code = payload['otp_code'].strip()
    user = User.query.filter_by(email=email).first()

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

    return jsonify({'message': 'Your account is pending admin approval.', 'pending_approval': True})


def resend_otp():
    payload = request.get_json(silent=True) or {}
    errors = validate_resend_otp_payload(payload)
    if errors:
        return jsonify({'message': 'Please correct the highlighted fields.', 'errors': errors}), 422

    email = payload['email'].strip().lower()
    user = User.query.filter_by(email=email).first()

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
        send_otp_email(to=user.email, name=user.name, otp_code=otp_code)
        db.session.commit()
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
        return jsonify({'message': 'Your employee account has been deactivated.'}), 403
    if not user.is_verified:
        return jsonify({
            'message': 'Please verify your email before logging in.',
            'requires_verification': True,
            'email': user.email,
        }), 403
    if user.approval_status == 'pending':
        return jsonify({'message': 'Your account is waiting for admin approval.'}), 403
    if user.approval_status == 'rejected':
        rejection_msg = 'Your account request was rejected.'
        if user.rejection_reason:
            rejection_msg += f" Reason: {user.rejection_reason}"
        return jsonify({'message': rejection_msg}), 403

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


def _utcnow():
    return datetime.now(timezone.utc)


def _build_otp(now=None):
    current_time = now or _utcnow()
    otp_code = f'{secrets.randbelow(1_000_000):06d}'
    return otp_code, current_time + OTP_TTL


def _resend_available_in(user, now):
    if not user.otp_expiry:
        return 0

    sent_at = user.otp_expiry - OTP_TTL
    next_allowed_at = sent_at + OTP_RESEND_COOLDOWN
    if next_allowed_at <= now:
        return 0
    return int((next_allowed_at - now).total_seconds()) + 1


def get_profile():
    user_id = int(get_jwt_identity())
    # Try finding in User model
    user = db.session.get(User, user_id)
    if user:
        return jsonify({'data': user.to_dict()})
        
    # Otherwise check KitchenUser model
    k_user = db.session.get(KitchenUser, user_id)
    if k_user:
        return jsonify({'data': k_user.to_dict()})
        
    return jsonify({'message': 'Profile not found.'}), 404


def update_profile():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    name = payload.get('name')
    email = payload.get('email')
    phone = payload.get('phone')
    profile_image_url = payload.get('profile_image_url')

    user = db.session.get(User, user_id)
    if user:
        if name:
            user.name = name.strip()
        if email:
            email_cleaned = email.strip().lower()
            if email_cleaned != user.email:
                existing = User.query.filter(User.email == email_cleaned).first()
                existing_k = KitchenUser.query.filter(KitchenUser.email == email_cleaned).first()
                if existing or existing_k:
                    return jsonify({'message': 'Email address is already in use.'}), 409
                user.email = email_cleaned
        if user.employee:
            if phone is not None:
                user.employee.phone = phone.strip()
            if profile_image_url is not None:
                user.employee.profile_image_url = profile_image_url.strip()
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully.', 'data': user.to_dict()})

    k_user = db.session.get(KitchenUser, user_id)
    if k_user:
        if name:
            k_user.name = name.strip()
        if email:
            email_cleaned = email.strip().lower()
            if email_cleaned != k_user.email:
                existing = User.query.filter(User.email == email_cleaned).first()
                existing_k = KitchenUser.query.filter(KitchenUser.email == email_cleaned).first()
                if existing or existing_k:
                    return jsonify({'message': 'Email address is already in use.'}), 409
                k_user.email = email_cleaned
        if phone is not None:
            k_user.phone = phone.strip()
        if profile_image_url is not None:
            k_user.profile_image_url = profile_image_url.strip()
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully.', 'data': k_user.to_dict()})

    return jsonify({'message': 'Profile not found.'}), 404


def update_profile_password():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    current_password = payload.get('current_password')
    new_password = payload.get('new_password')

    if not current_password or not new_password:
        return jsonify({'message': 'Current and new passwords are required.'}), 422

    user = db.session.get(User, user_id)
    if user:
        if not user.check_password(current_password):
            return jsonify({'message': 'Incorrect current password.'}), 400
        user.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Password updated successfully.'})

    k_user = db.session.get(KitchenUser, user_id)
    if k_user:
        if not k_user.check_password(current_password):
            return jsonify({'message': 'Incorrect current password.'}), 400
        k_user.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Password updated successfully.'})

    return jsonify({'message': 'Profile not found.'}), 404


def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email', '')).strip().lower()

    if not email:
        return jsonify({'message': 'Email address is required.'}), 422

    # Check both User and KitchenUser models
    user = User.query.filter_by(email=email).first()
    k_user = KitchenUser.query.filter_by(email=email).first()

    if not user and not k_user:
        return jsonify({'message': 'No account was found for that email address.'}), 404

    # Generate 6 digit OTP code
    otp_code = f'{secrets.randbelow(1_000_000):06d}'
    expiry = _utcnow() + timedelta(minutes=5)

    try:
        if user:
            user.set_reset_otp(otp_code)
            user.reset_otp_expiry = expiry
            name = user.name
        else:
            k_user.set_reset_otp(otp_code)
            k_user.reset_otp_expiry = expiry
            name = k_user.name

        # Send Reset OTP email
        subject = 'Reset Your Password - Velluto Cafe'
        html = f"""
        <div style="font-family: Arial, sans-serif; background: #f7f3ee; padding: 32px; color: #3b2b22;">
          <div style="max-width: 560px; margin: 0 auto; background: #fffdf9; border-radius: 20px; padding: 36px; border: 1px solid #eadfd2;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.2em; color: #a87857; font-weight: 700;">VELLUTO CAFE</p>
            <h1 style="margin: 0 0 14px; font-size: 28px; line-height: 1.2;">Reset Your Password</h1>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #6e635c;">
              Hi {name}, use the password reset verification code below to reset your password. This code expires in 5 minutes.
            </p>
            <div style="margin: 0 0 24px; padding: 18px 20px; border-radius: 16px; background: #f3ebe3; border: 1px solid #e4d5c6; text-align: center;">
              <span style="display: block; font-size: 32px; letter-spacing: 0.4em; font-weight: 700; color: #49352a;">{otp_code}</span>
            </div>
            <p style="margin: 0 0 15px; font-size: 13px; line-height: 1.7; color: #8a7b70;">
              This code will expire in 5 minutes. If you did not request a password reset, you can safely ignore this email.
            </p>
            <p style="margin: 0; font-size: 11px; color: #b2a496; border-top: 1px solid #eee7df; padding-top: 15px;">
              For support, write to support@velluto.com
            </p>
          </div>
        </div>
        """
        from ..services.email_service import send_email
        send_email(email, subject, html)
        db.session.commit()
    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'Failed to send password reset email. Please try again.'}), 500

    return jsonify({'message': 'A 6-digit password reset OTP has been sent to your email.'})


def verify_reset_otp():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email', '')).strip().lower()
    otp_code = str(payload.get('otp_code', '')).strip()

    if not email or not otp_code:
        return jsonify({'message': 'Email and verification code are required.'}), 422

    user = User.query.filter_by(email=email).first()
    k_user = KitchenUser.query.filter_by(email=email).first()

    if not user and not k_user:
        return jsonify({'message': 'No account was found for that email address.'}), 404

    target = user if user else k_user
    if not target.reset_otp_hash or not target.reset_otp_expiry:
        return jsonify({'message': 'No active reset request found.'}), 400

    if target.reset_otp_expiry < _utcnow():
        return jsonify({'message': 'The verification code has expired. Please request a new OTP.'}), 400

    if not target.check_reset_otp(otp_code):
        return jsonify({'message': 'Incorrect verification code.'}), 400

    try:
        target.reset_otp_verified = True
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'message': 'Failed to verify verification code.'}), 500

    return jsonify({'message': 'Verification code validated successfully.'})


def reset_password():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email', '')).strip().lower()
    password = str(payload.get('password', ''))

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 422

    user = User.query.filter_by(email=email).first()
    k_user = KitchenUser.query.filter_by(email=email).first()

    if not user and not k_user:
        return jsonify({'message': 'No account was found for that email address.'}), 404

    target = user if user else k_user
    if not target.reset_otp_verified:
        return jsonify({'message': 'Verification code must be verified before resetting password.'}), 400

    try:
        target.set_password(password)
        target.reset_otp_hash = None
        target.reset_otp_expiry = None
        target.reset_otp_verified = False
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'message': 'Failed to reset password.'}), 500

    return jsonify({'message': 'Password has been reset successfully.'})