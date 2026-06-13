import re

EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
OTP_PATTERN = re.compile(r'^\d{6}$')


def validate_signup_payload(payload):
    errors = {}
    required = ('name', 'email', 'password')
    for field in required:
        if not str(payload.get(field, '')).strip():
            errors[field] = f'{field.replace("_", " ").title()} is required.'

    email = str(payload.get('email', '')).strip().lower()
    if email and not EMAIL_PATTERN.match(email):
        errors['email'] = 'Enter a valid email address.'
    if payload.get('password') and len(payload['password']) < 8:
        errors['password'] = 'Password must be at least 8 characters.'
    if len(str(payload.get('name', ''))) > 120:
        errors['name'] = 'Name must be 120 characters or fewer.'
    cafe_name = str(payload.get('cafe_name', '')).strip()
    if cafe_name and len(cafe_name) > 160:
        errors['cafe_name'] = 'Cafe name must be 160 characters or fewer.'
    return errors


def validate_verify_otp_payload(payload):
    errors = {}
    email = str(payload.get('email', '')).strip().lower()
    otp_code = str(payload.get('otp_code', '')).strip()

    if not email:
        errors['email'] = 'Email is required.'
    elif not EMAIL_PATTERN.match(email):
        errors['email'] = 'Enter a valid email address.'

    if not otp_code:
        errors['otp_code'] = 'OTP is required.'
    elif not OTP_PATTERN.match(otp_code):
        errors['otp_code'] = 'OTP must be a 6-digit code.'

    return errors


def validate_resend_otp_payload(payload):
    errors = {}
    email = str(payload.get('email', '')).strip().lower()

    if not email:
        errors['email'] = 'Email is required.'
    elif not EMAIL_PATTERN.match(email):
        errors['email'] = 'Enter a valid email address.'

    return errors
