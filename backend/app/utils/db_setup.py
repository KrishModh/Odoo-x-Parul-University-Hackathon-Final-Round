import os
import urllib.parse
import psycopg
from psycopg import sql
from flask_migrate import upgrade
from flask import Flask
from sqlalchemy import inspect, text

from ..extensions import db
from ..services.seed_data import seed_defaults
from ..models import Category

def _create_db_if_not_exists(db_uri: str) -> None:
    """
    Parses the DB URI and creates the database if it does not already exist.
    """
    parsed = urllib.parse.urlparse(db_uri)
    db_name = parsed.path.lstrip('/')
    
    if not db_name:
        return

    conn_params = {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'user': parsed.username,
        'password': parsed.password,
        'dbname': 'postgres',
        'autocommit': True
    }
    
    try:
        with psycopg.connect(**conn_params) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
                if not cur.fetchone():
                    print(f"Database '{db_name}' not found. Creating...")
                    cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
                    print(f"Database '{db_name}' created successfully.")
    except Exception as e:
        print(f"Notice: Could not ensure database exists: {e}")

def setup_database(app: Flask) -> None:
    """
    Runs database migrations and seeding tasks on startup. 
    Uses a file lock to ensure only one worker performs setup.
    """
    lock_file = os.path.join(app.instance_path or '/tmp', 'velluto_db_setup.lock')
    os.makedirs(os.path.dirname(lock_file), exist_ok=True)
    
    # 1. Acquire File Lock
    f = open(lock_file, 'w')
    try:
        try:
            import fcntl
            fcntl.lockf(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except ImportError:
            import msvcrt
            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
            
        # --- Critical Section Start ---
        with app.app_context():
            # A. Ensure DB exists
            _create_db_if_not_exists(app.config['SQLALCHEMY_DATABASE_URI'])
            
            # B. Run Migrations
            print("Running database migrations...")
            upgrade()
            _ensure_user_auth_columns()
            _ensure_order_payment_columns()
            _ensure_order_customer_columns()
            _ensure_order_kitchen_columns()
            _ensure_order_coupon_columns()
            _ensure_order_inventory_columns()
            _ensure_employee_approval_columns()
            _ensure_employee_removal_columns()
            _ensure_forgot_password_columns()
            db.create_all()

            # C. Conditional Seed Data (Dev Only)
            is_dev = app.debug or os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
            if is_dev and not Category.query.first():
                print("Dev mode: Empty DB detected. Seeding defaults...")
                seed_defaults(
                    admin_email=app.config.get('DEFAULT_ADMIN_EMAIL'),
                    admin_password=app.config.get('DEFAULT_ADMIN_PASSWORD')
                )
                print("Default seeding complete.")
        # --- Critical Section End ---

    except (OSError, IOError):
        print("Another process is running DB setup. Skipping in this worker.")
    finally:
        # Release lock and cleanup
        try:
            import fcntl
            fcntl.lockf(f, fcntl.LOCK_UN)
        except ImportError:
            import msvcrt
            f.seek(0)
            msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
        f.close()


def _ensure_user_auth_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('users')}
    except Exception:
        return

    statements = []
    if 'is_verified' not in columns:
        statements.append("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false")
    if 'otp_code' not in columns:
        statements.append("ALTER TABLE users ADD COLUMN otp_code VARCHAR(6)")
    if 'otp_expiry' not in columns:
        statements.append("ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP WITH TIME ZONE")

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        db.session.execute(text("UPDATE users SET is_verified = true WHERE role IN ('ADMIN', 'KITCHEN')"))
        db.session.commit()


def _ensure_order_payment_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('orders')}
    except Exception:
        return

    statements = []
    if 'payment_status' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(24) NOT NULL DEFAULT 'pending'")
    if 'payment_id' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN payment_id VARCHAR(120)")
    if 'razorpay_order_id' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(120)")
    if 'payment_method' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(24)")
    if 'paid_at' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE")

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        db.session.commit()


def _ensure_order_customer_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('orders')}
    except Exception:
        return

    statements = []
    if 'customer_name' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN customer_name VARCHAR(120)")
    if 'customer_email' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN customer_email VARCHAR(120)")
    if 'customer_phone' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(24)")
    if 'invoice_sent' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN invoice_sent BOOLEAN NOT NULL DEFAULT false")
    if 'invoice_sent_at' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN invoice_sent_at TIMESTAMP WITH TIME ZONE")

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        db.session.commit()


def _ensure_order_kitchen_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('orders')}
    except Exception:
        return

    statements = []
    if 'kitchen_status' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN kitchen_status VARCHAR(24) NOT NULL DEFAULT 'to_cook'")
    if 'kitchen_started_at' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN kitchen_started_at TIMESTAMP WITH TIME ZONE")
    if 'kitchen_completed_at' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN kitchen_completed_at TIMESTAMP WITH TIME ZONE")

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        db.session.commit()


def _ensure_order_coupon_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('orders')}
    except Exception:
        return

    statements = []
    if 'coupon_code' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(32)")
    if 'discount_amount' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00")
    if 'final_total' not in columns:
        statements.append("ALTER TABLE orders ADD COLUMN final_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00")

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        # Populate final_total for existing orders where it is currently 0
        db.session.execute(text("UPDATE orders SET final_total = total WHERE final_total = 0.00"))
        db.session.commit()


def _ensure_order_inventory_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('orders')}
    except Exception:
        return

    if 'inventory_deducted' not in columns:
        db.session.execute(text("ALTER TABLE orders ADD COLUMN inventory_deducted BOOLEAN NOT NULL DEFAULT false"))
        db.session.execute(text("UPDATE orders SET inventory_deducted = true WHERE payment_status = 'paid'"))
        db.session.commit()


