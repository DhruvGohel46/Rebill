from flask import Flask, jsonify
from flask_cors import CORS
import os
import threading
from dotenv import load_dotenv
from config import config

# Load environment variables from .env file
load_dotenv()





def start_dashboard_refresher():
    """Start the dashboard refresher in a separate thread"""
    from dashboard_refresher import DashboardRefresher
    try:
        refresher = DashboardRefresher()
        print("Dashboard Refresher started - Daily refresh at 12:01 AM")
        print(f"Archive directory: {refresher.archive_dir}")
        refresher.start_scheduler()
    except Exception as e:
        print(f"Failed to start dashboard refresher: {e}")


def create_app(config_name='default'):
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Import route blueprints logic moved inside to allow env vars to take effect before config loading in modules
    from dashboard_refresher import DashboardRefresher
    from routes.products import products_bp
    from routes.billing import billing_bp
    from routes.summary import summary_bp
    from routes.reports import reports_bp
    from routes.categories import categories_bp
    from routes.settings import settings_bp
    from routes.settings import settings_bp
    from routes.inventory import inventory_bp
    from routes.workers import workers_bp
    from routes.reminders import reminders_bp
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize SQLAlchemy
    from models import db
    db.init_app(app)
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(products_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(summary_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(workers_bp)
    app.register_blueprint(reminders_bp)
    
    # Initialize reminder service
    from services.reminder_service import reminder_service
    reminder_service.init_app(app)

    # Serve product images
    @app.route('/api/images/<path:filename>')
    def serve_image(filename):
        from flask import send_from_directory
        # Use DATA_DIR from config, assuming images are in 'images' subdir
        images_dir = os.path.join(app.config['DATA_DIR'], 'images')
        return send_from_directory(images_dir, filename)
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'message': 'POS Backend API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'products': '/api/products',
                'billing': '/api/bill',
                'summary': '/api/summary',
                'reports': '/api/reports',
                'categories': '/api/categories',
                'settings': '/api/settings',
                'inventory': '/api/inventory',
                'workers': '/api/workers',
                'reminders': '/api/reminders'
            }
        })
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': str(os.times()),
            'data_directory': app.config['DATA_DIR']
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found',
            'error': str(error)
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(error)
        }), 500
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'message': 'Method not allowed',
            'error': str(error)
        }), 405
    
    return app


if __name__ == '__main__':
    import argparse
    import sys
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='POS Backend Server')
    parser.add_argument('--data-dir', help='Path to data directory')
    parser.add_argument('--port', type=int, default=5050, help='Port to run server on')
    args = parser.parse_args()
    
    # Set data directory if provided
    if args.data_dir:
        os.environ['POS_DATA_DIR'] = args.data_dir
        print(f"Data directory set to: {args.data_dir}")
        
    # Create app and run
    # If frozen (PyInstaller), use 'production' config by default
    config_name = 'production' if getattr(sys, 'frozen', False) else 'development'
    app = create_app(config_name)
    from models import db

    # Create tables if they don't exist
    try:
        with app.app_context():
            # Ensure worker schema exists (PostgreSQL specific)
            try:
                from sqlalchemy import text
                db.session.execute(text("CREATE SCHEMA IF NOT EXISTS worker"))
                db.session.commit()
            except Exception as e:
                print(f"Schema creation warning (ignore if using SQLite): {e}")

            db.create_all()
            print("Database tables created/verified")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        import traceback
        traceback.print_exc()
    
    # Ensure data directory exists
    try:
        os.makedirs(app.config['DATA_DIR'], exist_ok=True)
        os.makedirs(app.config['BILLS_DIR'], exist_ok=True)
        os.makedirs(app.config['ARCHIVE_DIR'], exist_ok=True)
        os.makedirs(app.config['EXPORT_DIR'], exist_ok=True)
    except OSError as e:
        print(f"Error creating directories: {e}")
        # Continue anyway, might be permission issue handled by user
    
    # Start dashboard refresher in background thread
    refresher_thread = threading.Thread(target=start_dashboard_refresher, daemon=True)
    refresher_thread.start()
    
    print("Starting POS Backend Server...")
    print(f"Data directory: {app.config['DATA_DIR']}")
    print(f"Server running on: http://localhost:{args.port}")
    print("Dashboard Refresher is running in background")
    
    app.run(
        host='0.0.0.0',
        port=args.port,
        debug=app.config['DEBUG'],
        use_reloader=False  # Prevent duplicate refresher threads
    )
