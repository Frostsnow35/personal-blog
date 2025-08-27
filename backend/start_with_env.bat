@echo off
echo 设置环境变量并启动Flask应用...

set DATABASE_URL=mysql+pymysql://blog_user:blog_password@localhost:3306/personal_blog?charset=utf8mb4&collation=utf8mb4_unicode_ci
set SECRET_KEY=your-super-secret-key-change-this-in-production
set JWT_SECRET=your-jwt-secret-change-this
set FLASK_ENV=development
set FLASK_DEBUG=true
set CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
set ADMIN_USERNAME=admin
set ADMIN_PASSWORD=change-me

echo 环境变量设置完成
echo DATABASE_URL=%DATABASE_URL%
echo.

echo 启动Flask应用...
python app.py

pause
