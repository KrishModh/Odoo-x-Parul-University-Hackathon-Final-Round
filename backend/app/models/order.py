import enum
from datetime import datetime, timezone
from decimal import Decimal

from ..extensions import db


class OrderStatus(enum.Enum):
    CART = 'cart'
    SENT_TO_KITCHEN = 'sent_to_kitchen'
    CANCELLED = 'cancelled'


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(32), unique=True, nullable=False, index=True)
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id', ondelete='SET NULL'), nullable=True, index=True)
    cashier_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    status = db.Column(db.Enum(OrderStatus, name='order_status'), nullable=False, default=OrderStatus.CART)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    gst = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    total = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    table = db.relationship('CafeTable', back_populates='orders')
    items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'status': self.status.value,
            'table': self.table.to_dict() if self.table else None,
            'subtotal': float(self.subtotal),
            'gst': float(self.gst),
            'total': float(self.total),
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='SET NULL'), nullable=True, index=True)
    product_name = db.Column(db.String(140), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)

    order = db.relationship('Order', back_populates='items')
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'line_total': float(self.line_total),
        }
