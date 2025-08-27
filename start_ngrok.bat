@echo off
chcp 65001 >nul
echo 启动ngrok内网穿透
echo =================

echo.
echo 检查ngrok是否已安装...
if not exist ngrok.exe (
    echo 错误：ngrok.exe 不存在
    echo 请先运行 install_ngrok.bat 安装客户端
    pause
    exit /b 1
)

echo.
echo 启动ngrok...
echo 注意：请确保已经完成以下步骤：
echo 1. 注册ngrok账户：https://ngrok.com
echo 2. 获取authtoken
echo 3. 运行: ngrok.exe config add-authtoken YOUR_TOKEN
echo.

ngrok.exe http 3000 --domain=frostsnow35.dpdns.org

echo.
echo ngrok已停止，按任意键退出...
pause >nul
