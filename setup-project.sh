#!/bin/bash

echo "设置个人博客项目..."

echo ""
echo "1. 安装前端依赖..."
cd frontend
npm install
cd ..

echo ""
echo "2. 安装后端依赖..."
cd backend
pip install -r requirements.txt
cd ..

echo ""
echo "3. 创建必要的目录..."
mkdir -p frontend/public
mkdir -p frontend/src/assets

echo ""
echo "4. 复制图片文件..."
if [ -f "img/profile.jpg" ]; then
    cp img/profile.jpg frontend/public/
fi
if [ -f "img/background.jpg" ]; then
    cp img/background.jpg frontend/public/
fi

echo ""
echo "项目设置完成！"
echo ""
echo "下一步："
echo "1. 配置数据库连接信息"
echo "2. 运行 ./start-dev.sh 启动开发环境"
echo ""
read -n 1
