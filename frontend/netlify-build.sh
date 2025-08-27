#!/bin/bash

# Netlify构建脚本
echo "🚀 开始Netlify构建..."

# 设置Node.js版本
echo "📦 设置Node.js环境..."
export NODE_VERSION=18

# 清理缓存
echo "🧹 清理缓存..."
rm -rf node_modules package-lock.json

# 安装依赖
echo "📥 安装依赖..."
npm install --legacy-peer-deps

# 检查esbuild
echo "🔍 检查esbuild..."
if [ ! -d "node_modules/esbuild" ]; then
    echo "⚠️ esbuild缺失，重新安装..."
    npm install esbuild --save-dev
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！dist目录已生成"
    ls -la dist/
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 Netlify构建完成！"
