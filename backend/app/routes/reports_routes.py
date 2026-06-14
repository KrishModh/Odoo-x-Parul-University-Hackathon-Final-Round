from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..middleware import roles_required
from ..controllers.reports_controller import (
    get_reports_summary,
    get_reports_revenue,
    get_reports_products,
    get_reports_customers,
    get_reports_payments,
    export_reports_csv,
    export_reports_pdf
)

reports_bp = Blueprint('reports_bp', __name__)

reports_bp.get('/summary')(jwt_required()(roles_required('admin')(get_reports_summary)))
reports_bp.get('/revenue')(jwt_required()(roles_required('admin')(get_reports_revenue)))
reports_bp.get('/products')(jwt_required()(roles_required('admin')(get_reports_products)))
reports_bp.get('/customers')(jwt_required()(roles_required('admin')(get_reports_customers)))
reports_bp.get('/payments')(jwt_required()(roles_required('admin')(get_reports_payments)))
reports_bp.get('/export/csv')(jwt_required()(roles_required('admin')(export_reports_csv)))
reports_bp.get('/export/pdf')(jwt_required()(roles_required('admin')(export_reports_pdf)))
