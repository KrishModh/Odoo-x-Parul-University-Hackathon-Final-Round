from datetime import datetime, timezone
from werkzeug.security import check_password_hash, generate_password_hash
from ..extensions import db

class KitchenUser(db.Model):
    __tablename__ = 'kitchen_users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(24), nullable=False, default='kitchen', index=True)
    cafe_name = db.Column(db.String(160), nullable=True)
    employee_code = db.Column(db.String(24), unique=True, nullable=True, index=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='scrypt')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'cafe_name': self.cafe_name,
            'employee_code': self.employee_code,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
        }
