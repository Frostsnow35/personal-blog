import sys
import os

_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _base)

from backend.app import app as flask_app

_client = flask_app.test_client()


def handler(request):
    path = request.path_info if hasattr(request, 'path_info') else request.path
    query_string = request.query_string if hasattr(request, 'query_string') else ''
    method = request.method
    headers = dict(request.headers) if hasattr(request, 'headers') else {}
    body = request.body if hasattr(request, 'body') else b''

    url = path
    if query_string:
        url += '?' + (query_string.decode() if isinstance(query_string, bytes) else query_string)

    resp = _client.open(
        url,
        method=method,
        headers=headers,
        data=body
    )

    return {
        'status': resp.status_code,
        'headers': dict(resp.headers),
        'body': resp.get_data()
    }
