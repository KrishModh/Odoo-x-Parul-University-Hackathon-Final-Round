from decimal import Decimal, InvalidOperation

from flask import jsonify, request

from datetime import datetime, timezone
from ..extensions import db
from ..models import CafeTable, Category, Order, OrderItem, OrderStatus, Product, User, KitchenUser, UserRole
from ..services.cloudinary_service import upload_image
from .notification_controller import create_notification


def dashboard():
    products = Product.query.order_by(Product.name.asc()).all()
    low_stock = [product for product in products if product.quantity <= 5]
    orders_count = Order.query.filter(Order.status != OrderStatus.CANCELLED).count()
    sold_total = _product_sales_totals()
    sold_today = _product_sales_totals(today_only=True)
    return jsonify({
        'metrics': {
            'products': len(products),
            'active_products': sum(1 for product in products if product.is_active),
            'low_stock': len(low_stock),
            'orders': orders_count,
        },
        'products': [_product_with_sales(product, sold_total, sold_today) for product in products],
    })


def list_categories():
    categories = Category.query.order_by(Category.display_order.asc(), Category.name.asc()).all()
    return jsonify({'data': [category.to_dict() for category in categories]})


def list_products():
    products = Product.query.order_by(Product.name.asc()).all()
    sold_total = _product_sales_totals()
    sold_today = _product_sales_totals(today_only=True)
    return jsonify({'data': [_product_with_sales(product, sold_total, sold_today) for product in products]})


def create_product():
    data, image_error = _extract_product_payload()
    if image_error:
        return jsonify({'message': image_error}), 422

    product, error = _build_product(Product(), data)
    if error:
        return jsonify({'message': error}), 422

    db.session.add(product)
    db.session.commit()
    
    create_notification(
        title="Admin Update - Product Added",
        message=f"Product '{product.name}' has been added by admin.",
        notification_type="admin_update"
    )
    if product.quantity <= 5:
        create_notification(
            title="Low Stock Warning",
            message=f"Product '{product.name}' is running low (Remaining stock: {product.quantity}).",
            notification_type="low_stock"
        )

    return jsonify({'message': 'Product added to inventory.', 'data': product.to_dict()}), 201


def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found.'}), 404

    data, image_error = _extract_product_payload()
    if image_error:
        return jsonify({'message': image_error}), 422

    product, error = _build_product(product, data, partial=True)
    if error:
        return jsonify({'message': error}), 422

    db.session.commit()
    
    create_notification(
        title="Admin Update - Product Updated",
        message=f"Product '{product.name}' has been updated by admin.",
        notification_type="admin_update"
    )
    if product.quantity <= 5:
        create_notification(
            title="Low Stock Warning",
            message=f"Product '{product.name}' is running low (Remaining stock: {product.quantity}).",
            notification_type="low_stock"
        )

    return jsonify({'message': 'Product updated.', 'data': product.to_dict()})