def _ensure_table_management_columns():
    inspector = inspect(db.engine)
    try:
        columns = {column['name'] for column in inspector.get_columns('tables')}
    except Exception:
        return

    statements = []
    if 'table_name' not in columns:
        statements.append("ALTER TABLE tables ADD COLUMN table_name VARCHAR(60)")
        if 'name' in columns:
            statements.append("UPDATE tables SET table_name = name WHERE table_name IS NULL")
        else:
            statements.append("UPDATE tables SET table_name = CONCAT('T', id) WHERE table_name IS NULL")
        statements.append("ALTER TABLE tables ALTER COLUMN table_name SET NOT NULL")
    if 'seat_capacity' not in columns:
        statements.append("ALTER TABLE tables ADD COLUMN seat_capacity INTEGER")
        if 'seats' in columns:
            statements.append("UPDATE tables SET seat_capacity = seats WHERE seat_capacity IS NULL")
        else:
            statements.append("UPDATE tables SET seat_capacity = 4 WHERE seat_capacity IS NULL")
        statements.append("ALTER TABLE tables ALTER COLUMN seat_capacity SET NOT NULL")
    if 'is_active' not in columns:
        statements.append("ALTER TABLE tables ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true")
    if 'created_at' not in columns:
        statements.append("ALTER TABLE tables ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP")

    for statement in statements:
        db.session.execute(text(statement))

    if statements:
        db.session.commit()


def _ensure_employee_approval_columns():
    inspector = inspect(db.engine)
    
    # 1. Update users table
    try:
        user_columns = {column['name'] for column in inspector.get_columns('users')}
    except Exception:
        user_columns = set()

    user_statements = []
    if user_columns:
        if 'approval_status' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN approval_status VARCHAR(24) NOT NULL DEFAULT 'pending'")
        if 'approved_by' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN approved_by INTEGER")
        if 'approved_at' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE")
        if 'rejection_reason' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN rejection_reason TEXT")

        for stmt in user_statements:
            db.session.execute(text(stmt))

        if user_statements:
            # Seed existing verified/admin users as approved to avoid lockouts
            db.session.execute(text("UPDATE users SET approval_status = 'approved'"))
            db.session.commit()

    # 2. Update kitchen_users table
    try:
        kitchen_columns = {column['name'] for column in inspector.get_columns('kitchen_users')}
    except Exception:
        kitchen_columns = set()

    kitchen_statements = []
    if kitchen_columns:
        if 'approval_status' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN approval_status VARCHAR(24) NOT NULL DEFAULT 'pending'")
        if 'approved_by' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN approved_by INTEGER")
        if 'approved_at' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE")
        if 'rejection_reason' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN rejection_reason TEXT")

        for stmt in kitchen_statements:
            db.session.execute(text(stmt))

        if kitchen_statements:
            # Seed existing kitchen users as approved to avoid lockouts
            db.session.execute(text("UPDATE kitchen_users SET approval_status = 'approved'"))
            db.session.commit()


def _ensure_employee_removal_columns():
    inspector = inspect(db.engine)
    
    # 1. Update users table
    try:
        user_columns = {column['name'] for column in inspector.get_columns('users')}
    except Exception:
        user_columns = set()

    user_statements = []
    if user_columns:
        if 'removed_at' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE")
        if 'removed_by' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN removed_by INTEGER")

        for stmt in user_statements:
            db.session.execute(text(stmt))

        if user_statements:
            db.session.commit()

    # 2. Update kitchen_users table
    try:
        kitchen_columns = {column['name'] for column in inspector.get_columns('kitchen_users')}
    except Exception:
        kitchen_columns = set()

    kitchen_statements = []
    if kitchen_columns:
        if 'removed_at' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE")
        if 'removed_by' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN removed_by INTEGER")

        for stmt in kitchen_statements:
            db.session.execute(text(stmt))

        if kitchen_statements:
            db.session.commit()


def _ensure_forgot_password_columns():
    inspector = inspect(db.engine)
    
    # 1. Update users table
    try:
        user_columns = {column['name'] for column in inspector.get_columns('users')}
    except Exception:
        user_columns = set()

    user_statements = []
    if user_columns:
        if 'reset_otp_hash' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN reset_otp_hash VARCHAR(255)")
        if 'reset_otp_expiry' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN reset_otp_expiry TIMESTAMP WITH TIME ZONE")
        if 'reset_otp_verified' not in user_columns:
            user_statements.append("ALTER TABLE users ADD COLUMN reset_otp_verified BOOLEAN NOT NULL DEFAULT false")

        for stmt in user_statements:
            db.session.execute(text(stmt))

        if user_statements:
            db.session.commit()

    # 2. Update kitchen_users table
    try:
        kitchen_columns = {column['name'] for column in inspector.get_columns('kitchen_users')}
    except Exception:
        kitchen_columns = set()

    kitchen_statements = []
    if kitchen_columns:
        if 'reset_otp_hash' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN reset_otp_hash VARCHAR(255)")
        if 'reset_otp_expiry' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN reset_otp_expiry TIMESTAMP WITH TIME ZONE")
        if 'reset_otp_verified' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN reset_otp_verified BOOLEAN NOT NULL DEFAULT false")
        if 'phone' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN phone VARCHAR(24)")
        if 'profile_image_url' not in kitchen_columns:
            kitchen_statements.append("ALTER TABLE kitchen_users ADD COLUMN profile_image_url VARCHAR(500)")

        for stmt in kitchen_statements:
            db.session.execute(text(stmt))

        if kitchen_statements:
            db.session.commit()
