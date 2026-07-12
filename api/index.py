import sys
import os
import traceback
from flask import Flask, jsonify, request

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _base_dir not in sys.path:
    sys.path.insert(0, _base_dir)

app = Flask(__name__)

try:
    from backend.app import app as _real_app
    app = _real_app
except Exception:
    _import_error = traceback.format_exc()

    @app.route('/api/debug')
    def debug_import_error():
        return jsonify({
            'error': 'Import failed',
            'traceback': _import_error,
            'sys_path': sys.path[:5],
            'cwd': os.getcwd(),
        }), 500
