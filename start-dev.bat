@echo off
chcp 65001 >nul
echo Starting Personal Blog Development Environment...
echo.

echo 1. Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python app.py"
cd ..

echo.
echo 2. Starting Frontend Development Server...
cd frontend
start "Frontend Dev Server" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo Development Environment Started!
echo ========================================
echo Backend Server: http://localhost:5000
echo Frontend Dev Server: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
