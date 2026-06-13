import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def normalize_database_url(url):
    if url and url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql://', 1)
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = normalize_database_url(os.getenv('DATABASE_URL'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True, 'pool_recycle': 300}

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_HOURS', '8')))

    FRONTEND_CASHIER_URL = os.getenv('FRONTEND_CASHIER_URL', 'http://localhost:5173')
    FRONTEND_ADMIN_URL = os.getenv('FRONTEND_ADMIN_URL', 'http://localhost:5174')
    FRONTEND_KITCHEN_URL = os.getenv('FRONTEND_KITCHEN_URL', 'http://localhost:5175')
    
    CORS_ORIGINS = [FRONTEND_CASHIER_URL, FRONTEND_ADMIN_URL, FRONTEND_KITCHEN_URL]
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
    EMAIL_FROM = os.environ.get('RESEND_FROM_EMAIL', 'noreply@krishmodh.site')
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
    RAZORPAY_SECRET = os.getenv('RAZORPAY_SECRET')
    DEFAULT_ADMIN_EMAIL = os.getenv('DEFAULT_ADMIN_EMAIL')
    DEFAULT_ADMIN_PASSWORD = os.getenv('DEFAULT_ADMIN_PASSWORD')

    @classmethod
    def validate(cls):
        required = ('SQLALCHEMY_DATABASE_URI', 'JWT_SECRET_KEY')
        missing = [name for name in required if not getattr(cls, name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")


Config.validate()
