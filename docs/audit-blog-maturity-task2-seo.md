# Task 2 SEO 优化方案（目标态与实施路径）

本文档覆盖 Task 2 的 SubTask 2.1 至 2.3，目标是为站点定义可落地的 SEO（Search Engine Optimization / 搜索引擎优化）目标态，并把“必须先修”的修补项纳入 Stage 0，同时评估该站点在 SPA（Single Page Application / 单页应用）形态下的可索引策略与演进路径。

## 总体目标与边界

站点形态与约束

- 当前前端为 Vue 3 + Vite 的 SPA，部署在 Netlify；后端为 Flask，提供 API 与 sitemap/rss 生成端点
- 以“内容可发现与可分享”为核心，优先保障公开内容页（首页、列表页、文章详情页）的可索引与可预览
- 本任务不做技术栈切换的强制落地，SSR（Server Side Rendering / 服务端渲染）属于可选迁移路径，需要单独架构评审

验收原则

- 以“可验证”为准：每个 SEO 能力都给出最小验收方式（浏览器查看、curl、Lighthouse、搜索引擎工具）
- 以“可配置”为准：涉及站点域名的绝对链接统一由 `SITE_URL` 驱动，避免硬编码

## SubTask 2.1 站点级 SEO 目标规范与验收方式

### robots.txt（Robots Exclusion Protocol / 机器人排除协议）

目标规范

- 默认允许抓取公开页面
- 明确禁止抓取后台与工具页：`/admin*`、`/performance-test`、`/audio-library`
- 为站点地图提供入口（建议使用绝对 URL）

推荐规则示例

```
User-agent: *
Disallow: /admin
Disallow: /admin/
Disallow: /performance-test
Disallow: /audio-library

Sitemap: SITE_URL/sitemap.xml
```

验收方式

- 访问 `SITE_URL/robots.txt`，确认内容与规则生效
- 在 Google Search Console（Google 搜索控制台）中使用 robots 测试工具检查关键路径

### sitemap.xml（Sitemap Protocol / 站点地图协议）

目标规范

- 仅包含公开、可索引页面
  - 静态公开页：`/`、`/home`、`/about`、`/archive`、`/category`、`/tag`、`/profile`
  - 内容页：`/post/<slug>`
- URL 统一输出绝对地址，域名由 `SITE_URL` 决定
- `lastmod` 使用 UTC 日期
- 后台页与需要登录的工具页不进入 sitemap

当前落地点

- 后端已提供 `/sitemap.xml`，并已将域名来源改为 `SITE_URL`（或请求域名兜底）
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L365-L406)

验收方式

- `curl SITE_URL/sitemap.xml` 返回 `200` 且 `Content-Type` 为 `application/xml`
- `loc` 中不存在 `localhost`，且域名与 `SITE_URL` 一致
- 提交到搜索引擎站长平台后无结构错误

### rss.xml（RSS 2.0 / 简易聚合订阅）

目标规范

- 输出 RSS 2.0 feed，保留频道信息与最近 N 篇已发布文章
- `link` 与 `guid` 使用绝对链接，域名来源同样由 `SITE_URL` 决定
- `pubDate` 使用 RFC 822 格式并带时区

当前落地点

- 后端已提供 `/rss.xml`，并已将域名来源改为 `SITE_URL`（或请求域名兜底）
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L408-L456)

验收方式

- `curl SITE_URL/rss.xml` 返回 `200` 且 `Content-Type` 为 `application/rss+xml`
- 使用任意 RSS 阅读器订阅成功，条目链接可打开到文章页

### canonical（Canonical URL / 规范链接）

目标规范

- 每个可索引页面包含唯一 canonical
- canonical 的 URL 与最终对外展示 URL 一致，避免参数与重复路径导致的内容重复

建议实现点（SPA）

- 在入口 HTML 提供一个初始 `<link rel="canonical">`
- 在路由切换时更新 canonical 为 `SITE_URL + route.fullPath`，并剔除用于追踪的参数（如 `utm_*`）

验收方式

- 打开不同页面，查看 `document.querySelector('link[rel="canonical"]')` 是否存在且正确
- Lighthouse（Lighthouse / 站点质量审计）SEO 面板不提示 canonical 缺失

### OG/Twitter（Open Graph / 开放图谱 与 Twitter Cards / 推特卡片）

目标规范

- 全站默认提供
  - `og:title`、`og:description`、`og:type`、`og:url`、`og:image`
  - `twitter:card`、`twitter:title`、`twitter:description`、`twitter:image`
- 文章详情页覆盖
  - 使用文章标题与摘要
  - `og:type = article`
  - `og:image` 使用封面图或站点默认图

