@echo off
chcp 65001 >nul
echo ========================================
echo Blog Database Initialization Script
echo ========================================
echo.

echo This script will create blog database and user
echo Please ensure MySQL service is running
echo.

set /p MYSQL_USER=Enter MySQL username (default: root): 
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD=Enter MySQL password: 
if "%MYSQL_PASSWORD%"=="" (
    echo [ERROR] Password cannot be empty
    pause
    exit /b 1
)

echo.
echo Testing MySQL connection...
echo.

REM Test connection
echo exit | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL connection failed, please check:
    echo    1. MySQL service is running
    echo    2. Username and password are correct
    echo    3. User has sufficient privileges
    pause
    exit /b 1
)

echo [SUCCESS] MySQL connection successful!

echo.
echo Creating database and user...
echo.

REM Create database
echo CREATE DATABASE IF NOT EXISTS personal_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD%
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create database
    pause
    exit /b 1
)

echo [SUCCESS] Database personal_blog created successfully

REM Create dedicated user
echo CREATE USER IF NOT EXISTS 'blog_user'@'localhost' IDENTIFIED BY 'blog_password_123'; | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD%
if %errorlevel% neq 0 (
    echo [WARNING] Failed to create user, user may already exist
)

REM Grant privileges
echo GRANT ALL PRIVILEGES ON personal_blog.* TO 'blog_user'@'localhost'; | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD%
if %errorlevel% neq 0 (
    echo [ERROR] Failed to grant privileges
    pause
    exit /b 1
)

echo FLUSH PRIVILEGES; | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD%
echo [SUCCESS] User blog_user created successfully, password: blog_password_123

echo.
echo Initializing database table structure...
echo.

REM Check if initialization script exists
if not exist "database\init.sql" (
    echo [ERROR] Database initialization script database\init.sql not found
    echo Please ensure project files are complete
    pause
    exit /b 1
)

REM Execute initialization script
mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% personal_blog < database\init.sql
if %errorlevel% neq 0 (
    echo [ERROR] Failed to execute initialization script
    pause
    exit /b 1
)

echo [SUCCESS] Database table structure initialized successfully!

echo.
echo Verifying database...
echo.

REM Show database list
echo SHOW DATABASES; | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD%

echo.
echo Verifying table structure...
echo.

REM Show table list
echo USE personal_blog; SHOW TABLES; | mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD%

echo.
echo ========================================
echo Database Initialization Complete!
echo ========================================
echo.
echo Database Information:
echo - Database Name: personal_blog
echo - Username: blog_user
echo - Password: blog_password_123
echo - Host: localhost
echo - Port: 3306
echo.

echo Connection String:
echo mysql+pymysql://blog_user:blog_password_123@localhost:3306/personal_blog
echo.

echo Next Steps:
echo 1. Configure database connection in backend\.env file
echo 2. Run setup-project.bat to install project dependencies
echo 3. Start development environment
echo.

echo Press any key to exit...
pause >nul
