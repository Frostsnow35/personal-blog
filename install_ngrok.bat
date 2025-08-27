@echo off
chcp 65001 >nul
echo 安装ngrok客户端
echo ================

echo.
echo 正在下载ngrok客户端...

:: 下载Windows版本的ngrok
powershell -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok.zip'"

if exist ngrok.zip (
    echo.
    echo 下载成功！正在解压...
    powershell -Command "Expand-Archive -Path 'ngrok.zip' -DestinationPath '.' -Force"
    del ngrok.zip
    
    if exist ngrok.exe (
        echo.
        echo 安装成功！ngrok.exe 已准备就绪
        echo.
        echo 下一步操作：
        echo 1. 注册ngrok账户：https://ngrok.com
        echo 2. 获取authtoken
        echo 3. 运行: ngrok.exe config add-authtoken YOUR_TOKEN
        echo 4. 运行: ngrok.exe http 3000 --domain=frostsnow35.dpdns.org
        echo.
    ) else (
        echo 解压失败
    )
) else (
    echo.
    echo 下载失败，请检查网络连接
    echo 或者手动访问：https://ngrok.com/download
)

echo 按任意键退出...
pause >nul