def update_product_stock(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found.'}), 404

    data = request.get_json(silent=True) or {}
    if 'quantity' in data:
        raw_quantity = data.get('quantity')
    else:
        raw_quantity = (product.quantity or 0) + int(data.get('delta') or 0)

    try:
        product.quantity = max(0, int(raw_quantity))
    except (TypeError, ValueError):
        return jsonify({'message': 'Quantity must be a whole number.'}), 422

    product.stock_status = _stock_status(product.quantity, product.is_active)
    db.session.commit()
    
    create_notification(
        title="Admin Update - Stock Updated",
        message=f"Product '{product.name}' stock updated to {product.quantity} by admin.",
        notification_type="admin_update"
    )
    if product.quantity <= 5:
        create_notification(
            title="Low Stock Warning",
            message=f"Product '{product.name}' is running low (Remaining stock: {product.quantity}).",
            notification_type="low_stock"
        )

    return jsonify({'message': 'Stock updated.', 'data': product.to_dict()})


def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found.'}), 404
    product_name = product.name
    db.session.delete(product)
    db.session.commit()
    
    create_notification(
        title="Admin Update - Product Deleted",
        message=f"Product '{product_name}' has been deleted by admin.",
        notification_type="admin_update"
    )

    return jsonify({'message': 'Product deleted permanently.'})


def list_orders():
    orders = Order.query.order_by(Order.created_at.desc()).limit(50).all()
    return jsonify({'data': [order.to_dict() for order in orders]})


def list_tables():
    tables = CafeTable.query.order_by(CafeTable.id.asc()).all()
    return jsonify({'data': [table.to_dict() for table in tables]})


def create_table():
    data = request.get_json(silent=True) or {}
    table, error = _build_table(CafeTable(), data)
    if error:
        return jsonify({'message': error}), 422

    db.session.add(table)
    db.session.commit()
    
    create_notification(
        title="Admin Update - Table Added",
        message=f"Table '{table.name}' has been added by admin.",
        notification_type="admin_update"
    )

    return jsonify({'message': 'Table created.', 'data': table.to_dict()}), 201


def update_table(table_id):
    table = db.session.get(CafeTable, table_id)
    if not table:
        return jsonify({'message': 'Table not found.'}), 404

    data = request.get_json(silent=True) or {}
    table, error = _build_table(table, data, partial=True)
    if error:
        return jsonify({'message': error}), 422

    db.session.commit()
    
    create_notification(
        title="Admin Update - Table Updated",
        message=f"Table '{table.name}' has been updated by admin.",
        notification_type="admin_update"
    )

    return jsonify({'message': 'Table updated.', 'data': table.to_dict()})


def delete_table(table_id):
    table = db.session.get(CafeTable, table_id)
    if not table:
        return jsonify({'message': 'Table not found.'}), 404

    active_order = Order.query.filter(
        Order.table_id == table.id,
        Order.payment_status != 'paid',
        Order.status != OrderStatus.CANCELLED,
    ).first()
    kitchen_order = Order.query.filter(
        Order.table_id == table.id,
        Order.status == OrderStatus.SENT_TO_KITCHEN,
        Order.kitchen_status.in_(['to_cook', 'preparing']),
    ).first()
    if active_order or kitchen_order:
        return jsonify({'message': 'This table has an active ongoing order and cannot be deleted.'}), 409

    table_name = table.name
    db.session.delete(table)
    db.session.commit()

    create_notification(
        title="Admin Update - Table Deleted",
        message=f"Table '{table_name}' has been deleted by admin.",
        notification_type="admin_update"
    )

    return jsonify({'message': 'Table deleted.'})


def _product_sales_totals(today_only=False):
    query = (
        db.session.query(OrderItem.product_id, db.func.coalesce(db.func.sum(OrderItem.quantity), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            OrderItem.product_id.isnot(None),
            Order.payment_status == 'paid',
            Order.inventory_deducted.is_(True),
            Order.status != OrderStatus.CANCELLED,
        )
        .group_by(OrderItem.product_id)
    )
    if today_only:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Order.paid_at >= today_start)
    return {product_id: int(quantity or 0) for product_id, quantity in query.all()}


def _product_with_sales(product, sold_total, sold_today):
    data = product.to_dict()
    data['sold_today'] = sold_today.get(product.id, 0)
    data['sold_total'] = sold_total.get(product.id, 0)
    return data


def _build_table(table, data, partial=False):
    raw_name = data.get('table_name', data.get('name'))
    if raw_name is not None:
        table_name = str(raw_name).strip()
        if not table_name:
            return table, 'Table name is required.'
        existing = CafeTable.query.filter(db.func.lower(CafeTable.table_name) == table_name.lower()).first()
        if existing and existing.id != table.id:
            return table, 'A table with this name already exists.'
        table.table_name = table_name
    elif not partial:
        return table, 'Table name is required.'

    raw_capacity = data.get('seat_capacity', data.get('seats'))
    if raw_capacity is not None:
        try:
            seat_capacity = int(raw_capacity)
        except (TypeError, ValueError):
            return table, 'Seat capacity must be a whole number.'
        if seat_capacity <= 0:
            return table, 'Seat capacity must be greater than zero.'
        table.seat_capacity = seat_capacity
    elif not partial:
        return table, 'Seat capacity is required.'

    if 'is_active' in data:
        table.is_active = str(data['is_active']).lower() not in ('false', '0', 'no', 'off')
    elif not partial and table.is_active is None:
        table.is_active = True

    if 'status' in data:
        status = str(data.get('status') or 'available').strip().lower()
        table.status = status if status in ('available', 'occupied', 'reserved', 'busy') else 'available'

    return table, None


def _extract_product_payload():
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict()
        image = request.files.get('image')
        if image:
            try:
                data['image_url'] = upload_image(image, folder='velluto-cafe/products')['secure_url']
            except Exception:
                return {}, 'Image upload failed. Check Cloudinary configuration.'
        return data, None
    return request.get_json(silent=True) or {}, None


def _build_product(product, data, partial=False):
    required = ['name', 'price', 'quantity', 'category_id']
    missing = [field for field in required if not partial and not str(data.get(field, '')).strip()]
    if missing:
        return product, f"Missing required fields: {', '.join(missing)}."

    if 'name' in data:
        product.name = str(data['name']).strip()
    if 'description' in data:
        product.description = str(data.get('description') or '').strip()
    if 'image_url' in data and str(data.get('image_url', '')).strip():
        product.image_url = str(data['image_url']).strip()
    elif not partial and not product.image_url:
        return product, 'Product image is required.'

    if 'price' in data:
        try:
            product.price = Decimal(str(data['price']))
        except (InvalidOperation, ValueError):
            return product, 'Price must be a valid number.'

    if 'quantity' in data:
        try:
            product.quantity = max(0, int(data['quantity']))
        except (TypeError, ValueError):
            return product, 'Quantity must be a whole number.'

    if 'category_id' in data:
        category = db.session.get(Category, int(data['category_id']))
        if not category:
            return product, 'Selected category does not exist.'
        product.category_id = category.id

    if 'is_active' in data:
        product.is_active = str(data['is_active']).lower() not in ('false', '0', 'no')

    product.stock_status = _stock_status(product.quantity, product.is_active)
    return product, None


def _stock_status(quantity, is_active=True):
    if not is_active:
        return 'archived'
    if quantity <= 0:
        return 'out_of_stock'
    if quantity <= 5:
        return 'low_stock'
    return 'in_stock'


def list_employee_requests():
    users = User.query.filter(User.role != UserRole.ADMIN).all()
    kitchen_users = KitchenUser.query.all()

    requests_list = []
    for u in users:
        requests_list.append({
            'id': f"cashier_{u.id}",
            'name': u.name,
            'email': u.email,
            'role': u.role.value,
            'signup_date': u.created_at.isoformat() if u.created_at else None,
            'approval_status': u.approval_status,
            'rejection_reason': u.rejection_reason,
            'is_active': u.is_active
        })
    for k in kitchen_users:
        requests_list.append({
            'id': f"kitchen_{k.id}",
            'name': k.name,
            'email': k.email,
            'role': 'kitchen',
            'signup_date': k.created_at.isoformat() if k.created_at else None,
            'approval_status': k.approval_status,
            'rejection_reason': k.rejection_reason,
            'is_active': k.is_active
        })

    requests_list.sort(key=lambda x: x['signup_date'] or '', reverse=True)
    return jsonify({'data': requests_list})


def approve_employee(request_id):
    from flask_jwt_extended import get_jwt_identity
    current_admin_id = int(get_jwt_identity())
    
    if request_id.startswith('cashier_'):
        user_id = int(request_id.replace('cashier_', ''))
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Employee request not found.'}), 404
        user.approval_status = 'approved'
        user.approved_by = current_admin_id
        user.approved_at = datetime.now(timezone.utc)
        user.rejection_reason = None
        email = user.email
        name = user.name
    elif request_id.startswith('kitchen_'):
        user_id = int(request_id.replace('kitchen_', ''))
        user = db.session.get(KitchenUser, user_id)
        if not user:
            return jsonify({'message': 'Employee request not found.'}), 404
        user.approval_status = 'approved'
        user.approved_by = current_admin_id
        user.approved_at = datetime.now(timezone.utc)
        user.rejection_reason = None
        email = user.email
        name = user.name
    else:
        return jsonify({'message': 'Invalid request ID format.'}), 400

    db.session.commit()

    try:
        from ..services.email_service import send_email
        subject = "Your Velluto Cafe staff account has been approved"
        html = f"""
        <div style="font-family:Arial,sans-serif;background:#f7f3ee;padding:32px;color:#3b2b22;">
          <div style="max-width:560px;margin:0 auto;background:#fffdf9;border-radius:20px;padding:36px;border:1px solid #eadfd2;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;color:#a87857;font-weight:700;">VELLUTO CAFE</p>
            <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;">Account Approved!</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#6e635c;">
              Hi {name}, your Velluto Cafe staff account has been approved. You can now log in and access your portal.
            </p>
            <p style="margin:0;font-size:13px;line-height:1.7;color:#8a7b70;">
              Thank you,<br/>Velluto Cafe Management
            </p>
          </div>
        </div>
        """
        import threading
        from flask import current_app
        app = current_app._get_current_object()
        threading.Thread(target=lambda: app.app_context().push() or send_email(email, subject, html)).start()
    except Exception as e:
        print(f"Failed to send approval email: {e}")

    return jsonify({'message': 'Employee request approved successfully.'})


def reject_employee(request_id):
    from flask_jwt_extended import get_jwt_identity
    current_admin_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    rejection_reason = payload.get('rejection_reason', '').strip()

    if request_id.startswith('cashier_'):
        user_id = int(request_id.replace('cashier_', ''))
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Employee request not found.'}), 404
        user.approval_status = 'rejected'
        user.approved_by = current_admin_id
        user.approved_at = datetime.now(timezone.utc)
        user.rejection_reason = rejection_reason if rejection_reason else None
        email = user.email
        name = user.name
    elif request_id.startswith('kitchen_'):
        user_id = int(request_id.replace('kitchen_', ''))
        user = db.session.get(KitchenUser, user_id)
        if not user:
            return jsonify({'message': 'Employee request not found.'}), 404
        user.approval_status = 'rejected'
        user.approved_by = current_admin_id
        user.approved_at = datetime.now(timezone.utc)
        user.rejection_reason = rejection_reason if rejection_reason else None
        email = user.email
        name = user.name
    else:
        return jsonify({'message': 'Invalid request ID format.'}), 400

    db.session.commit()

    try:
        from ..services.email_service import send_email
        subject = "Your Velluto Cafe staff account request status"
        reason_html = f"<p style='color:#ad4e4e;'><strong>Reason for rejection:</strong> {rejection_reason}</p>" if rejection_reason else ""
        html = f"""
        <div style="font-family:Arial,sans-serif;background:#f7f3ee;padding:32px;color:#3b2b22;">
          <div style="max-width:560px;margin:0 auto;background:#fffdf9;border-radius:20px;padding:36px;border:1px solid #eadfd2;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;color:#a87857;font-weight:700;">VELLUTO CAFE</p>
            <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;">Account Request Rejected</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#6e635c;">
              Hi {name}, unfortunately your request to register a staff account has been rejected.
            </p>
            {reason_html}
            <p style="margin:0;font-size:13px;line-height:1.7;color:#8a7b70;">
              Velluto Cafe Management
            </p>
          </div>
        </div>
        """
        import threading
        from flask import current_app
        app = current_app._get_current_object()
        threading.Thread(target=lambda: app.app_context().push() or send_email(email, subject, html)).start()
    except Exception as e:
        print(f"Failed to send rejection email: {e}")

    return jsonify({'message': 'Employee request rejected successfully.'})


def remove_employee(request_id):
    from flask_jwt_extended import get_jwt_identity
    current_admin_id = int(get_jwt_identity())
    
    if request_id.startswith('cashier_'):
        user_id = int(request_id.replace('cashier_', ''))
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Employee not found.'}), 404
        user.is_active = False
        user.removed_at = datetime.now(timezone.utc)
        user.removed_by = current_admin_id
    elif request_id.startswith('kitchen_'):
        user_id = int(request_id.replace('kitchen_', ''))
        user = db.session.get(KitchenUser, user_id)
        if not user:
            return jsonify({'message': 'Employee not found.'}), 404
        user.is_active = False
        user.removed_at = datetime.now(timezone.utc)
        user.removed_by = current_admin_id
    else:
        return jsonify({'message': 'Invalid request ID format.'}), 400

    db.session.commit()
    return jsonify({'message': 'Employee removed successfully.'})


def restore_employee(request_id):
    if request_id.startswith('cashier_'):
        user_id = int(request_id.replace('cashier_', ''))
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Employee not found.'}), 404
        user.is_active = True
        user.removed_at = None
        user.removed_by = None
    elif request_id.startswith('kitchen_'):
        user_id = int(request_id.replace('kitchen_', ''))
        user = db.session.get(KitchenUser, user_id)
        if not user:
            return jsonify({'message': 'Employee not found.'}), 404
        user.is_active = True
        user.removed_at = None
        user.removed_by = None
    else:
        return jsonify({'message': 'Invalid request ID format.'}), 400

    db.session.commit()
    return jsonify({'message': 'Employee restored successfully.'})


# ── Customer Management ─────────────────────────────────────────────────────

def list_customers():
    """
    Aggregate customer records from the orders table.
    Groups by (customer_email) and computes stats per customer.
    Supports ?search=, ?filter=today|week|month|top.
    """
    search = (request.args.get('search') or '').strip().lower()
    date_filter = (request.args.get('filter') or '').strip().lower()

    query = Order.query.filter(
        Order.customer_email.isnot(None),
        Order.customer_email != '',
        Order.customer_name.isnot(None),
        Order.customer_name != '',
        Order.status != OrderStatus.CANCELLED
    )

    now_utc = datetime.now(timezone.utc)
    if date_filter == 'today':
        start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Order.created_at >= start)
    elif date_filter == 'week':
        from datetime import timedelta
        start = now_utc - timedelta(days=7)
        query = query.filter(Order.created_at >= start)
    elif date_filter == 'month':
        start = now_utc.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Order.created_at >= start)

    orders = query.order_by(Order.created_at.desc()).all()

    # Group by email → build customer profiles
    customer_map = {}
    for order in orders:
        email = (order.customer_email or '').lower()
        if not email:
            continue
        if email not in customer_map:
            customer_map[email] = {
                'email': order.customer_email,
                'name': order.customer_name or 'Unknown',
                'phone': order.customer_phone or '',
                'total_orders': 0,
                'total_spent': 0.0,
                'last_visit': None,
                'payment_methods': set(),
                'first_visit': None,
            }
        cust = customer_map[email]
        cust['total_orders'] += 1
        cust['total_spent'] += float(order.final_total or order.total or 0)
        if order.payment_method:
            cust['payment_methods'].add(order.payment_method)
        order_date = order.created_at
        if cust['last_visit'] is None or order_date > cust['last_visit']:
            cust['last_visit'] = order_date
        if cust['first_visit'] is None or order_date < cust['first_visit']:
            cust['first_visit'] = order_date

    customers = list(customer_map.values())

    # Apply search
    if search:
        customers = [
            c for c in customers if
            search in c['name'].lower() or
            search in c['email'].lower() or
            search in (c['phone'] or '').lower()
        ]

    # Sort by top spending when filter=top, else by last_visit desc
    if date_filter == 'top':
        customers.sort(key=lambda c: c['total_spent'], reverse=True)
    else:
        customers.sort(key=lambda c: c['last_visit'] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    # Serialise
    result = []
    for i, c in enumerate(customers):
        result.append({
            'id': i + 1,                   # synthetic stable-ish id for frontend key
            'email': c['email'],
            'name': c['name'],
            'phone': c['phone'],
            'total_orders': c['total_orders'],
            'total_spent': round(c['total_spent'], 2),
            'last_visit': c['last_visit'].isoformat() if c['last_visit'] else None,
            'first_visit': c['first_visit'].isoformat() if c['first_visit'] else None,
            'payment_methods': list(c['payment_methods']),
            'is_repeat': c['total_orders'] > 1,
        })

    # Analytics summary
    repeat_count = sum(1 for c in result if c['is_repeat'])
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    todays_emails = {
        (order.customer_email or '').lower()
        for order in Order.query.filter(
            Order.customer_email.isnot(None),
            Order.created_at >= today_start,
            Order.status != OrderStatus.CANCELLED
        ).all()
    }
    total_revenue = sum(c['total_spent'] for c in result)
    total_orders_all = sum(c['total_orders'] for c in result)

    return jsonify({
        'data': result,
        'analytics': {
            'total_customers': len(result),
            'total_orders': total_orders_all,
            'total_revenue': round(total_revenue, 2),
            'repeat_customers': repeat_count,
            'todays_customers': len(todays_emails),
        }
    })


def get_customer_orders():
    """
    Return all orders for a given customer email.
    URL: /admin/customers/orders?email=...
    """
    email = (request.args.get('email') or '').strip().lower()
    if not email:
        return jsonify({'message': 'email parameter is required.'}), 422

    orders = (
        Order.query
        .filter(db.func.lower(Order.customer_email) == email)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []
    for order in orders:
        d = order.to_dict()
        d['item_count'] = sum(i.quantity for i in order.items)
        result.append(d)

    return jsonify({'data': result})
