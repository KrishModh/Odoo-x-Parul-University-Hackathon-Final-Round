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
    payment_status = db.Column(db.String(24), nullable=False, default='pending')
    payment_id = db.Column(db.String(120), nullable=True)
    razorpay_order_id = db.Column(db.String(120), nullable=True)
    payment_method = db.Column(db.String(24), nullable=True)
    paid_at = db.Column(db.DateTime(timezone=True), nullable=True)
    customer_name = db.Column(db.String(120), nullable=True)
    customer_email = db.Column(db.String(120), nullable=True)
    customer_phone = db.Column(db.String(24), nullable=True)
    invoice_sent = db.Column(db.Boolean, nullable=False, default=False)
    invoice_sent_at = db.Column(db.DateTime(timezone=True), nullable=True)
    kitchen_status = db.Column(db.String(24), nullable=False, default='to_cook')
    kitchen_started_at = db.Column(db.DateTime(timezone=True), nullable=True)
    kitchen_completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    coupon_code = db.Column(db.String(32), nullable=True)
    discount_amount = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    final_total = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal('0.00'))
    inventory_deducted = db.Column(db.Boolean, nullable=False, default=False)

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
            'coupon_code': self.coupon_code,
            'discount_amount': float(self.discount_amount),
            'final_total': float(self.final_total),
            'payment_status': self.payment_status,
            'payment_id': self.payment_id,
            'razorpay_order_id': self.razorpay_order_id,
            'payment_method': self.payment_method,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'invoice_sent': self.invoice_sent,
            'invoice_sent_at': self.invoice_sent_at.isoformat() if self.invoice_sent_at else None,
            'kitchen_status': self.kitchen_status,
            'kitchen_started_at': self.kitchen_started_at.isoformat() if self.kitchen_started_at else None,
            'kitchen_completed_at': self.kitchen_completed_at.isoformat() if self.kitchen_completed_at else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'inventory_deducted': self.inventory_deducted,
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
