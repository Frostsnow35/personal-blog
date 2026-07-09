# 混合方案：Vercel 只托管前端，API 通过 Cloudflare Tunnel 访问本地后端
# 此文件仅为兼容 vercel.json 配置，实际请求不会到达这里
from flask import Flask
app = Flask(__name__)

@app.route('/')
def index():
    return 'API not available on Vercel. Use Cloudflare Tunnel.', 404

if __name__ == '__main__':
    app.run()
