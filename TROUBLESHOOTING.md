# 问题排查指南

## 常见问题及解决方案

### 1. TypeScript类型错误

#### 问题描述
```
找不到模块"vue"或其相应的类型声明
找不到模块"vue-router"或其相应的类型声明
```

#### 解决方案
1. 确保已安装所有依赖：
   ```bash
   cd frontend
   npm install
   ```

2. 重启TypeScript服务：
   - VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
   - 其他编辑器：重启编辑器

3. 检查`tsconfig.json`配置是否正确

4. 如果问题持续，尝试清除缓存：
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### 2. 依赖安装失败

#### 问题描述
```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path package.json
```

#### 解决方案
1. 确保在正确的目录中：
   ```bash
   cd frontend
   ls package.json  # 应该能看到文件
   ```

2. 检查Node.js版本：
   ```bash
   node --version  # 需要18+
   ```

3. 使用国内镜像：
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

### 3. 后端启动失败

#### 问题描述
```
ModuleNotFoundError: No module named 'flask'
```

#### 解决方案
1. 确保已安装Python依赖：
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. 检查Python版本：
   ```bash
   python --version  # 需要3.8+
   ```

3. 使用虚拟环境：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   ```

### 4. 数据库连接失败

#### 问题描述
```
OperationalError: (2003, "Can't connect to MySQL server")
```

#### 解决方案
1. 确保MySQL服务正在运行
2. 检查数据库连接信息：
   - 编辑`backend/env.example`
   - 复制为`.env`并填入正确的数据库信息
3. 确保数据库已创建：
   ```sql
   CREATE DATABASE personal_blog;
   ```

### 5. 前端构建失败

#### 问题描述
```
Build failed with errors
```

#### 解决方案
1. 检查TypeScript错误：
   ```bash
   npm run build
   ```

2. 修复类型错误后重新构建

3. 如果仍有问题，尝试：
   ```bash
   npm run lint --fix
   ```

### 6. 端口占用

#### 问题描述
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 解决方案
1. 查找占用端口的进程：
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. 终止进程或修改端口配置

### 7. 图片文件缺失

#### 问题描述
```
Failed to load resource: the server responded with a status of 404
```

#### 解决方案
1. 确保图片文件存在于正确位置：
   - `frontend/public/profile.jpg`
   - `frontend/public/background.jpg`

2. 运行设置脚本：
   ```bash
   # Windows
   setup-project.bat
   
   # Linux/Mac
   ./setup-project.sh
   ```

## 开发环境检查清单

- [ ] Node.js 18+ 已安装
- [ ] Python 3.8+ 已安装
- [ ] MySQL 8.0 已安装并运行
- [ ] 前端依赖已安装 (`npm install`)
- [ ] 后端依赖已安装 (`pip install -r requirements.txt`)
- [ ] 数据库已创建并初始化
- [ ] 环境变量已配置
- [ ] 图片文件已复制到正确位置

## 获取帮助

如果以上解决方案无法解决问题，请：

1. 检查控制台错误信息
2. 查看项目日志
3. 提交Issue，包含：
   - 错误信息
   - 操作系统版本
   - Node.js/Python版本
   - 完整的错误堆栈

## 预防措施

1. 定期更新依赖版本
2. 使用虚拟环境隔离Python依赖
3. 保持开发环境的一致性
4. 定期备份数据库
