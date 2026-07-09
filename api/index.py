import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_DEBUG', 'false')

from backend.app import app

app.config['SERVER_NAME'] = None

if __name__ == '__main__':
    app.run()
