def handler(request, response):
    response.status = 200
    response.headers['Content-Type'] = 'application/json'
    return '{"status": "ok", "message": "API is working"}'
