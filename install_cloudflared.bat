@echo off
chcp 65001 >nul
echo 安装Cloudflare Tunnel客户端
echo ===========================

echo.
echo 正在下载Cloudflare Tunnel客户端...

:: 下载Windows版本的cloudflared
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"

if exist cloudflared.exe (
    echo.
    echo 下载成功！cloudflared.exe 已保存到当前目录
    echo.
    echo 下一步操作：
    echo 1. 运行: cloudflared.exe tunnel login
    echo 2. 在浏览器中完成登录认证
    echo 3. 运行: cloudflared.exe tunnel create frostsnow35-blog
    echo 4. 运行: cloudflared.exe tunnel route dns frostsnow35-blog frostsnow35.dpdns.org
    echo.
    echo 按任意键退出...
) else (
    echo.
    echo 下载失败，请检查网络连接
    echo 或者手动访问：https://github.com/cloudflare/cloudflared/releases
)

pause >nul
