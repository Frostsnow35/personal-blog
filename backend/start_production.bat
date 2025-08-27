@echo off
chcp 65001 >nul
echo 启动生产环境配置测试...

echo.
echo 设置环境变量...
set FLASK_ENV=production
set FLASK_DEBUG=false

echo.
echo 当前环境变量:
echo FLASK_ENV=%FLASK_ENV%
echo FLASK_DEBUG=%FLASK_DEBUG%

echo.
echo 测试生产环境配置...
python app.py

echo.
echo 按任意键退出...
pause >nul

