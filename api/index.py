import sys
import os
import traceback

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _base_dir not in sys.path:
    sys.path.insert(0, _base_dir)

try:
    from backend.app import app
    _import_error = None
except Exception as e:
    _import_error = traceback.format_exc()
    
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route('/<path:path>')
    def error_route(path):
        return jsonify({
            'error': 'Import failed',
            'traceback': _import_error,
            'sys_path': sys.path[:5],
            'cwd': os.getcwd(),
        }), 500
