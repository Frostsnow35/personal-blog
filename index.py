import sys
import os
import traceback

try:
    from flask import Flask, jsonify

    app = Flask(__name__)
    app.config['JSON_AS_ASCII'] = False

    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'ok',
            'message': 'Flask is working on Vercel',
            'python_version': sys.version,
        })

    @app.route('/api/debug')
    def debug():
        return jsonify({
            'cwd': os.getcwd(),
            'files': sorted(os.listdir('.')),
            'env_vars': sorted([k for k in os.environ.keys() if not k.startswith('_')]),
        })

    @app.route('/')
    def index():
        return jsonify({'message': 'Hello from Vercel Flask!'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found', 'path': request.path}), 404

    from flask import request

except Exception as e:
    app = Flask(__name__)

    @app.route('/')
    @app.route('/<path:p>')
    def error_page(p=''):
        return jsonify({
            'error': type(e).__name__,
            'message': str(e),
            'traceback': traceback.format_exc(),
        }), 500
