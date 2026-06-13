from ..extensions import db


class CafeTable(db.Model):
    __tablename__ = 'tables'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True, nullable=False)
    seats = db.Column(db.Integer, nullable=False, default=4)
    status = db.Column(db.String(20), nullable=False, default='available')

    orders = db.relationship('Order', back_populates='table')

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'seats': self.seats, 'status': self.status}
