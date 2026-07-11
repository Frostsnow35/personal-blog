def handler(request, response):
    response.status = 200
    response.headers['Content-Type'] = 'application/json'
    return '{"status": "healthy", "test": "simple"}'
