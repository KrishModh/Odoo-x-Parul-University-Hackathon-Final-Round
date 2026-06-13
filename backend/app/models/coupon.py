from datetime import datetime, timezone
from decimal import Decimal
from ..extensions import db

class Coupon(db.Model):
    __tablename__ = 'coupons'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False, index=True)
    discount_type = db.Column(db.String(24), nullable=False, default='percentage') # 'percentage' or 'fixed'
    discount_value = db.Column(db.Numeric(10, 2), nullable=False)
    min_order_amount = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    expiry_date = db.Column(db.DateTime(timezone=True), nullable=True)
    max_usage = db.Column(db.Integer, nullable=True) # NULL means unlimited
    used_count = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'discount_type': self.discount_type,
            'discount_value': float(self.discount_value),
            'min_order_amount': float(self.min_order_amount),
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'max_usage': self.max_usage,
            'used_count': self.used_count,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
