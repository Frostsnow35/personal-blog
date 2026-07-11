import sys
import os
import traceback
from flask import Flask, jsonify

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _base_dir not in sys.path:
    sys.path.insert(0, _base_dir)

# 顶层定义 app，确保 Vercel 静态分析能检测到
app = Flask(__name__)

_import_error = None
try:
    from backend.app import app as _real_app
    app = _real_app
except Exception as e:
    _import_error = traceback.format_exc()

    @app.route('/api/debug')
    def debug_import_error():
        return jsonify({
            'error': 'Import failed',
            'traceback': _import_error,
            'sys_path': sys.path[:5],
            'cwd': os.getcwd(),
        }), 500

    @app.route('/<path:path>')
    def catch_all(path):
        return jsonify({
            'error': 'Import failed',
            'traceback': _import_error,
        }), 500
