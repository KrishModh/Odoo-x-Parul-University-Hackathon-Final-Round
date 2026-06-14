from decimal import Decimal

from ..extensions import db
from ..models import CafeTable, Category, Employee, Product, User, UserRole, Order, OrderItem, OrderStatus
from .sample_pos_data import SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, SAMPLE_TABLES


def seed_defaults(admin_email=None, admin_password=None):
    # Seed categories
    for category in SAMPLE_CATEGORIES:
        if not Category.query.filter_by(slug=category['slug']).first():
            db.session.add(Category(**category))
    db.session.flush()

    # Seed tables
    for table in SAMPLE_TABLES:
        if not CafeTable.query.filter_by(table_name=table['name']).first():
            db.session.add(CafeTable(
                table_name=table['name'],
                seat_capacity=table['seats'],
                status=table['status'],
                is_active=True,
            ))
    db.session.flush()

    categories_by_slug = {category.slug: category for category in Category.query.all()}

    # Seed products
    for sample in SAMPLE_PRODUCTS:
        if Product.query.filter_by(name=sample['name']).first():
            continue
        db.session.add(Product(
            category_id=categories_by_slug[sample['category']].id,
            name=sample['name'],
            image_url=sample['image_url'],
            description=sample.get('description', ''),
            price=Decimal(str(sample['price'])),
            quantity=sample.get('quantity', 25),
            stock_status=sample.get('stock_status', 'in_stock'),
            is_active=True,
        ))
    db.session.flush()

    # Seed Admin User
    admin_email = (admin_email or 'admin@velluto.com').strip().lower()
    admin_password = admin_password or 'admin123'
    
    admin = User.query.filter_by(email=admin_email).first()
    if not admin:
        print(f"Creating default admin account: {admin_email}")
        admin = User(name='Velluto Admin', email=admin_email, role=UserRole.ADMIN)
        admin.set_password(admin_password)
        admin.is_verified = True
        db.session.add(admin)
        db.session.flush()
        db.session.add(Employee(user_id=admin.id, cafe_name='Velluto Cafe', employee_code='ADM-0001'))
    elif admin.role != UserRole.ADMIN:
        print(f"Fixing admin role for {admin_email}")
        admin.role = UserRole.ADMIN
        admin.set_password(admin_password)
        admin.is_verified = True
    else:
        admin.is_verified = True
    db.session.flush()

    # Seed sample orders/history (Clean and seed fresh for professional demo)
    from datetime import datetime, timezone, timedelta
    import random

    print("Cleaning existing orders for fresh seeding...")
    OrderItem.query.delete()
    Order.query.delete()
    db.session.flush()

    print("Seeding sample orders and customer history...")
    products = Product.query.filter_by(is_active=True).all()
    tables = CafeTable.query.filter_by(is_active=True).all()
    
    customers = [
        {'name': 'Rohan Sharma', 'email': 'rohan.sharma@gmail.com', 'phone': '9876543210'},
        {'name': 'Priya Patel', 'email': 'priya.patel@yahoo.com', 'phone': '9812345678'},
        {'name': 'Aarav Mehta', 'email': 'aarav.mehta@gmail.com', 'phone': '9922334455'},
        {'name': 'Sneha Reddy', 'email': 'sneha.reddy@gmail.com', 'phone': '9011223344'},
        {'name': 'Vikram Malhotra', 'email': 'vikram.malhotra@outlook.com', 'phone': '9833445566'},
        {'name': 'Neha Gupta', 'email': 'neha.gupta@gmail.com', 'phone': '9123456780'},
        {'name': 'Aditya Sen', 'email': 'aditya.sen@gmail.com', 'phone': '9567890123'},
    ]
    
    payment_methods = ['cash', 'card', 'upi']
    now = datetime.now(timezone.utc)
    
    # We will create 40 orders over the last 7 days
    for i in range(40):
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(1, 23)
        created_at = now - timedelta(days=days_ago, hours=hours_ago)
        
        # Select random customer (some repeat)
        customer = random.choice(customers)
        
        # Random order items
        order_items_to_create = []
        selected_products = random.sample(products, k=random.randint(1, min(len(products), 4)))
        
        subtotal = Decimal('0.00')
        for p in selected_products:
            qty = random.randint(1, 2)
            line_total = p.price * qty
            subtotal += line_total
            order_items_to_create.append({
                'product_id': p.id,
                'product_name': p.name,
                'quantity': qty,
                'unit_price': p.price,
                'line_total': line_total
            })
            
        gst = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'))
        total = subtotal + gst
        
        # Random status
        status_rand = random.random()
        if status_rand < 0.12:
            # Cancelled order
            status = OrderStatus.CANCELLED
            kitchen_status = 'cancelled'
            payment_status = 'pending'
            paid_at = None
            payment_method = None
        elif status_rand < 0.22:
            # Pending unpaid order
            status = OrderStatus.SENT_TO_KITCHEN
            kitchen_status = random.choice(['to_cook', 'preparing'])
            payment_status = 'pending'
            paid_at = None
            payment_method = None
        else:
            # Paid/completed order
            status = OrderStatus.SENT_TO_KITCHEN
            kitchen_status = 'completed'
            payment_status = 'paid'
            paid_at = created_at + timedelta(minutes=random.randint(5, 30))
            payment_method = random.choice(payment_methods)
            
        table = random.choice(tables) if random.random() > 0.3 else None
        
        order = Order(
            order_number=f'POS-{random.randint(10000000, 99999999)}',
            table_id=table.id if table else None,
            cashier_id=admin.id,
            status=status,
            subtotal=subtotal,
            gst=gst,
            total=total,
            final_total=total,
            payment_status=payment_status,
            payment_method=payment_method,
            paid_at=paid_at,
            created_at=created_at,
            customer_name=customer['name'],
            customer_email=customer['email'],
            customer_phone=customer['phone'],
            kitchen_status=kitchen_status,
            kitchen_completed_at=paid_at if kitchen_status == 'completed' else None,
            inventory_deducted=True if payment_status == 'paid' else False
        )
        db.session.add(order)
        db.session.flush()
        
        for item in order_items_to_create:
            db.session.add(OrderItem(
                order_id=order.id,
                product_id=item['product_id'],
                product_name=item['product_name'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                line_total=item['line_total']
            ))
            
    print("Sample orders seeded successfully.")
    db.session.commit()
