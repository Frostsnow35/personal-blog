from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/test')
def test():
    return jsonify({'status': 'ok', 'message': 'Test endpoint working'})

@app.route('/api/<path:path>')
def catch_all(path):
    return jsonify({'status': 'ok', 'path': path}), 200