现状备注

- 文章详情页已动态写入部分 OG meta（标题、描述、URL），但缺少 canonical、twitter 系列与 JSON-LD
  - [BlogPost.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/BlogPost.vue#L145-L220)

验收方式

- Facebook Sharing Debugger（Facebook 分享调试器）或任意 OG 校验工具能正确解析
- Twitter Card Validator 能正确解析
- 在微信等应用内分享预览图与标题正确

### JSON-LD（JSON-LD / 结构化数据）

目标规范

- 全站注入 WebSite（站点级）结构化数据
- 文章页注入 BlogPosting（博客文章）结构化数据
- 结构化数据字段最小集合建议
  - `@context`、`@type`
  - `headline`、`description`、`datePublished`、`dateModified`
  - `author`、`publisher`、`mainEntityOfPage`、`image`、`url`

验收方式

- Google Rich Results Test（富媒体结果测试）可解析且无致命错误
- Search Console 增强结果报表无结构化数据错误（若符合对应结果类型）

## SubTask 2.2 Stage 0 修补项

### sitemap/rss 域名来源改为可配置

修补内容

- 新增 `SITE_URL` 环境变量作为站点对外域名来源
  - [env.example](file:///e:/Hackathon/personal_blog/personal-blog/backend/env.example)
- sitemap 与 RSS 中所有 `loc/link/guid` 的域名由 `SITE_URL` 驱动，缺失时以请求域名兜底
  - [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L365-L456)

验证方式

- 在生产部署注入 `SITE_URL` 后，检查 sitemap/rss 输出链接是否全部指向正确域名

### manifest 引用与文件对齐

修补内容

- 补齐 `frontend/public/manifest.webmanifest`，与 [index.html](file:///e:/Hackathon/personal_blog/personal-blog/frontend/index.html) 的引用一致
- 补齐 `frontend/public/favicon.svg`，并将入口页图标引用从缺失文件调整为现有文件
  - [index.html](file:///e:/Hackathon/personal_blog/personal-blog/frontend/index.html)
  - [manifest.webmanifest](file:///e:/Hackathon/personal_blog/personal-blog/frontend/public/manifest.webmanifest)
  - [favicon.svg](file:///e:/Hackathon/personal_blog/personal-blog/frontend/public/favicon.svg)

验证方式

- 构建后访问 `SITE_URL/manifest.webmanifest` 与 `SITE_URL/favicon.svg` 返回 200
- 浏览器 DevTools Network（网络面板）无这两项的 404

### 消除明显 404

当前处理范围

- 消除入口页固定引用导致的静态 404（manifest 与图标）
- 其他运行期 404（例如文章封面图 URL 无效）属于内容与数据治理范畴，建议在 Stage 1 结合内容生产流程一起治理

## SubTask 2.3 可索引策略评估：SPA + 预渲染 或 SSR

### 方案 A：保持 SPA 并引入预渲染（Prerender / 预先渲染）

核心思路

- 构建时生成关键路由的静态 HTML，使搜索引擎在不执行或少执行 JavaScript 时也能拿到主要内容与 meta
- 对文章页可按“最近 N 篇”或“全量 slug 列表”预渲染，视构建时间与发布频率取舍

优点

- 改造成本低，不必引入 SSR 运行时
- 与现有 Netlify 静态部署契合，CDN 缓存友好

风险与注意事项

- 文章数量增多时构建时间线性增加，需要做增量策略
- 需要保证 meta、canonical、JSON-LD 在预渲染产物中已是最终态

### 方案 B：引入 SSR（SSR / 服务端渲染）

核心思路

- 请求到达时由服务端输出完整 HTML，首屏与 SEO 能力更强
- 对动态路由（文章详情）天然友好

优点

- 首屏内容与 meta 一次到位，搜索引擎友好
- 更容易实现按路由精细化的 SEO 模板与结构化数据

成本与风险

- 属于技术栈升级，需要引入 SSR 框架或 SSR 方案（如 Nuxt（Nuxt / Vue SSR 框架）或 vite-ssr 类方案）
- 需要服务器运行时与缓存策略，部署与运维复杂度上升
- 需要处理同构差异（Hydration / 水合）、运行时依赖与安全边界

### 推荐结论

对当前“个人博客 + 文章内容为主”的场景，优先推荐方案 A：SPA + 预渲染，理由是可在低成本下显著改善可索引性，并保持现有部署方式不变。SSR 作为未来文章量大、需要更强首屏与动态 SEO 模板能力时的备选迁移路径，进入实施前应先做架构评审与 PoC（Proof of Concept / 概念验证）。

