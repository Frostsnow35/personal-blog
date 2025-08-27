#!/bin/bash

echo "启动个人博客开发环境..."

echo ""
echo "1. 启动后端服务器..."
cd backend
gnome-terminal --title="Backend Server" -- bash -c "python app.py; exec bash" &
cd ..

echo ""
echo "2. 启动前端开发服务器..."
cd frontend
gnome-terminal --title="Frontend Dev Server" -- bash -c "npm run dev; exec bash" &
cd ..

echo ""
echo "开发环境启动完成！"
echo "后端服务器: http://localhost:5000"
echo "前端开发服务器: http://localhost:3000"
echo ""
echo "按任意键退出..."
read -n 1

