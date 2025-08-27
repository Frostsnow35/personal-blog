# MySQL 8.0 Setup Guide

## Prerequisites

- Windows 10/11 Operating System
- Administrator privileges
- At least 2GB available disk space

## Step 1: Download MySQL Installer

### Method 1: Official Download (Recommended)
1. Visit [MySQL Official Download Page](https://dev.mysql.com/downloads/mysql/)
2. Select "MySQL Community Server"
3. Choose version: 8.0.x (latest stable)
4. Select OS: Windows (x86, 64-bit)
5. Download "Windows (x86, 64-bit), MSI Installer"

### Method 2: Package Manager
```bash
# Using Chocolatey
choco install mysql

# Using Scoop
scoop install mysql
```

## Step 2: Install MySQL

### Using MSI Installer (Recommended for beginners)
1. Double-click the downloaded `.msi` file
2. Choose installation type: **Typical** or **Custom**
3. Configure MySQL Server:
   - Port: 3306 (default)
   - Service Name: MySQL80
4. Set root password:
   - Password: `your_password_here` (remember this!)
   - Confirm password
5. Configure Windows Service:
   - Check "Configure MySQL Server as a Windows Service"
   - Service Name: MySQL80
   - Auto-start: Yes
6. Complete installation

## Step 3: Configure Environment Variables

1. Right-click "This PC" → "Properties" → "Advanced system settings"
2. Click "Environment Variables"
3. In "System variables" find "Path"
4. Click "Edit" → "New"
5. Add MySQL bin directory: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
6. Click "OK" to save all dialogs

## Step 4: Test Installation

1. **Run the setup script**:
   - Double-click `setup-mysql.bat`
   - Follow the prompts
   - Script will automatically test MySQL installation

2. **Manual test**:
   - Open Command Prompt
   - Type: `mysql --version`
   - Should display MySQL version information

## Step 5: Create Database

1. **Run database initialization script**:
   - Double-click `setup-database.bat`
   - Enter your MySQL root password
   - Script will automatically create blog database and user

2. **Manual creation (optional)**:
   ```cmd
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE personal_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'blog_password_123';
   GRANT ALL PRIVILEGES ON personal_blog.* TO 'blog_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

## Step 6: Configure Project Environment

1. **Create environment file**:
   - Create `.env` file in `backend` directory
   - Content:
   ```env
   DATABASE_URL=mysql+pymysql://blog_user:blog_password_123@localhost:3306/personal_blog
   SECRET_KEY=your_secret_key_here_12345
   FLASK_ENV=development
   FLASK_DEBUG=1
   HOST=0.0.0.0
   PORT=5000
   ```

## Verify Configuration

Run these commands to verify:
```cmd
# Check MySQL service status
sc query MySQL80

# Test database connection
mysql -u blog_user -p -h localhost

# View databases
SHOW DATABASES;
USE personal_blog;
SHOW TABLES;
```

## Next Steps

After MySQL configuration:
1. Run `setup-project.bat` to install project dependencies
2. Start backend service to test database connection
3. Start frontend service to begin development

## Troubleshooting

If you encounter issues:
1. Check `MYSQL_SETUP.md` for detailed guide
2. Check `TROUBLESHOOTING.md` for problem solutions
3. Ensure MySQL service is running
4. Check if port 3306 is occupied

## Quick Commands

```cmd
# Start MySQL service
net start MySQL80

# Stop MySQL service
net stop MySQL80

# Check service status
sc query MySQL80

# Connect to MySQL
mysql -u root -p

# Check MySQL version
mysql --version
```

## Security Notes

1. **Don't use default passwords**
2. **Create dedicated users**, avoid using root
3. **Limit user privileges** to necessary permissions only
4. **Update passwords regularly**
5. **Configure firewall** to limit access sources
6. **Enable SSL connections** (production environment)

Now you can start configuring MySQL! 🎉
