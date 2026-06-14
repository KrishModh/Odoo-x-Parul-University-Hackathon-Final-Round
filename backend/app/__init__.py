from flask import Flask, jsonify
from .routes.kitchen_routes import kitchen_bp 
from .config.settings import Config
from .extensions import cors, db, jwt, migrate
from .routes.admin_routes import admin_bp
from .routes.auth_routes import auth_bp
from .routes.kitchen_auth_routes import kitchen_auth_bp
from .routes.cashier_routes import cashier_bp
from .routes.pos_routes import pos_bp
from .routes.payment_routes import payment_bp
from .routes.coupon_routes import coupon_bp
from .routes.notification_routes import notification_bp
from .routes.reports_routes import reports_bp
from .routes.order_routes import orders_bp
from .controllers.pos_controller import get_tables
from .middleware import roles_required
from .services.seed_data import seed_defaults


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}})

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(kitchen_auth_bp, url_prefix='/api/kitchen/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(cashier_bp, url_prefix='/api/cashier')
    app.register_blueprint(pos_bp, url_prefix='/api/pos')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(kitchen_bp, url_prefix='/api/kitchen')
    app.register_blueprint(coupon_bp, url_prefix='/api/coupons')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')

    register_error_handlers(app)
    register_jwt_handlers()

    from .utils.db_setup import setup_database
    setup_database(app)

    @app.get('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'velluto-cafe-api'})

    app.get('/api/tables')(roles_required('cashier', 'admin')(get_tables))

    @app.cli.command('seed')
    def seed_command():
        seed_defaults(app.config.get('DEFAULT_ADMIN_EMAIL'), app.config.get('DEFAULT_ADMIN_PASSWORD'))
        print('Velluto Cafe defaults seeded.')

    return app


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({'message': 'The requested resource was not found.'}), 404

    @app.errorhandler(500)
    def internal_error(_error):
        db.session.rollback()
        return jsonify({'message': 'An unexpected server error occurred.'}), 500


def register_jwt_handlers():
    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({'message': 'Your session has expired. Please sign in again.'}), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify({'message': 'Invalid authentication token.'}), 401

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify({'message': 'Authentication is required.'}), 401
