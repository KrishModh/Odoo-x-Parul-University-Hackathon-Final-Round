from datetime import datetime, timezone
from ..extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='info') # 'new_order', 'preparing', 'completed', 'cashier_order', 'low_stock', 'admin_update', 'info'
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'isRead': self.is_read,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
