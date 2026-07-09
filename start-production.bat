@echo off
chcp 65001 >nul
echo ============================================
echo  个人博客 - 生产环境启动脚本（混合方案）
echo  前端：Vercel（免费托管）
echo  后端：本地运行 + Cloudflare Tunnel（免费穿透）
echo ============================================
echo.

echo 1. 设置生产环境变量...
set FLASK_ENV=production
set FLASK_DEBUG=false
set SITE_URL=https://frostsnow35.dpdns.org
set CORS_ORIGINS=https://frostsnow-personal-blog.vercel.app,https://frostsnow35.dpdns.org,https://*.trycloudflare.com

echo.
echo 2. 启动后端服务...
cd backend
start "Backend Server" cmd /k "python app.py"
cd ..

echo.
echo 3. 启动 Cloudflare Tunnel...
echo    请手动在终端执行：cloudflared tunnel run
echo.

echo ============================================
echo 启动完成！
echo ============================================
echo 后端服务：http://localhost:5000
echo 前端访问：https://frostsnow-personal-blog.vercel.app
echo Cloudflare Tunnel: https://frostsnow35.dpdns.org
echo.
echo 注意：
echo 1. 需要先安装 Cloudflare Tunnel 并配置域名
echo 2. Vercel 环境变量需设置：VITE_API_BASE_URL=https://frostsnow35.dpdns.org/api
echo.
echo 按任意键退出...
pause >nul
