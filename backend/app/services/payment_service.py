import razorpay
from flask import current_app


def get_razorpay_client():
    key_id = current_app.config['RAZORPAY_KEY_ID']
    secret = current_app.config['RAZORPAY_SECRET']
    if not key_id or not secret:
        raise RuntimeError('Razorpay credentials are not configured.')
    return razorpay.Client(auth=(key_id, secret))

# Payment order creation and verification will be added with the checkout module.
