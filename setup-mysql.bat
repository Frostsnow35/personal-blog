@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 8.0 Quick Setup Script
echo ========================================
echo.

echo Please follow these steps to configure MySQL:
echo.
echo 1. Download MySQL 8.0 MSI Installer
echo    Visit: https://dev.mysql.com/downloads/mysql/
echo    Select: MySQL Community Server 8.0.x
echo    Download: Windows (x86, 64-bit), MSI Installer
echo.

echo 2. Install MySQL
echo    - Double-click .msi file
echo    - Choose "Typical" installation
echo    - Set root password (remember it!)
echo    - Configure as Windows service
echo.

echo 3. Configure Environment Variables
echo    - Right-click "This PC" -> "Properties"
echo    - "Advanced system settings" -> "Environment Variables"
echo    - Add to "System variables" -> "Path":
echo      C:\Program Files\MySQL\MySQL Server 8.0\bin
echo.

echo 4. Test MySQL Installation
echo    Press any key to continue testing...
pause >nul

echo.
echo Testing MySQL connection...
echo.

REM Check if MySQL is in PATH
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MySQL not found, please check environment variables
    echo Current PATH MySQL entries:
    echo %PATH% | findstr /i mysql
    echo.
    echo Please ensure MySQL bin directory is added to PATH
    pause
    exit /b 1
)

echo [SUCCESS] MySQL found, version info:
mysql --version

echo.
echo Checking MySQL service status...
sc query MySQL80 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MySQL80 service not found
    echo Please check if MySQL is properly installed
    pause
    exit /b 1
)

echo [SUCCESS] MySQL80 service found

echo.
echo Checking service status...
sc query MySQL80 | findstr "RUNNING"
if %errorlevel% neq 0 (
    echo [WARNING] MySQL service not running, starting...
    net start MySQL80
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to start, please start manually
        echo Method: Services Manager -> MySQL80 -> Start
        pause
        exit /b 1
    )
    echo [SUCCESS] MySQL service started
) else (
    echo [SUCCESS] MySQL service is running
)

echo.
echo ========================================
echo MySQL Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create database and user (see MYSQL_SETUP.md)
echo 2. Configure project environment variables
echo 3. Run setup-project.bat
echo.
echo Press any key to exit...
pause >nul
