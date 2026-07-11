import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('FLASK_ENV', 'production')

from backend.app import app as application

app = application