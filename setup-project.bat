@echo off
chcp 65001 >nul
echo ========================================
echo Personal Blog Project Setup
echo ========================================
echo.

echo 1. Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo 2. Installing backend dependencies...
cd backend
call pip install -r requirements.txt
cd ..

echo.
echo 3. Creating necessary directories...
if not exist "frontend\public" mkdir "frontend\public"
if not exist "frontend\src\assets" mkdir "frontend\src\assets"

echo.
echo 4. Copying image files...
if exist "img\profile.jpg" copy "img\profile.jpg" "frontend\public\"
if exist "img\background.jpg" copy "img\background.jpg" "frontend\public\"

echo.
echo ========================================
echo Project Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Configure database connection information
echo 2. Run start-dev.bat to start development environment
echo.
pause
