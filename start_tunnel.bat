@echo off
chcp 65001 >nul
echo 启动Cloudflare Tunnel
echo ===================

echo.
echo 检查cloudflared是否已安装...
if not exist cloudflared.exe (
    echo 错误：cloudflared.exe 不存在
    echo 请先运行 install_cloudflared.bat 安装客户端
    pause
    exit /b 1
)

echo.
echo 启动Tunnel...
echo 注意：请确保已经完成以下步骤：
echo 1. cloudflared.exe tunnel login
echo 2. cloudflared.exe tunnel create frostsnow35-blog
echo 3. cloudflared.exe tunnel route dns frostsnow35-blog frostsnow35.dpdns.org
echo.

cloudflared.exe tunnel --config cloudflare-tunnel.yml run

echo.
echo Tunnel已停止，按任意键退出...
pause >nul
