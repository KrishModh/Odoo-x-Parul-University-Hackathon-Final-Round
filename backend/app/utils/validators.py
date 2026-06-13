import re

EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def validate_signup_payload(payload):
    errors = {}
    required = ('name', 'email', 'password', 'cafe_name')
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
    return errors
