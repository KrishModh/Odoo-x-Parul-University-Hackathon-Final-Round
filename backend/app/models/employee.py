from datetime import datetime, timezone

from ..extensions import db


class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    cafe_name = db.Column(db.String(160), nullable=False)
    employee_code = db.Column(db.String(24), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(24), nullable=True)
    profile_image_url = db.Column(db.String(500), nullable=True)
    joined_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='employee')

    def to_dict(self):
        return {'id': self.id, 'cafe_name': self.cafe_name, 'employee_code': self.employee_code, 'phone': self.phone, 'profile_image_url': self.profile_image_url}
