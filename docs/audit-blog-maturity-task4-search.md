# Task 4 站内搜索方案（可分享、可扩展）

本文档覆盖 Task 4 的 SubTask 4.1 至 4.3，目标是在当前前端已有本地过滤、后端已有 `search` 参数的前提下，补齐可分享 URL 的搜索体验，并给出从 SQLite LIKE 到 FTS5 与外部搜索服务的分阶段升级路径。落地策略以“小改动可上线”为优先。

关联现状与证据位置

- 首页存在搜索输入框与本地过滤逻辑：[HomePage.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/HomePage.vue)
- 后端已发布文章列表接口支持 `search/category/tag` 参数，并在 SQLite 侧执行 LIKE 查询：[app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py#L582-L697)
- 前端通用请求封装已支持 AbortSignal（AbortController / 中止控制器）：[http.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/utils/http.ts)

## SubTask 4.1 统一搜索链路与可分享 URL

### URL 作为“可分享的搜索状态”

推荐把搜索状态完全落到 URL query，上线后用户复制浏览器地址即可分享同一筛选结果，且浏览器前进后退可复现搜索过程。

当前建议的参数协议

- `search`：关键词
- `category`：分类名
- `tag`：标签名

示例

- `/home?search=vue`
- `/home?search=vue&category=前端`
- `/home?tag=性能&category=工程化`

前后端字段保持一致的收益

- 前端无需维护两套命名映射，URL query 直接映射到后端请求参数
- 后端仍可在未来引入新引擎时保持同一参数协议，避免前端联动改动

### 前端职责边界

前端负责

- 输入交互与状态同步到 URL query
- 防抖（debounce）与取消请求（request cancellation）
- 空态（empty state）与错误态（error state）展示

后端负责

- 按 `search/category/tag` 返回结果集，并提供分页（pagination）与排序（sorting）的扩展点
- 保证搜索语义稳定，底层实现可从 LIKE 平滑切换到 FTS5 或外部搜索

### 防抖与取消请求

设计目标

- 输入过程中降低请求频率，减少服务器压力与 UI 抖动
- 当用户继续输入或切换筛选条件时，中止上一个在途请求，避免旧响应覆盖新结果

推荐策略

- `search` 输入采用 300ms 防抖（debounce）
- `category/tag` 点击与清空筛选即时触发
- 每次发新请求前使用 AbortController 中止上一个请求

实现已落地在首页

- `router.replace` 写入 query，保证 URL 可分享且与路由状态一致
- `watch(route.query)` 作为统一入口，根据 URL 驱动拉取 `/posts/published?search=...&category=...&tag=...`
- 通过 AbortSignal 传递给 `http.get`，请求取消时不展示错误

## SubTask 4.3 搜索体验规范（首页模式，可平滑扩展到独立搜索页）

### 首页模式交互规范

建议保留“首页即搜索结果”的模式，改动面小，学习成本低。

交互要点

- 输入框展示占位文案“搜索文章...”，输入后 URL 立即可分享，结果区显示搜索结果列表
- 空态文案建议根据是否存在筛选条件区分
  - 无任何筛选条件且无文章时，提示“暂无文章”
  - 有筛选条件且无结果时，提示“未找到匹配内容”，并提供“清除筛选”
- 清除筛选按钮在任一条件存在时可见，点击后清空 `search/category/tag` 并回到默认列表
- 错误态提供“重试”，重试沿用当前 URL query

### 分页、排序、过滤的扩展协议

现阶段为了避免大规模改动，前端可通过 `per_page=1000` 维持接近“全量列表”的体验。后续建议按 URL 协议扩展分页与排序，依旧保持可分享与可回放。

推荐新增参数

- `page`：页码，默认 1
- `per_page`：每页条数，默认 10 或 20
- `sort`：排序方式，建议值 `relevance`（相关性）与 `recent`（最新）

推荐行为

- 输入关键词时将 `page` 复位到 1
- 点击分页时使用 `router.push` 写入新页码，让浏览器后退能回到上一页

### 独立搜索页的演进建议

当首页需要承载更多模块时，可新增 `/search` 作为独立结果页，URL 协议保持一致，例如 `/search?search=...&tag=...`。首页输入框跳转到 `/search` 并携带 query，即可复用同一后端接口。

## SubTask 4.2 后端搜索升级路径（LIKE 到 FTS5 与外部搜索）

### Stage 0 保持 LIKE（当前实现）

适用场景

- 文章量较少，搜索只需要“包含匹配”
- 相关性排序诉求不强，按发布时间排序即可

建议优化点

- 统一走参数化查询（parameterized query），避免拼接 SQL
- 为常用过滤字段加索引（index），例如 `status`、`category`、`published_at`
- 返回结果字段保持精简，减少网络传输与序列化开销

### Stage 1 引入 SQLite FTS5（Full Text Search 5 / 全文检索）

目标收益

- 提升关键词匹配性能
- 支持相关性排序（relevance ranking），例如 BM25（Okapi BM25 / BM25 相关性评分）

推荐实现方式

- 新增 FTS5 虚拟表（virtual table），维护 `title/excerpt/content` 的索引
- 通过触发器（trigger）在 posts 变更时同步索引
- 保持现有 `/api/posts/published` 参数协议不变，内部根据开关选择 LIKE 或 FTS5

工程注意事项

- 中文分词（Chinese tokenization / 中文分词）对检索效果影响显著。FTS5 默认分词对中文效果有限，可根据需求评估 ICU 分词（ICU tokenizer / ICU 分词器）或外部引擎
- FTS5 引入后应做一致性回归，确保结果集与权限边界不变

触发条件建议

- 搜索接口响应时间持续升高，且热点内容重复检索明显
- 需要相关性排序与更丰富的匹配能力（前缀匹配、短语匹配）

### Stage 2 接入外部搜索服务（External Search Service / 外部搜索服务）

候选

- Meilisearch：上手快，支持容错（typo tolerance / 拼写容错）与同义词（synonym / 同义词）
- Elasticsearch：能力强，维护成本更高，适合复杂检索与分析

推荐接入方式

- 后端增加一层 Search Adapter（搜索适配层），对外保持 `search/category/tag/page/sort` 协议不变
- 建立索引同步机制
  - 低维护优先可用定时全量重建
  - 追求实时可用事件驱动增量同步
- 在外部服务不可用时回退到 LIKE 或 FTS5，保证可用性

触发条件建议

- 需要多字段权重、联想（autocomplete / 自动补全）、高亮（highlight / 高亮）、拼写容错
- 内容量与并发显著上升，SQLite 单机检索成为瓶颈

