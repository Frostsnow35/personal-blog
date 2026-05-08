# Task 6 实施路线图与验收清单汇总（Stage 0-3 + 模块映射）

本文档整合 Task 1-5 的结论与建议，形成可执行的 Stage 0-3 实施路线图（Roadmap / 路线图）与“可直接改动的文件/模块映射清单”，并给出最终验收 checklist（Checklist / 验收清单）及对应验证手段（手工与自动化）。

关联输入文档

- Task 1 现状与风险清单：[audit-blog-maturity-task1.md](file:///e:/Hackathon/personal_blog/personal-blog/docs/audit-blog-maturity-task1.md)
- Task 2 SEO 目标态与路径：[audit-blog-maturity-task2-seo.md](file:///e:/Hackathon/personal_blog/personal-blog/docs/audit-blog-maturity-task2-seo.md)
- Task 3 i18n 方案：[audit-blog-maturity-task3-i18n.md](file:///e:/Hackathon/personal_blog/personal-blog/docs/audit-blog-maturity-task3-i18n.md)
- Task 4 搜索方案：[audit-blog-maturity-task4-search.md](file:///e:/Hackathon/personal_blog/personal-blog/docs/audit-blog-maturity-task4-search.md)
- Task 5 评论方案：[audit-blog-maturity-task5-comments.md](file:///e:/Hackathon/personal_blog/personal-blog/docs/audit-blog-maturity-task5-comments.md)

## Stage 0-3 路线图（每项包含投入、收益、风险、验收方式）

Stage 定义

- Stage 0：高风险快速修补（High-risk quick fixes / 高风险快速修补），目标是把“生产会出事”的点先关掉
- Stage 1：核心体验补齐（Core experience / 核心体验），目标是可发现、可分享、可运营的最小闭环
- Stage 2：增强与可运营（Enhanced + Operable / 增强与可运营），目标是可持续维护与更强能力
- Stage 3：可扩展演进（Scalable evolution / 可扩展演进），目标是为增长与架构升级预留空间

### Stage 0（高风险快速修补）

1. 后端密钥与默认管理员兜底移除（Fail-fast / 失败即停）
   - 投入级别：中
   - 收益：降低后台被接管风险，避免生产误用默认密钥与默认密码
   - 风险：若部署侧未及时补齐环境变量，会导致服务启动失败
   - 验收方式（手工）：移除环境变量后启动应失败并给出明确错误；注入变量后可正常登录与发放 JWT（JSON Web Token / JSON 网络令牌）
   - 验收方式（自动化）：在后端启动脚本或 CI 中增加环境变量缺失检测（若当前无 CI，可先在本地脚本中验证）

2. 上传接口安全基线（Upload hardening / 上传加固）
   - 投入级别：中
   - 收益：降低任意文件上传、路径注入与资源滥用风险
   - 风险：若限制过严可能影响正常上传
   - 验收方式（手工）：上传非白名单类型应失败；超限大小应失败；文件名包含特殊字符应被净化；上传后静态访问路径正确
   - 验收方式（自动化）：为上传接口补充单测，覆盖扩展名、大小、文件名净化与权限校验（若当前未建立测试框架，可先加入最小化集成测试脚本）

3. 速率限制落地到登录与写接口（Rate limiting / 速率限制）
   - 投入级别：中
   - 收益：降低登录爆破与接口刷量风险
   - 风险：限流策略不当可能误伤正常用户或爬虫
   - 验收方式（手工）：对登录接口连续请求应触发 429；对公共读接口保持合理阈值
   - 验收方式（自动化）：用脚本压测单路由（例如 60 秒内 200 次）验证 429 与重试策略

4. CORS 配置从硬编码改为环境变量（CORS / 跨域资源共享）
   - 投入级别：低
   - 收益：后端域名、前端域名调整时不再需要改代码发布
   - 风险：配置错误导致前端请求被跨域阻断
   - 验收方式（手工）：在新域名下访问前端，DevTools Network 无跨域报错；后端响应包含正确的 `Access-Control-Allow-Origin`

5. 站点域名统一由 SITE_URL 驱动（sitemap/rss）
   - 投入级别：低
   - 收益：避免 sitemap 与 RSS 输出 localhost，减少 SEO 链接污染
   - 风险：SITE_URL 配置错误会把绝对链接写错
   - 验收方式（手工）：`curl SITE_URL/sitemap.xml` 与 `curl SITE_URL/rss.xml` 的 `loc/link/guid` 均不包含 localhost

6. 部署侧反向代理与域名参数化（Netlify proxy / Netlify 反代）
   - 投入级别：低
   - 收益：后端迁移或域名变化时无需改仓库配置
   - 风险：需要统一“部署环境变量注入”的口径，避免多处配置漂移
   - 验收方式（手工）：切换后端域名后仅调整部署配置即可恢复 /api 调用，无需改代码

### Stage 1（核心体验补齐）

1. 页面级 SEO 基线补齐（Canonical + OG/Twitter + JSON-LD）
   - 投入级别：中
   - 收益：分享预览一致、可索引性提升，搜索结果展示更完整
   - 风险：SPA 动态注入 meta 对部分爬虫效果有限，需配合预渲染策略验证
   - 验收方式（手工）：Lighthouse（Lighthouse / 站点质量审计）SEO 项无关键缺失；OG/Twitter 校验工具解析正确；Google Rich Results Test 可解析 JSON-LD
   - 验收方式（自动化）：对关键路由做预渲染产物快照对比（若引入 prerender 工具）

2. 站内搜索全量走 URL query 驱动（Search via URL / URL 驱动搜索）
   - 投入级别：低
   - 收益：搜索可分享、可回放，前后端参数协议稳定
   - 风险：URL 状态管理不当导致重复请求或闪烁
   - 验收方式（手工）：复制 `/home?search=...&category=...&tag=...` 给另一浏览器可复现同一结果；前进后退可回放搜索过程

3. 评论默认集成方案落地（Giscus / GitHub Discussions）
   - 投入级别：低
   - 收益：低维护获得互动闭环，站点侧无评论数据存储负担
   - 风险：外部脚本不可用时评论不可用，需要降级策略
   - 验收方式（手工）：文章页评论区可加载并可发言；禁用脚本或配置缺失时出现可理解的降级提示

4. 前端 404 页面与 catch-all 路由兜底（Not Found / 未找到页面）
   - 投入级别：低
   - 收益：未知路径不再空白页，降低用户流失
   - 风险：若路由顺序处理错误可能拦截合法路径
   - 验收方式（手工）：访问不存在路径显示 404 页面，并提供返回首页入口

5. 前后端字段命名与契约集中治理（API Contract / 接口契约）
   - 投入级别：中
   - 收益：减少页面内临时转换，降低长期维护成本与缺陷概率
   - 风险：改动面涉及多个页面与类型定义，需要回归列表页与详情页
   - 验收方式（手工）：首页列表、文章详情、归档、分类/标签页数据展示与跳转均正常
   - 验收方式（自动化）：为接口响应增加契约测试或类型断言（Type assertion / 类型断言）

### Stage 2（增强与可运营）

1. i18n 内容模型落地与双语编辑流程上线
   - 投入级别：高
   - 收益：真正完成双语内容闭环，语言切换稳定可维护
   - 风险：数据库迁移与后台编辑流程改动大，需要灰度与回滚策略
   - 验收方式（手工）：同一文章的 zh/en 版本可分别发布；缺少翻译时出现缺失态；语言切换保留上下文

2. sitemap/rss 多语言输出（sitemap index + 分语言 sitemap，双 feed）
   - 投入级别：中
   - 收益：搜索引擎可清晰识别语言版本与替代关系
   - 风险：输出不当会导致重复收录或 hreflang 不闭环
   - 验收方式（手工）：`/sitemap.xml` 输出索引并可访问到语言 sitemap；抽检 `xhtml:link` hreflang 互链闭环；`/zh/rss.xml` 与 `/en/rss.xml` 输出正确

3. SEO 预渲染落地（Prerender / 预先渲染）
   - 投入级别：中
   - 收益：SPA 可索引性显著提升，首屏 meta 与内容对爬虫更友好
   - 风险：构建时间随文章数量增长，需要增量或只渲染最近 N 篇
   - 验收方式（手工）：查看构建产物中关键路由 HTML 已包含 title/description/canonical/JSON-LD；搜索引擎抓取工具可看到主要内容
   - 验收方式（自动化）：对产物做快照断言，防止 meta 回归

4. 后端搜索升级到 SQLite FTS5（FTS5 / 全文检索）
   - 投入级别：中
   - 收益：搜索性能与相关性更好
   - 风险：中文分词效果有限，需要评估 ICU 分词或外部引擎
   - 验收方式（手工）：同样关键词在数据量提升后仍能快速返回；相关性排序与 LIKE 阶段一致或更优

5. 可观测性与运维基线（Logging + Monitoring + Backup）
   - 投入级别：中
   - 收益：线上问题可定位、可恢复，降低“出了问题只能猜”的运维成本
   - 风险：引入外部监控需注意隐私与密钥管理
   - 验收方式（手工）：日志包含 request id 与关键路由；错误监控可看到异常聚合；具备备份与恢复演练记录

### Stage 3（可扩展演进）

1. SSR 迁移评估与 PoC（SSR / 服务端渲染）
   - 投入级别：高
   - 收益：更强 SEO 与首屏体验，更灵活的动态 meta 模板
   - 风险：部署与运维复杂度上升，需要架构评审与缓存策略
   - 验收方式（手工）：PoC 环境对比 Lighthouse 与爬虫抓取表现；核心路由首屏内容与 meta 一次到位

2. 外部搜索服务接入（Meilisearch 或 Elasticsearch）
   - 投入级别：高
   - 收益：容错、高亮、自动补全与更复杂检索能力
   - 风险：引入新服务的运维成本与数据同步复杂度
   - 验收方式（手工）：外部搜索服务不可用时可回退到本地引擎；索引同步延迟在可接受范围

3. 自建评论（仅在强隐私与强控制需求出现时）
   - 投入级别：高
   - 收益：完全掌控数据与审核流程
   - 风险：长期治理与合规负担上升
   - 验收方式（手工）：审核流程可用，反垃圾策略有效，数据保留与删除机制清晰

## 关键缺口到可改动文件/模块映射清单

下表用于把“缺口”直接落到可改动的文件/模块入口，便于按 Stage 排期实施。

| 缺口/需求 | 模块 | 可直接改动的文件/入口 | 备注 |
| --- | --- | --- | --- |
| SECRET_KEY/JWT_SECRET/默认管理员兜底移除 | 后端配置与鉴权 | [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py)（配置读取、鉴权装饰器、ensure_default_admin） | 建议生产缺失即失败 |
| 上传接口加固 | 后端上传与静态暴露 | [admin_upload](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L344-L357)，[serve_uploads](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L359-L364) | 白名单、大小限制、文件名净化 |
| 速率限制启用 | 后端中间件 | [requirements.txt](file:///e:/Hackathon/personal_blog/personal-blog/backend/requirements.txt)，[app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py) | Flask-Limiter 已在依赖中 |
| CORS 参数化 | 后端跨域 | [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L57-L66)，[env.example](file:///e:/Hackathon/personal_blog/personal-blog/backend/env.example) | 使用 CORS_ORIGINS |
| sitemap/rss 站点域名正确 | 后端 SEO 端点 | [sitemap](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L365-L406)，[rss](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L408-L456) | 统一 SITE_URL |
| /api 反代目标可配置 | 部署配置 | [netlify.toml](file:///e:/Hackathon/personal_blog/personal-blog/netlify.toml#L11-L16) | 建议迁移到部署环境配置 |
| API base URL 策略与回退 | 前端请求封装 | [http.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/utils/http.ts) | VITE_API_BASE_URL 与 /api 代理 |
| 页面级 SEO（canonical/OG/Twitter/JSON-LD） | 前端 meta 管理 | [BlogPost.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/BlogPost.vue)（现有 OG 注入点），App 入口与路由守卫 | 建议抽成统一 meta 工具 |
| i18n 路由前缀与切换 | 前端路由 | [router/index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts) | /zh 与 /en |
| 搜索 URL query 驱动 | 前端首页/搜索页 | [HomePage.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/HomePage.vue) | route.query 驱动请求 |
| 后端搜索升级（LIKE -> FTS5） | 后端 posts 接口 | [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L582-L697) | 保持参数协议稳定 |
| 评论组件嵌入 | 前端文章详情 | [BlogPost.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/BlogPost.vue) | 文章正文后，返回按钮前 |
| PWA 静态资源一致性 | 前端 public 与入口 | [index.html](file:///e:/Hackathon/personal_blog/personal-blog/frontend/index.html)，[manifest.webmanifest](file:///e:/Hackathon/personal_blog/personal-blog/frontend/public/manifest.webmanifest) | 避免固定 404 |

## 最终验收 checklist（与 checklist.md 一致，并标注验证手段）

- [x] 已完成全项目体检基础梳理：技术栈、部署、环境变量、路由与内容模型、已存在功能与缺口（验证：手工，审阅 Task 1 文档覆盖范围与证据链接）
- [x] 已识别并列出生产风险清单：硬编码域名、localhost API、资源 404、配置不一致等，并给出优先级（验证：手工，审阅 Task 1 风险表含证据位置与优先级）
- [x] 已形成 Stage 0-3 路线图：每项包含收益、成本等级、风险与验收方式（验证：手工，审阅本文件 Stage 0-3 小节）
- [x] SEO 目标态定义完整：robots.txt、sitemap.xml、rss.xml、canonical、OG/Twitter、JSON-LD 的规范与页面覆盖范围（验证：手工，审阅 Task 2 文档；自动化，Lighthouse 与 Rich Results Test）
- [x] sitemap.xml 与 rss.xml 的站点域名来源已纳入修补方案，并明确环境变量命名与部署注入方式（验证：手工，`curl` 检查 sitemap/rss 中无 localhost）
- [x] manifest 引用路径与实际文件不一致问题已纳入修补方案，并明确产物与验证方式（验证：手工，构建后访问 manifest 与图标无 404）
- [x] i18n 目标态定义完整：语言路由策略、默认语言与回退、语言切换交互（验证：手工，审阅 Task 3 策略与路由映射）
- [x] 双语内容策略已确定：文章与静态页如何承载双语，以及迁移与编辑流程建议（验证：手工，审阅 Task 3 内容模型与迁移步骤）
- [x] hreflang 与多语言 SEO 输出策略已定义，并纳入 sitemap/rss 的多语言规划（验证：手工，审阅 Task 3 输出规范；自动化，抓取产物快照对比）
- [x] 站内搜索方案已定义：URL query 可分享、防抖与取消请求、前后端职责边界（验证：手工，审阅 Task 4；在浏览器中复制 URL 可复现搜索）
- [x] 后端搜索升级路径已给出：从 LIKE 到 FTS5 或外部搜索服务的阶段化建议与触发条件（验证：手工，审阅 Task 4 升级路径与触发条件）
- [x] 评论方案已定稿：默认推荐与备选方案对比、隐私与反垃圾策略、失败降级策略（验证：手工，审阅 Task 5 选型与降级策略）
- [x] 关键落地点已映射到具体模块：文章详情页嵌入点、后端（如需）接口与数据模型范围（验证：手工，审阅本文件“模块映射清单”表格）

