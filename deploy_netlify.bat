@echo off
chcp 65001 >nul
echo Netlify部署脚本
echo ================

echo.
echo 正在准备部署到Netlify...

echo.
echo 步骤1: 构建前端项目
cd frontend
echo 清理旧的构建文件...
if exist dist rmdir /s /q dist
echo 安装依赖...
npm install
echo 构建项目...
npm run build
cd ..

echo.
echo 步骤2: 检查构建结果
if exist frontend\dist (
    echo ✅ 构建成功！dist目录已生成
    echo.
    echo 步骤3: 部署到Netlify
    echo 请按照以下步骤操作：
    echo.
    echo 1. 访问 https://netlify.com
    echo 2. 点击 "Sign up" 注册账户
    echo 3. 选择 "Continue with GitHub"
    echo 4. 授权Netlify访问你的GitHub
    echo 5. 点击 "New site from Git"
    echo 6. 选择你的仓库: Frostsnow35/personal-blog
    echo 7. 配置构建设置:
    echo    - Base directory: frontend
    echo    - Build command: npm run build
    echo    - Publish directory: dist
    echo 8. 点击 "Deploy site"
    echo.
    echo 部署完成后，你会获得一个类似这样的URL:
    echo https://random-name-123456.netlify.app
) else (
    echo ❌ 构建失败！请检查错误信息
)

echo.
echo 按任意键退出...
pause >nul
