@echo off
REM Netlify构建脚本 (Windows版本)
echo 🚀 开始Netlify构建...

REM 设置Node.js版本
echo 📦 设置Node.js环境...
set NODE_VERSION=18

REM 清理缓存
echo 🧹 清理缓存...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM 安装依赖
echo 📥 安装依赖...
npm install --legacy-peer-deps

REM 检查esbuild
echo 🔍 检查esbuild...
if not exist "node_modules\esbuild" (
    echo ⚠️ esbuild缺失，重新安装...
    npm install esbuild --save-dev
)

REM 构建项目
echo 🔨 构建项目...
npm run build

REM 检查构建结果
if exist "dist" (
    echo ✅ 构建成功！dist目录已生成
    dir dist
) else (
    echo ❌ 构建失败！
    exit /b 1
)

echo 🎉 Netlify构建完成！
