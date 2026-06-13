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
    approval_status = db.Column(db.String(24), nullable=False, default='pending')
    approved_by = db.Column(db.Integer, nullable=True)
    approved_at = db.Column(db.DateTime(timezone=True), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    removed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    removed_by = db.Column(db.Integer, nullable=True)
    reset_otp_hash = db.Column(db.String(255), nullable=True)
    reset_otp_expiry = db.Column(db.DateTime(timezone=True), nullable=True)
    reset_otp_verified = db.Column(db.Boolean, nullable=False, default=False)
    phone = db.Column(db.String(24), nullable=True)
    profile_image_url = db.Column(db.String(500), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='scrypt')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def set_reset_otp(self, otp):
        self.reset_otp_hash = generate_password_hash(otp, method='scrypt')
        self.reset_otp_verified = False

    def check_reset_otp(self, otp):
        if not self.reset_otp_hash:
            return False
        return check_password_hash(self.reset_otp_hash, otp)

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
            'approval_status': self.approval_status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'phone': self.phone or '',
            'profile_image_url': self.profile_image_url or ''
        }
