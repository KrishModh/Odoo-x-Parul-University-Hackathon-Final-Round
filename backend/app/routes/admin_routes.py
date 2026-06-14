from flask import Blueprint

from ..controllers.admin_controller import (
    create_product,
    dashboard,
    delete_product,
    list_categories,
    list_orders,
    list_tables,
    list_products,
    create_table,
    update_product,
    update_product_stock,
    update_table,
    list_employee_requests,
    approve_employee,
    reject_employee,
    remove_employee,
    restore_employee,
    list_customers,
    get_customer_orders,
    delete_table,
)
from ..middleware import roles_required

admin_bp = Blueprint('admin', __name__)

admin_bp.get('/dashboard')(roles_required('admin')(dashboard))
admin_bp.get('/categories')(roles_required('admin')(list_categories))
admin_bp.get('/products')(roles_required('admin')(list_products))
admin_bp.post('/products')(roles_required('admin')(create_product))

# Fixed: PATCH aur PUT dono ek saath same endpoint pe
admin_bp.add_url_rule(
    '/products/<int:product_id>',
    endpoint='update_product',
    view_func=roles_required('admin')(update_product),
    methods=['PATCH', 'PUT']
)

admin_bp.patch('/products/<int:product_id>/stock')(roles_required('admin')(update_product_stock))
admin_bp.delete('/products/<int:product_id>')(roles_required('admin')(delete_product))
admin_bp.get('/orders')(roles_required('admin')(list_orders))
admin_bp.get('/tables')(roles_required('admin')(list_tables))
admin_bp.post('/tables')(roles_required('admin')(create_table))
admin_bp.patch('/tables/<int:table_id>')(roles_required('admin')(update_table))
admin_bp.delete('/tables/<int:table_id>')(roles_required('admin')(delete_table))
admin_bp.get('/employee-requests')(roles_required('admin')(list_employee_requests))
admin_bp.patch('/employee-requests/<string:request_id>/approve')(roles_required('admin')(approve_employee))
admin_bp.patch('/employee-requests/<string:request_id>/reject')(roles_required('admin')(reject_employee))
admin_bp.patch('/employees/<string:request_id>/remove')(roles_required('admin')(remove_employee))
admin_bp.patch('/employees/<string:request_id>/restore')(roles_required('admin')(restore_employee))

# Customer management
admin_bp.get('/customers')(roles_required('admin')(list_customers))
admin_bp.get('/customers/orders')(roles_required('admin')(get_customer_orders))