import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_DEBUG', 'false')

try:
    from backend.app import app as application
    app = application
except Exception as e:
    import traceback
    error_info = traceback.format_exc()
    
    from flask import Flask, jsonify
    
    app = Flask(__name__)
    
    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'error',
            'message': 'Flask app import failed',
            'error': str(e),
            'traceback': error_info[:2000]
        }), 500
    
    @app.route('/api/<path:path>')
    def catch_all(path):
        return jsonify({
            'status': 'error',
            'message': 'Flask app not available',
            'error': str(e)
        }), 503