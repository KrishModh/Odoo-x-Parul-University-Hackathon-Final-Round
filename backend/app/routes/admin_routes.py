from flask import Blueprint

from ..controllers.admin_controller import (
    create_product,
    dashboard,
    delete_product,
    list_categories,
    list_orders,
    list_products,
    update_product,
)
from ..middleware import roles_required

admin_bp = Blueprint('admin', __name__)

admin_bp.get('/dashboard')(roles_required('admin')(dashboard))
admin_bp.get('/categories')(roles_required('admin')(list_categories))
admin_bp.get('/products')(roles_required('admin')(list_products))
admin_bp.post('/products')(roles_required('admin')(create_product))
admin_bp.put('/products/<int:product_id>')(roles_required('admin')(update_product))
admin_bp.delete('/products/<int:product_id>')(roles_required('admin')(delete_product))
admin_bp.get('/orders')(roles_required('admin')(list_orders))
