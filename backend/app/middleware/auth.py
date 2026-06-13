from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def roles_required(*allowed_roles):
    def decorator(view_function):
        @wraps(view_function)
        def wrapped(*args, **kwargs):
            verify_jwt_in_request()
            if get_jwt().get('role') not in allowed_roles:
                return jsonify({'message': 'You do not have permission to access this resource.'}), 403
            return view_function(*args, **kwargs)
        return wrapped
    return decorator
