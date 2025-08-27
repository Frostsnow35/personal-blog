@echo off
chcp 65001 >nul
echo SSL证书配置脚本
echo =================

echo.
echo 请选择SSL证书获取方式：
echo 1. 使用Let's Encrypt免费证书（推荐）
echo 2. 使用自签名证书（仅测试用）
echo 3. 手动上传已有证书

set /p choice="请选择 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 选择Let's Encrypt免费证书
    echo 注意：需要域名已经正确解析到服务器IP
    echo.
    set /p domain="请输入你的域名（如：example.com）: "
    echo 域名: %domain%
    echo.
    echo 请确保：
    echo 1. 域名已解析到服务器IP
    echo 2. 服务器80和443端口已开放
    echo 3. 防火墙允许HTTP和HTTPS流量
    echo.
    echo 然后运行：certbot certonly --standalone -d %domain% -d www.%domain%
    
) else if "%choice%"=="2" (
    echo.
    echo 选择自签名证书（仅测试用）
    echo.
    set /p domain="请输入你的域名（如：example.com）: "
    echo 域名: %domain%
    echo.
    echo 生成自签名证书...
    echo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout %domain%.key -out %domain%.crt
    echo.
    echo 注意：自签名证书会在浏览器中显示警告
    
) else if "%choice%"=="3" (
    echo.
    echo 手动上传证书
    echo.
    echo 请将你的SSL证书文件放在以下位置：
    echo - 证书文件: ssl/your-domain.com.crt
    echo - 私钥文件: ssl/your-domain.com.key
    echo.
    echo 然后更新nginx.conf中的域名配置
    
) else (
    echo 无效选择
)

echo.
echo 按任意键退出...
pause >nul
