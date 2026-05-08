# Task 3 中英双语（i18n）方案（路由/内容/SEO 一体化）

本文档覆盖 Task 3 的 SubTask 3.1 至 3.3，目标是给出中英双语（i18n / internationalization）在当前 SPA（Single Page Application / 单页应用）架构下可落地的目标态，包括路由（Routing / 路由）策略、内容（Content / 内容）承载与迁移流程、以及 i18n SEO（Search Engine Optimization / 搜索引擎优化）的输出规范，并明确迁移注意事项，尽量避免大规模代码改动。

关联现状与证据位置

- 现有前端路由未携带语言前缀：[router/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts)
- 现有站点地图与 RSS 由后端生成并以 `SITE_URL` 输出绝对链接：[app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L365-L456)
- 当前 SEO 目标态与 SPA 预渲染建议见 Task 2 文档：[audit-blog-maturity-task2-seo.md](file:///e:/Hackathon/personal_blog/personal-blog/docs/audit-blog-maturity-task2-seo.md)

## 推荐结论（可直接作为目标态验收标准）

推荐采用“语言前缀路由 + 同一内容 ID 的多语言版本 + 多语言 SEO 输出”三件套：

- URL 结构：`/zh/...` 与 `/en/...` 两套公开路由；`/` 通过重定向落到默认语言
- 默认语言：`zh`（中文）作为默认；回退（Fallback / 回退）策略对“缺少翻译”与“未知语言路径”分别处理
- 内容承载：文章与静态页均以“同一内容 ID 下的多语言版本”建模，优先保证同 slug 的跨语言稳定映射，后续再扩展本地化 slug
- SEO 输出：每个页面输出 `lang` 属性、canonical、hreflang；sitemap 与 RSS 具备多语言版本并与 `SITE_URL` 一致

## SubTask 3.1 语言策略：URL 结构、默认语言、回退、语言切换

### URL 结构（URL Structure / URL 结构）

公开内容路由采用语言前缀，避免依赖浏览器语言做隐式分发，提升可分享性与可缓存性。

- 中文：`/zh` 作为入口前缀
- 英文：`/en` 作为入口前缀
- 默认入口：`/` 做 301 或 302 到 `/zh/`（建议 302 仅用于首次上线的灰度期，稳定后改 301）

公开页面路径推荐映射

- Landing：`/zh/` 与 `/en/`
- 首页列表：`/zh/home` 与 `/en/home`
- 关于：`/zh/about` 与 `/en/about`
- 归档：`/zh/archive` 与 `/en/archive`
- 分类：`/zh/category` 与 `/en/category`
- 标签：`/zh/tag` 与 `/en/tag`
- 个人主页：`/zh/profile` 与 `/en/profile`
- 文章详情：`/zh/post/:slug` 与 `/en/post/:slug`

后台与工具页建议维持不带语言前缀，理由是避免把“需要登录”页面带入 i18n 的路由复杂度，同时便于 robots 统一禁止抓取：

- 后台：`/admin-login`、`/admin/...`
- 工具：`/performance-test`、`/audio-library`

### 默认语言与回退（Default & Fallback / 默认与回退）

推荐规则

- 对 `/`：重定向到默认语言入口 `/zh/`
- 对未知语言前缀：例如 `/jp/...`，重定向到 `/zh/...` 或 `/zh/`（两者选一并保持一致）
- 对已知语言但内容缺少翻译：例如 `/en/post/some-slug` 没有英文版本
  - 优先策略：返回一个“该内容暂无英文版本”的页面态，并给出跳转到中文版本 `/zh/post/some-slug` 的入口
  - 备选策略：直接 302 到中文版本（更省事，但会混淆用户预期，也不利于搜索引擎理解语言边界）

### 语言切换交互（Language Switch / 语言切换）

交互推荐

- 位置：全站顶部导航或页脚固定入口，文章页也要可见
- 行为：保持当前内容上下文，优先跳到对应语言的同一内容（同 content id / 同 slug 映射）
- 缺少翻译时：展示提示并提供回到默认语言版本的明确操作

技术注意事项（SPA）

- 切换语言时更新 document.title 与页面 meta（canonical、hreflang、description 等）
- 预渲染（Prerender / 预先渲染）启用后，确保两种语言路由都被纳入生成列表，否则搜索引擎会只看到单语版本

## SubTask 3.2 内容策略：双语承载、迁移与编辑流程

本项目内容主要来自后端 Post 模型（文章），静态页由前端视图组件承载（如 About、Profile）。双语策略需要同时覆盖“动态内容”与“静态内容”。

### 文章双语承载方式（Posts / 文章）

推荐方案：同一内容 ID 下的多语言版本（Single Content ID with Translations / 同一内容 ID 多语言版本）

- 每篇文章拥有一个稳定的内容 ID（例如数据库主键 id）
- 每个语言拥有一份可独立发布的版本数据
  - 建议最小字段：title、excerpt、content、cover_url、published_at、updated_at
  - tags、category 可先不做翻译或提供可选翻译字段（取决于信息架构）
- slug 策略建议分两阶段
  - Stage 0：两种语言共用同一个 slug（减少迁移复杂度，保证跨语言映射稳定）
  - Stage 1：支持本地化 slug（Localized Slug / 本地化 slug），引入 slug 映射并提供旧 URL 的重定向

备选方案：独立 slug 两篇文章（Separate Posts per Locale / 每种语言独立文章）

- 优点：实现简单，不需要翻译表结构
- 风险：跨语言映射弱，语言切换体验与 hreflang 维护成本高，容易产生重复与遗漏

综合考虑可维护性与 SEO 完整性，推荐采用“同一内容 ID 多语言版本”。

### 静态页双语承载方式（Static Pages / 静态页）

推荐方案：以“路由级模板 + 文案资源”实现

- 保持页面结构一致，文本与少量媒体差异通过 i18n 文案资源驱动
- 对于 About/Profile 这类内容型页面，如果长期会有中英两份不同内容，建议把正文内容也转成可配置数据（例如后端 profile 接口按语言返回，或前端使用独立 markdown 文件）

### 数据迁移建议（Migration / 迁移）

迁移目标

- 现有中文内容作为 `zh` 版本导入
- 英文版本初始为空或为草稿（draft / 草稿），由编辑补齐后再发布

迁移步骤建议（不要求一次性上线全部翻译）

1. 为每篇已存在文章创建 `zh` 版本，状态保持与当前一致（published / draft）
2. 为英文创建占位版本，状态统一为 draft，避免英文路由出现“空内容但可索引”
3. 语言切换基于同一内容 ID 关联，缺少翻译时给出清晰的缺失态

编辑流程建议（Editorial Workflow / 编辑流程）

- 后台编辑页在文章维度提供语言选择（zh/en），分别编辑与发布
- 发布策略建议按语言独立控制，避免“中文已发布但英文未完成”导致整体状态不清晰
- 自动化校验建议
  - 若英文版本为 published，则必须包含 title、excerpt、content
  - cover_url 若为空则使用站点默认图，避免 OG 预览缺图

## SubTask 3.3 i18n SEO：hreflang、语言 meta、站点地图与 RSS 多语言输出

### 页面级输出（Per-page / 页面级）

每个可索引页面建议输出以下信息

- `<html lang="zh-CN">` 或 `<html lang="en">`
- canonical（Canonical URL / 规范链接）：指向当前语言版本的绝对 URL
- hreflang（Hreflang / 语言替代链接）：声明同一内容在不同语言下的对应页面

示例（以文章 `hello-world` 为例）

```html
<link rel="canonical" href="SITE_URL/zh/post/hello-world" />
<link rel="alternate" hreflang="zh-CN" href="SITE_URL/zh/post/hello-world" />
<link rel="alternate" hreflang="en" href="SITE_URL/en/post/hello-world" />
<link rel="alternate" hreflang="x-default" href="SITE_URL/zh/post/hello-world" />
```

Open Graph 与 Twitter 建议同步多语言

- `og:locale`：中文页用 `zh_CN`，英文页用 `en_US` 或 `en_GB`（按目标受众选择并保持一致）
- `og:locale:alternate`：输出另一种语言的 locale
- `og:url` 与 `twitter:url`：使用当前语言版本 URL
- title 与 description 按语言版本输出

### sitemap 多语言策略（Sitemap / 站点地图）

推荐方案：sitemap index + 语言分拆 sitemap

- `/sitemap.xml` 输出 sitemap 索引（sitemap index），列出 `/sitemap-zh.xml` 与 `/sitemap-en.xml`
- 每个语言 sitemap 仅包含该语言可索引页面
- 对于“存在双语版本的同一内容”，在每个 URL 节点内输出 `<xhtml:link rel="alternate" ...>`，把另一语言关联起来

示例（节选）

```xml
<url>
  <loc>SITE_URL/zh/post/hello-world</loc>
  <lastmod>2026-05-07</lastmod>
  <xhtml:link rel="alternate" hreflang="zh-CN" href="SITE_URL/zh/post/hello-world" />
  <xhtml:link rel="alternate" hreflang="en" href="SITE_URL/en/post/hello-world" />
  <xhtml:link rel="alternate" hreflang="x-default" href="SITE_URL/zh/post/hello-world" />
</url>
```

迁移注意事项

- sitemap 与 RSS 当前由后端生成，域名来源已使用 `SITE_URL`，多语言改造建议保持同一机制，避免前后端各自拼接域名导致不一致
- 上线初期如果英文内容较少，`/sitemap-en.xml` 仅包含真正可索引的英文页面，英文缺失页不应进入 sitemap

### RSS 多语言策略（RSS / 订阅）

推荐方案：提供两份 feed

- `/zh/rss.xml` 输出中文已发布文章
- `/en/rss.xml` 输出英文已发布文章
- 频道信息（channel）与 item 的 title/description/content 均按语言版本输出

迁移注意事项

- RSS 中的 `link`、`guid`、`atom:link rel="self"` 使用当前语言版本 URL
- 若英文版本为 draft，则不进入英文 RSS

### 搜索引擎与验证（Validation / 验证）

上线与验收建议

- 为 `/zh` 与 `/en` 分别在站长平台提交 sitemap（若平台支持按路径管理，可在同一站点属性下提交多份 sitemap）
- 检查 hreflang 互链闭环：中文声明英文，英文声明中文
- 抽检 canonical 是否一致，避免所有语言页面都指向同一 canonical

## 迁移风险与控制点（避免大规模改动的落地顺序）

推荐分阶段落地，降低一次性改动面

- Stage 0：仅引入语言前缀路由与基础 SEO 输出（lang、canonical、hreflang），英文内容允许少量页面先行
- Stage 1：文章内容模型引入“多语言版本”，补齐语言切换在文章维度的稳定映射
- Stage 2：启用预渲染时把两种语言路由都纳入生成清单，完善 sitemap/rss 的多语言输出

