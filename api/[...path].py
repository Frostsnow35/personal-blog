import sys
import os

_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _base)

from backend.app import app as flask_app
from werkzeug.wrappers import Request, Response


def handler(request):
    return flask_app(request)
