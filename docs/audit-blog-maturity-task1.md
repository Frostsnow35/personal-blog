# Task 1 现状梳理与生产风险清单（全项目体检基础）

本文档覆盖 Task 1 的 SubTask 1.1 至 1.3，目标是对前端（Frontend）、后端（Backend）与部署（Deployment）配置做一次“体检级别”的基线梳理，并给出生产风险清单与优先级建议，作为后续 SEO、i18n、站内搜索与路线图工作的输入。

## 范围与结论速览

当前项目为典型的 SPA（Single Page Application / 单页应用）前端加 Flask（Python Web Framework / Python Web 框架）后端结构，前端在 Netlify 部署，后端看起来以 Railway 作为生产托管目标，并通过 Netlify Redirects 代理前端同源的 /api 到后端服务。整体可以运行，但在“生产可用基线”上存在多处高风险配置与默认值兜底，集中在域名与环境变量来源、鉴权默认密码、sitemap/rss 的 localhost 硬编码、上传安全与速率限制缺失等方面。

## SubTask 1.1 技术栈、部署方式与环境变量来源

### 前端（Frontend）

技术栈与关键文件

- Vue 3（Vue.js / 渐进式前端框架）+ TypeScript（TypeScript / 静态类型）+ Vite（Vite / 构建工具）
  - 依赖与脚本：[package.json](file:///e:/Hackathon/personal_blog/personal-blog/frontend/package.json)
  - 构建配置：[vite.config.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/vite.config.ts)
- Tailwind CSS（Tailwind CSS / 原子化 CSS）
  - 配置：[tailwind.config.js](file:///e:/Hackathon/personal_blog/personal-blog/frontend/tailwind.config.js)
- Pinia（Pinia / 状态管理）与 Vue Router 4（Vue Router / 前端路由）
  - 路由：[router/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts)

API 地址与环境变量来源

- 统一请求封装在 [http.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/utils/http.ts)
  - 首选 VITE_API_BASE_URL
  - 若缺失则回退到 `${window.location.origin}/api`，依赖部署侧把 /api 代理到后端
  - 最终兜底为 `http://localhost:5000/api`
- 前端仓库内存在 `env.netlify` 与 `env.production`，但文件命名不符合 Vite 约定（Vite 默认加载 `.env*`），因此这两份文件默认不会在构建时自动生效
  - [env.netlify](file:///e:/Hackathon/personal_blog/personal-blog/frontend/env.netlify)
  - [env.production](file:///e:/Hackathon/personal_blog/personal-blog/frontend/env.production)

静态资源与可疑 404（Not Found / 资源不存在）

- [index.html](file:///e:/Hackathon/personal_blog/personal-blog/frontend/index.html) 引用 `/manifest.webmanifest` 与 `/favicon.svg`
- 已补齐 `manifest.webmanifest` 与 `favicon.svg`，避免固定静态资源 404

### 后端（Backend）

技术栈与关键文件

- Flask + Flask SQLAlchemy（ORM / 对象关系映射）+ Flask Migrate（Database Migration / 数据库迁移）
  - 主入口：[app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py)
- 鉴权使用 JWT（JSON Web Token / JSON 网络令牌）
  - 逻辑位于 [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L140-L175)
- Docker 运行入口为 gunicorn（WSGI Server / Python Web 服务器）
  - [Dockerfile](file:///e:/Hackathon/personal_blog/personal-blog/backend/Dockerfile)

数据库与环境变量来源

- DATABASE_URL 存在时使用该连接串，否则使用 SQLite 文件（`backend/personal_blog.db`）
  - 配置位于 [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L12-L35)
- 默认 SECRET_KEY 与 JWT_SECRET 存在不安全兜底值
  - `SECRET_KEY` 默认 `your-secret-key-here`
  - `JWT_SECRET` 默认 `change-this-in-env`
- env.example 给出了期望的变量集合，但代码并未完全按该配置驱动（例如 CORS_ORIGINS 变量未被使用）
  - [env.example](file:///e:/Hackathon/personal_blog/personal-blog/backend/env.example)

### 部署（Deployment）

当前仓库可见的部署形态

- 前端：Netlify
  - [netlify.toml](file:///e:/Hackathon/personal_blog/personal-blog/netlify.toml) 指定 `base = "frontend"`，构建命令 `npm run build:prod`，发布目录 `dist`
  - 通过 redirects 把 `/api/*` 代理到 `https://frostsnow35-blog.up.railway.app/api/:splat`
  - SPA 路由通过 `/* -> /index.html` 兜底
- 后端：看起来适配 Railway 或类似容器平台
  - Dockerfile 使用 gunicorn，端口 5000

与生产不一致的高风险点（High Risk / 高风险）

下述条目同时也是风险清单的输入，详见文末“生产风险清单”。

- 后端 sitemap 与 RSS 生成中硬编码 `http://localhost:3000`（生产将直接生成错误链接）
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L365-L406)
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L408-L456)
- Netlify 的 /api 代理目标为硬编码 Railway 域名，后端域名变更需要改仓库配置并重新部署
  - [netlify.toml](file:///e:/Hackathon/personal_blog/personal-blog/netlify.toml#L11-L16)
- 前端曾存在固定静态资源 404（manifest 与图标引用），已纳入 Stage 0 修补
  - [index.html](file:///e:/Hackathon/personal_blog/personal-blog/frontend/index.html)
- 后端 CORS（Cross Origin Resource Sharing / 跨域资源共享）允许来源写死在代码里，新增域名时会出现跨域阻断
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L57-L66)

## SubTask 1.2 信息架构与内容模型

### 信息架构（Information Architecture / 信息架构）

前端路由与页面集合

- Landing：`/`（[LandingPage.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/LandingPage.vue)）
- 首页列表：`/home`（[HomePage.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/HomePage.vue)）
- 关于：`/about`（[About.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/About.vue)）
- 归档：`/archive`（[Archive.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/Archive.vue)）
- 分类：`/category`（[Category.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/Category.vue)）
- 标签：`/tag`（[Tag.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/Tag.vue)）
- 文章详情：`/post/:slug`（[BlogPost.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/BlogPost.vue)）
- 个人主页：`/profile`（[Profile.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/Profile.vue)）
- 管理后台：`/admin-login`、`/admin/posts`、`/admin/posts/new`、`/admin/posts/:id/edit`、`/admin/dashboard`
- 管理员工具页：`/performance-test`、`/audio-library`
- 路由总览：[router/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts)

导航一致性问题（Navigation Consistency / 导航一致性）

- 多数页面把导航栏写在各自的 View 内，存在重复实现与潜在不一致风险（例如 Profile 页面入口在主导航中缺失，Landing 与 Home 的入口关系也较松散）
- 管理员页与公开页使用不同导航结构，需明确“公开信息架构”和“管理信息架构”边界

缺失页面与入口（Gap / 能力缺口）

- 缺少 404 页面（Not Found Page / 未找到页面）与 catch all 路由（Catch all route / 全匹配兜底路由）
  - Netlify 能将未知路径回退到 index.html，但前端路由未匹配时通常呈现空白页或不可控状态
- 缺少 500 错误页（Internal Error Page / 服务错误页）与统一错误态落地
- 缺少独立搜索页（Search Page / 搜索页），当前搜索主要在 `/home` 内做本地筛选
- 缺少语言入口（Language Entry / 语言入口）与 i18n 相关路由策略（Task 3 会展开）
- 缺少作者页（Author Page / 作者页）或作者模型，当前更接近“单作者博客”，作者信息以 Profile 形式存在

### 内容模型（Content Model / 内容模型）

后端主要实体

- Post（文章）
  - 字段：title、slug、content、excerpt、status、cover_url、category、tags、read_time、published_at、created_at、updated_at
  - 模型定义：[Post](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L121-L138)
- User（管理员用户）
  - 字段：username、password_hash、role
  - 模型定义：[User](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L457-L466)
- Profile（个人资料）在 SQLite 中存在表并由接口读取
  - 接口：[get_profile](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L960-L1013)

前端类型定义与字段对齐风险

- 前端 BlogPost 类型使用 `publishDate`、`coverImage` 等字段命名，但后端对外返回中更多使用 `published_at`、`cover_url`、`published_at/created_at` 的组合
  - 类型定义：[types/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/types/index.ts)
  - 这会导致数据映射依赖页面内临时转换，增加长期维护成本与缺陷概率

## SubTask 1.3 安全与运维基线

### 鉴权（Authentication / 身份认证）与权限（Authorization / 授权）

- 后端提供 `/api/auth/login`，返回 JWT access_token，前端存储在 localStorage 并在请求头附加 `Authorization: Bearer <token>`
  - 前端实现：[http.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/utils/http.ts)
  - 后端鉴权装饰器：[jwt_required_admin](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L140-L160)
- 管理接口以 `@jwt_required_admin` 保护，公共接口以 `/api/posts/published` 等提供前台读取

高风险点

- 默认管理员账号可能在启动时被创建，且缺少环境变量时会把默认密码置为 `admin`
  - [ensure_default_admin](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L468-L489)
- SECRET_KEY 与 JWT_SECRET 存在不安全默认值，生产忘记注入时等价于“全站可伪造 token”
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L48-L53)

### 速率限制（Rate Limiting / 速率限制）与依赖存在但未启用的能力缺口

- requirements.txt 已包含 Flask-Limiter 与 redis，但后端代码未实际启用限流器，也未配置 redis
  - 依赖文件：[requirements.txt](file:///e:/Hackathon/personal_blog/personal-blog/backend/requirements.txt)
- 这属于“依赖已存在但未启用”的能力缺口：面对登录爆破、接口刷量与爬虫请求时缺少基线防护

### 日志（Logging / 日志）、错误监控（Error Monitoring / 错误监控）与可观测性（Observability / 可观测性）

- 后端未见统一的请求日志格式、访问日志策略、关键操作审计日志
- 未见错误监控接入（例如 Sentry / 应用错误监控平台）
- 前端存在性能监控组件，但更偏向本地性能面板，不构成生产监控闭环
  - [PerformanceMonitor.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/components/PerformanceMonitor.vue)

### 备份（Backup / 备份）与迁移（Migration / 迁移）

- 当前仓库内存在 SQLite 数据库文件（`personal_blog.db`）且在根目录与 backend 目录均可见，容易造成“实际生产数据路径不一致”与误提交风险
  - [backend/personal_blog.db](file:///e:/Hackathon/personal_blog/personal-blog/backend/personal_blog.db)
  - [personal_blog.db](file:///e:/Hackathon/personal_blog/personal-blog/personal_blog.db)
- 迁移脚本存在，但缺少“生产级别备份频率、保留策略、恢复演练”的描述与自动化
  - [migrate_to_mysql.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/migrate_to_mysql.py)

### 上传（Upload / 上传）与静态文件暴露

- 管理员上传接口缺少文件类型与大小限制，文件名拼接未做安全净化（存在路径注入与特殊字符风险），上传文件对外公开访问
  - 上传接口：[admin_upload](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L344-L357)
  - 静态暴露：[serve_uploads](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L359-L364)

## 生产风险清单（含优先级）

优先级说明

- P0：可导致账号被接管、数据泄露、核心功能不可用、SEO 大面积错误
- P1：会造成显著的稳定性或可维护性风险，或在扩展时必然踩坑
- P2：体验缺陷或技术债，可排期修复

| 优先级 | 风险点 | 影响面 | 证据位置 | 建议方向 |
| --- | --- | --- | --- | --- |
| P0 | SECRET_KEY、JWT_SECRET 默认值兜底 | token 可伪造，权限被接管 | [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L48-L53) | 生产强制要求注入，启动时缺失直接 fail fast |
| P0 | 默认管理员密码可能为 admin | 登录爆破与接管后台 | [ensure_default_admin](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L468-L489) | 生产禁止兜底密码，必须提供 ADMIN_PASSWORD_HASH |
| P0 | sitemap.xml 与 rss.xml 硬编码 localhost | SEO 收录错误与链接污染 | [sitemap](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L365-L406)，[rss](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L408-L456) | 域名改为可配置，按部署域名输出 |
| P0 | 上传接口缺少安全净化与限制 | 任意文件上传与路径注入风险 | [admin_upload](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L344-L357) | 使用 secure_filename，增加白名单与大小限制，必要时改为对象存储 |
| P1 | /api 代理目标硬编码 Railway 域名 | 后端迁移成本高，联调困难 | [netlify.toml](file:///e:/Hackathon/personal_blog/personal-blog/netlify.toml#L11-L16) | 将目标域名参数化或迁移到 Netlify 环境配置 |
| P1 | CORS 允许来源写死 | 新域名接入时跨域失败 | [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L57-L66) | 读取 CORS_ORIGINS 环境变量并统一配置 |
| P1 | Flask-Limiter 与 redis 依赖存在但未启用 | 缺少速率限制，抗刷差 | [requirements.txt](file:///e:/Hackathon/personal_blog/personal-blog/backend/requirements.txt) | 启用限流并配置存储后端，登录与写接口重点保护 |
| P2 | 前端 manifest 与图标资源引用对齐 | 避免固定 404，提升 PWA 基线体验 | [index.html](file:///e:/Hackathon/personal_blog/personal-blog/frontend/index.html) | 补齐 `manifest.webmanifest` 与图标资源，并在构建产物中验证 |
| P2 | 前端缺少 404 路由兜底页面 | 未知路径显示空白或不友好 | [router/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts) | 增加 catch all 路由与 404 页面 |
| P2 | 前后端字段命名不统一 | 映射散落在页面，易出错 | [types/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/types/index.ts) | 明确 API Contract（API Contract / 接口契约）并集中转换 |
