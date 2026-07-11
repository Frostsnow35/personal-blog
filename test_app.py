from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'python_version': sys.version,
        'vercel': os.environ.get('VERCEL', 'false'),
    })

@app.route('/api/debug')
def debug():
    info = {
        'cwd': os.getcwd(),
        'files': os.listdir('.'),
        'backend_exists': os.path.isdir('backend'),
        'frontend_exists': os.path.isdir('frontend'),
        'env_vars': sorted([k for k in os.environ.keys() if k.startswith(('DATABASE', 'SECRET', 'JWT', 'ADMIN', 'FLASK'))]),
    }
    return jsonify(info)

@app.route('/')
def index():
    return jsonify({'message': 'Hello from Vercel Flask!'})
