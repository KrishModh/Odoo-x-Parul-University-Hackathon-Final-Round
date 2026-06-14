from decimal import Decimal

from ..extensions import db


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    name = db.Column(db.String(140), nullable=False, index=True)
    image_url = db.Column(db.String(600), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    stock_status = db.Column(db.String(20), nullable=False, default='in_stock')
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    category = db.relationship('Category', back_populates='products')

    def to_dict(self):
        # Dynamically determine the stock status string
        if not self.is_active:
            status_str = "ARCHIVED"
        elif self.quantity <= 0:
            status_str = "OUT_OF_STOCK"
        elif self.quantity <= 5:
            status_str = "LOW_STOCK"
        else:
            status_str = "IN_STOCK"

        return {
            'id': self.id,
            'name': self.name,
            'image_url': self.image_url,
            'description': self.description or '',
            'price': float(self.price or Decimal('0.00')),
            'quantity': self.quantity,
            'currentStock': self.quantity,
            'category': self.category.slug if self.category else None,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'stock_status': status_str,
            'stockStatus': status_str,
            'is_active': self.is_active,
            'isAvailable': self.is_active and self.quantity > 0,
        }
