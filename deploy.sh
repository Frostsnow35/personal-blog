#!/bin/bash
# ============================================================
# 个人博客一键部署脚本（Ubuntu/Debian）
# 使用方式：bash deploy.sh your_domain.com
# ============================================================

set -e

if [ -z "$1" ]; then
    echo "❌ 请提供域名，使用方式: bash deploy.sh your-domain.com"
    exit 1
fi

DOMAIN="$1"
APP_DIR="/opt/personal-blog"
DB_NAME="personal_blog"
DB_USER="blog_user"
DB_PASS=$(openssl rand -hex 16)

echo "========================================"
echo "🚀 开始部署个人博客"
echo "域名: $DOMAIN"
echo "========================================"

echo ""
echo "📦 1. 更新系统并安装依赖..."
apt update && apt upgrade -y
apt install -y git curl wget nginx mysql-server python3 python3-pip python3-venv docker.io docker-compose

echo ""
echo "🔒 2. 配置防火墙..."
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw enable

echo ""
echo "🗄️ 3. 配置 MySQL 数据库..."
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo ""
echo "🌐 4. 配置 Nginx..."
cat > /etc/nginx/sites-available/blog <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root /opt/personal-blog/frontend/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "📥 5. 克隆项目..."
mkdir -p /opt
git clone https://github.com/Frostsnow35/personal-blog.git $APP_DIR
cd $APP_DIR

echo ""
echo "📦 6. 安装前端依赖..."
cd $APP_DIR/frontend
npm install --legacy-peer-deps
npm run build

echo ""
echo "🐍 7. 配置后端环境..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "🔧 8. 创建环境配置..."
cat > $APP_DIR/backend/.env <<EOF
DATABASE_URL=mysql+pymysql://$DB_USER:$DB_PASS@localhost/$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
FLASK_ENV=production
FLASK_DEBUG=false
SITE_URL=https://$DOMAIN
CORS_ORIGINS=https://$DOMAIN
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -hex 12)
EOF

echo ""
echo "🗄️ 9. 初始化数据库..."
source $APP_DIR/backend/venv/bin/activate
cd $APP_DIR/backend
python -c "from app import app, db; with app.app_context(): db.create_all(); print('✅ 数据库表创建成功')"

echo ""
echo "⚙️ 10. 创建系统服务..."
cat > /etc/systemd/system/blog-backend.service <<EOF
[Unit]
Description=Personal Blog Backend
After=network.target mysql.service

[Service]
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 --timeout 120 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable blog-backend
systemctl start blog-backend

echo ""
echo "🔒 11. 配置 SSL 证书（Let's Encrypt）..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo ""
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "📝 管理员账号信息:"
echo "  用户名: admin"
echo "  密码: $(grep ADMIN_PASSWORD $APP_DIR/backend/.env | cut -d= -f2)"
echo ""
echo "🌐 访问地址:"
echo "  博客首页: https://$DOMAIN"
echo "  管理后台: https://$DOMAIN/admin-login"
echo ""
echo "🗄️ 数据库信息:"
echo "  数据库名: $DB_NAME"
echo "  用户名: $DB_USER"
echo "  密码: $DB_PASS"
echo ""
echo "📁 项目目录: $APP_DIR"
echo ""
echo "💡 常用命令:"
echo "  查看后端状态: systemctl status blog-backend"
echo "  查看后端日志: journalctl -u blog-backend -f"
echo "  重启后端服务: systemctl restart blog-backend"
echo "  重启 Nginx: systemctl restart nginx"
echo "  更新博客: cd $APP_DIR && git pull && npm run build && systemctl restart blog-backend"
