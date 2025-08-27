@echo off
chcp 65001 >nul
echo ========================================
echo 启动SQLite版本的Flask应用
echo ========================================
echo.

echo 正在初始化SQLite数据库...
python init_sqlite.py

echo.
echo 数据库初始化完成，正在启动Flask应用...
echo.

set FLASK_ENV=development
set FLASK_DEBUG=true
set SECRET_KEY=your-super-secret-key-change-this-in-production
set JWT_SECRET=your-jwt-secret-change-this

echo 环境变量设置完成
echo.

python app.py

pause
