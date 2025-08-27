# MySQL 8.0 配置指南

## 📋 前置要求

- Windows 10/11 操作系统
- 管理员权限
- 至少 2GB 可用磁盘空间

## 🚀 第一步：下载MySQL安装包

### 方法1：官方下载（推荐）
1. 访问 [MySQL官方下载页面](https://dev.mysql.com/downloads/mysql/)
2. 选择 "MySQL Community Server"
3. 选择版本：8.0.x (最新稳定版)
4. 选择操作系统：Windows (x86, 64-bit)
5. 下载 "Windows (x86, 64-bit), ZIP Archive" 或 "MSI Installer"

### 方法2：使用包管理器
```bash
# 使用 Chocolatey
choco install mysql

# 使用 Scoop
scoop install mysql
```

## 🔧 第二步：安装MySQL

### 使用MSI安装器（推荐新手）
1. 双击下载的 `.msi` 文件
2. 选择安装类型：**Typical** 或 **Custom**
3. 配置MySQL服务器：
   - 端口：3306（默认）
   - 服务名称：MySQL80
4. 设置root密码：
   - 密码：`your_password_here`（请记住这个密码）
   - 确认密码
5. 配置Windows服务：
   - 选择 "Configure MySQL Server as a Windows Service"
   - 服务名称：MySQL80
   - 自动启动：是
6. 完成安装

### 使用ZIP压缩包
1. 解压到 `C:\mysql-8.0.x`
2. 创建配置文件 `C:\mysql-8.0.x\my.ini`：
```ini
[mysqld]
# 设置MySQL安装目录
basedir=C:\mysql-8.0.x
# 设置数据存储目录
datadir=C:\mysql-8.0.x\data
# 设置端口
port=3306
# 设置字符集
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
# 设置默认认证插件
default_authentication_plugin=mysql_native_password
# 设置最大连接数
max_connections=200
# 设置SQL模式
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO
```

3. 以管理员身份运行命令提示符：
```cmd
cd C:\mysql-8.0.x\bin
mysqld --initialize-insecure --user=mysql
mysqld --install MySQL80
net start MySQL80
```

## ⚙️ 第三步：配置环境变量

1. 右键 "此电脑" → "属性" → "高级系统设置"
2. 点击 "环境变量"
3. 在 "系统变量" 中找到 "Path"
4. 点击 "编辑" → "新建"
5. 添加MySQL bin目录路径：`C:\Program Files\MySQL\MySQL Server 8.0\bin`
6. 点击 "确定" 保存所有对话框

## 🔐 第四步：设置root密码

1. 打开命令提示符（以管理员身份）
2. 连接到MySQL：
```cmd
mysql -u root -p
```
3. 如果使用ZIP安装且未设置密码，直接输入：
```cmd
mysql -u root
```

4. 设置新密码：
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;
```

## 🗄️ 第五步：创建数据库和用户

1. 连接到MySQL：
```cmd
mysql -u root -p
```

2. 创建博客数据库：
```sql
CREATE DATABASE personal_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 创建专用用户（推荐）：
```sql
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'blog_password_123';
GRANT ALL PRIVILEGES ON personal_blog.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

4. 验证数据库：
```sql
SHOW DATABASES;
USE personal_blog;
SHOW TABLES;
```

5. 退出MySQL：
```sql
EXIT;
```

## 🧪 第六步：测试连接

1. 测试root用户连接：
```cmd
mysql -u root -p -h localhost
```

2. 测试博客用户连接：
```cmd
mysql -u blog_user -p -h localhost
```

3. 如果连接成功，你会看到MySQL欢迎信息

## 🔧 第七步：配置项目环境变量

1. 在项目根目录创建 `backend/.env` 文件：
```env
DATABASE_URL=mysql+pymysql://blog_user:blog_password_123@localhost:3306/personal_blog
SECRET_KEY=your_secret_key_here
FLASK_ENV=development
FLASK_DEBUG=1
HOST=0.0.0.0
PORT=5000
```

2. 或者使用root用户（不推荐生产环境）：
```env
DATABASE_URL=mysql+pymysql://root:your_root_password@localhost:3306/personal_blog
```

## 🚀 第八步：初始化数据库

1. 进入项目目录：
```cmd
cd backend
```

2. 执行数据库初始化脚本：
```cmd
mysql -u blog_user -p personal_blog < ../database/init.sql
```

3. 或者手动执行SQL命令：
```cmd
mysql -u blog_user -p
```
```sql
USE personal_blog;
SOURCE ../database/init.sql;
```

## 🐛 常见问题解决

### 问题1：服务启动失败
```cmd
# 检查服务状态
sc query MySQL80

# 手动启动服务
net start MySQL80

# 查看错误日志
# 检查 C:\ProgramData\MySQL\MySQL Server 8.0\Data\ 下的 .err 文件
```

### 问题2：端口被占用
```cmd
# 查看端口占用
netstat -ano | findstr :3306

# 终止占用进程
taskkill /PID <进程ID> /F
```

### 问题3：连接被拒绝
1. 检查MySQL服务是否运行
2. 检查防火墙设置
3. 检查用户权限
4. 检查主机绑定设置

### 问题4：字符集问题
```sql
-- 检查当前字符集
SHOW VARIABLES LIKE 'character_set%';

-- 设置字符集
SET NAMES utf8mb4;
```

## ✅ 验证配置

1. **服务状态**：MySQL80服务正在运行
2. **端口监听**：3306端口被监听
3. **数据库连接**：可以成功连接并创建数据库
4. **项目连接**：后端可以成功连接数据库

## 🔒 安全建议

1. **不要使用默认密码**
2. **创建专用用户**，避免使用root用户
3. **限制用户权限**，只授予必要权限
4. **定期更新密码**
5. **配置防火墙**，限制访问来源
6. **启用SSL连接**（生产环境）

## 📚 下一步

MySQL配置完成后，继续：
1. 运行 `setup-project.bat` 安装项目依赖
2. 启动后端服务测试数据库连接
3. 启动前端服务开始开发

## 🆘 获取帮助

如果遇到问题：
1. 查看MySQL错误日志
2. 检查Windows事件查看器
3. 参考 [MySQL官方文档](https://dev.mysql.com/doc/)
4. 查看项目的问题排查指南
