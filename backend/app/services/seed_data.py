from decimal import Decimal

from ..extensions import db
from ..models import CafeTable, Category, Employee, Product, User, UserRole
from .sample_pos_data import SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, SAMPLE_TABLES


def seed_defaults(admin_email=None, admin_password=None):
    for category in SAMPLE_CATEGORIES:
        if not Category.query.filter_by(slug=category['slug']).first():
            db.session.add(Category(**category))

    for table in SAMPLE_TABLES:
        if not CafeTable.query.filter_by(name=table['name']).first():
            db.session.add(CafeTable(name=table['name'], seats=table['seats'], status=table['status']))

    db.session.flush()
    categories_by_slug = {category.slug: category for category in Category.query.all()}

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

    db.session.commit()
