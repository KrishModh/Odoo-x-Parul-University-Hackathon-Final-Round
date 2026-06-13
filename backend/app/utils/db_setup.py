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
