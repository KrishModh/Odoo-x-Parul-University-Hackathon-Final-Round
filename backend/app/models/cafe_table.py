from datetime import datetime, timezone

from ..extensions import db


class CafeTable(db.Model):
    __tablename__ = 'tables'

    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(60), unique=True, nullable=False)
    seat_capacity = db.Column(db.Integer, nullable=False, default=4)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    status = db.Column(db.String(20), nullable=False, default='available')
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    orders = db.relationship('Order', back_populates='table')

    @property
    def name(self):
        return self.table_name

    @name.setter
    def name(self, value):
        self.table_name = value

    @property
    def seats(self):
        return self.seat_capacity

    @seats.setter
    def seats(self, value):
        self.seat_capacity = value

    def to_dict(self):
        return {
            'id': self.id,
            'table_name': self.table_name,
            'seat_capacity': self.seat_capacity,
            'is_active': self.is_active,
            'status': self.status,
            'name': self.table_name,
            'seats': self.seat_capacity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
