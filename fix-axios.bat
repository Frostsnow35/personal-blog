@echo off
chcp 65001 >nul
echo 正在修复axios版本兼容性问题...

cd frontend

echo 卸载当前axios版本...
npm uninstall axios

echo 安装兼容的axios版本...
npm install axios@0.27.2

echo 清理缓存...
npm cache clean --force

echo 重新安装依赖...
npm install

echo axios版本修复完成！
echo 现在请重新启动开发环境：
echo start-dev.bat

pause

