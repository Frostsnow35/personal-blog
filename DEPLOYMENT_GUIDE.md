# 个人博客混合部署指南（免费方案）

## 🎯 方案概述

**混合方案**：前端用 Vercel（免费托管），后端在本地运行并通过 Cloudflare Tunnel（免费内网穿透）暴露到公网。

| 组件 | 服务 | 费用 |
|------|------|------|
| 前端 | Vercel | 免费 |
| 后端 | 本地运行 + Cloudflare Tunnel | 免费 |
| 数据库 | SQLite（本地文件） | 免费 |
| 域名 | Cloudflare + 免费域名 | 免费 |

---

## 一、前端部署（Vercel）

### 1.1 注册 Vercel

1. 访问 [Vercel.com](https://vercel.com/)
2. 使用 GitHub 登录（免费）

### 1.2 导入项目

1. 点击 **Add New Project**
2. 选择你的博客仓库 `Frostsnow35/personal-blog`
3. 点击 **Deploy**

### 1.3 配置 Vercel 环境变量

在项目设置 → **Environment Variables** 添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE_URL` | `https://你的域名/api`（Cloudflare Tunnel 地址） |
| `VITE_APP_TITLE` | `个人博客` |
| `VITE_APP_DESCRIPTION` | `我的个人博客网站` |

---

## 二、后端部署（Cloudflare Tunnel）

### 2.1 注册 Cloudflare

1. 访问 [Cloudflare.com](https://dash.cloudflare.com/)
2. 注册账户（免费）

### 2.2 添加网站

1. 在 Cloudflare 中添加你的域名
2. 更新 DNS 记录（按照 Cloudflare 提示操作）

### 2.3 安装 Cloudflare Tunnel

**Windows 用户**：

```powershell
# 下载安装
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi" -OutFile "cloudflared.msi"
msiexec /i cloudflared.msi /quiet

# 登录
cloudflared tunnel login
```

**Linux/macOS 用户**：

```bash
# 下载安装
curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# 登录
cloudflared tunnel login
```

### 2.4 创建 Tunnel

```bash
# 创建 Tunnel
cloudflared tunnel create blog-tunnel

# 获取 Tunnel ID
cloudflared tunnel list

# 配置 DNS 记录（将域名指向 Tunnel）
cloudflared tunnel route dns blog-tunnel your-domain.com
```

### 2.5 创建配置文件

创建 `config.yml`：

```yaml
tunnel: blog-tunnel
credentials-file: ~/.cloudflared/你的TunnelID.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:5000
  - service: http_status:404
```

### 2.6 启动 Tunnel

```bash
# 方式一：前台运行
cloudflared tunnel run blog-tunnel

# 方式二：后台服务（推荐）
cloudflared service install
cloudflared tunnel run blog-tunnel
```

---

## 三、本地后端配置

### 3.1 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3.2 配置环境变量

创建 `backend/.env`：

```env
# 数据库配置（使用 SQLite，无需额外服务）
DATABASE_URL=

# 安全配置
SECRET_KEY=生成一个随机字符串（python -c "import secrets; print(secrets.token_hex(32))"）
JWT_SECRET=生成一个随机字符串
FLASK_ENV=production
FLASK_DEBUG=false

# 站点配置
SITE_URL=https://你的域名.com
CORS_ORIGINS=https://你的vercel域名.vercel.app,https://你的域名.com,https://*.trycloudflare.com

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的密码
```

### 3.3 启动后端

```bash
cd backend
python app.py
```

或者使用启动脚本：

```bash
# Windows
start-production.bat

# Linux/macOS
python backend/app.py
```

---

## 四、完整部署流程

### 4.1 步骤总结

```
┌─────────────────────────────────────────────────────────────┐
│                    部署流程                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Vercel 部署前端                                          │
│     └── 设置环境变量 VITE_API_BASE_URL                       │
├─────────────────────────────────────────────────────────────┤
│  2. Cloudflare 添加域名                                       │
│     └── 配置 DNS 记录                                        │
├─────────────────────────────────────────────────────────────┤
│  3. Cloudflare Tunnel                                       │
│     └── 创建 Tunnel 并指向 localhost:5000                    │
├─────────────────────────────────────────────────────────────┤
│  4. 本地启动后端                                             │
│     └── python backend/app.py                                │
├─────────────────────────────────────────────────────────────┤
│  5. 验证                                                    │
│     ├── https://你的域名.com/api/posts                       │
│     └── https://你的vercel域名.vercel.app                    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 验证步骤

1. **检查后端 API**：
   ```bash
   curl https://你的域名.com/api/posts
   ```
   应返回 JSON 数据。

2. **检查前端**：
   - 访问 `https://你的vercel域名.vercel.app`
   - 确认文章列表能正常加载

3. **检查管理后台**：
   - 访问 `https://你的vercel域名.vercel.app/admin-login`
   - 使用配置的管理员账号登录

---

## 五、域名配置

### 5.1 使用免费域名（推荐）

1. 在 [Freenom](https://www.freenom.com/) 获取免费域名（.tk/.ml/.ga/.cf/.gq）
2. 在 Cloudflare 中添加该域名
3. 更新 DNS 记录指向 Cloudflare

### 5.2 使用已有域名

1. 在 Cloudflare 中添加你的域名
2. 更新域名注册商的 DNS 服务器为 Cloudflare 的服务器
3. 创建 DNS 记录指向 Cloudflare Tunnel

---

## 六、项目配置说明

### 6.1 前端 API 配置

前端 `src/utils/http.ts` 的配置逻辑：

```typescript
// 优先使用环境变量 VITE_API_BASE_URL
const BASE_URL =
  normalizedEnvBase ||                    // 生产环境：VITE_API_BASE_URL（如 https://你的域名/api）
  (isDev ? 'http://localhost:5000/api' : '') ||  // 开发环境：本地后端
  `${window.location.origin}/api`         // 备用：同域名 API
```

### 6.2 后端 CORS 配置

后端 `app.py` 已默认允许以下域名：

```python
cors_default_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://*.vercel.app',          # Vercel 域名
    'https://*.trycloudflare.com',   # Cloudflare Tunnel 临时域名
    'https://frostsnow35.dpdns.org'  # 你的域名
]
```

---

## 七、常用命令

### 7.1 启动服务

```bash
# 启动后端
cd backend
python app.py

# 启动 Cloudflare Tunnel
cloudflared tunnel run blog-tunnel

# 更新代码后重启
cd backend
git pull
python app.py
```

### 7.2 Cloudflare Tunnel 管理

```bash
# 查看 Tunnel 列表
cloudflared tunnel list

# 查看 Tunnel 状态
cloudflared tunnel info blog-tunnel

# 删除 Tunnel
cloudflared tunnel delete blog-tunnel

# 重启 Tunnel
cloudflared tunnel restart blog-tunnel
```

---

## 八、故障排查

### 8.1 前端无法访问 API

- 检查 `VITE_API_BASE_URL` 是否正确设置
- 检查 Cloudflare Tunnel 是否在运行
- 检查 CORS 配置是否包含你的 Vercel 域名

### 8.2 Cloudflare Tunnel 连接失败

- 检查网络是否能访问 Cloudflare
- 检查 `config.yml` 配置是否正确
- 检查 Tunnel 凭证文件是否存在

### 8.3 后端启动失败

- 检查 Python 环境是否正确
- 检查依赖是否已安装
- 检查 `.env` 文件配置是否正确

### 8.4 数据库操作失败

- 检查 SQLite 数据库文件权限
- 检查 `personal_blog.db` 是否存在

---

## 九、优化建议

### 9.1 性能优化

- 在 Cloudflare 中启用 **Cache Rules** 缓存静态资源
- 在 Cloudflare 中启用 **Always Online**
- 启用 Cloudflare **Argo Smart Routing**（付费）

### 9.2 安全建议

- 使用强密码作为管理员密码
- 在 Cloudflare 中启用 **Firewall Rules**
- 在 Cloudflare 中启用 **SSL/TLS**（Full 模式）

### 9.3 可靠性

- 使用 Windows 任务计划或 Linux systemd 确保后端开机自启
- 使用 Cloudflare Tunnel 后台服务模式
- 定期备份 SQLite 数据库文件

---

## 十、部署检查清单

- [ ] Vercel 项目已创建并部署
- [ ] Vercel 环境变量 `VITE_API_BASE_URL` 已设置
- [ ] Cloudflare 账户已注册
- [ ] 域名已添加到 Cloudflare
- [ ] Cloudflare Tunnel 已创建
- [ ] DNS 记录已配置（指向 Tunnel）
- [ ] 本地后端已启动
- [ ] Cloudflare Tunnel 已启动
- [ ] API 接口可正常访问
- [ ] 前端可正常加载数据
- [ ] 管理后台可正常登录

---

## 十一、配置示例

### Vercel 环境变量示例

```
VITE_API_BASE_URL=https://blog.your-domain.com/api
VITE_APP_TITLE=个人博客
VITE_APP_DESCRIPTION=我的个人博客网站
```

### Cloudflare Tunnel config.yml 示例

```yaml
tunnel: blog-tunnel
credentials-file: ~/.cloudflared/12345678-1234-1234-1234-1234567890ab.json

ingress:
  - hostname: blog.your-domain.com
    service: http://localhost:5000
  - service: http_status:404
```

### 后端 .env 示例

```env
DATABASE_URL=
SECRET_KEY=abcdef1234567890abcdef1234567890
JWT_SECRET=abcdef1234567890abcdef1234567890
FLASK_ENV=production
FLASK_DEBUG=false
SITE_URL=https://blog.your-domain.com
CORS_ORIGINS=https://your-name.vercel.app,https://blog.your-domain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
```

---

## 总结

这个混合方案完全免费，无需购买服务器，无需信用卡：

- ✅ **前端**：Vercel 免费托管，自动构建和部署
- ✅ **后端**：本地运行 Flask，通过 Cloudflare Tunnel 暴露
- ✅ **数据库**：SQLite 本地文件，无需额外服务
- ✅ **域名**：Cloudflare 免费 DNS + Freenom 免费域名

只需保持本地电脑开机运行后端和 Cloudflare Tunnel，博客就能在公网访问！
