from flask import Blueprint
from ..controllers.coupon_controller import (
    create_coupon,
    get_coupons,
    delete_coupon,
    update_coupon_status,
    apply_coupon
)
from ..middleware import roles_required

coupon_bp = Blueprint('coupons', __name__)

coupon_bp.post('/create')(roles_required('admin')(create_coupon))
coupon_bp.get('')(roles_required('admin', 'cashier')(get_coupons))
coupon_bp.delete('/<int:coupon_id>')(roles_required('admin')(delete_coupon))
coupon_bp.patch('/<int:coupon_id>/status')(roles_required('admin')(update_coupon_status))
coupon_bp.post('/apply')(roles_required('cashier')(apply_coupon))
