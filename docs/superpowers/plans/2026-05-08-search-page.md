# 站内搜索页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增独立搜索页 `/search`，使用 URL query 可分享与可回退，并通过后端搜索接口只搜索已发布文章，匹配标题与标签分类（tags 与 category）。

**Architecture:** 前端以路由 query 作为单一真相源（single source of truth），`watch(route.query)` 驱动请求与渲染；后端新增 `/api/search` 提供统一搜索入口，参数协议与前端 query 一致，返回与已发布文章列表一致的分页结构，便于复用 UI。

**Tech Stack:** Vue 3 + Vue Router + TypeScript + Tailwind CSS，后端 Flask + SQLAlchemy（MySQL）/ SQLite（直连 SQL）。

---

## 文件结构与边界

**后端**
- Modify: [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py)
  - 新增 `GET /api/search`，仅返回 `posts` 表里 `status='published'` 的结果
  - 支持 query: `search`, `category`, `tag`, `page`, `per_page`
  - 搜索语义：`search` 同时匹配 `title` 与 `category` 的 LIKE，以及 `tags` 的包含匹配
  - 返回结构：`{ success: true, data: { items, total, pages, current_page } }`

**前端**
- Create: [Search.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/Search.vue)
- Modify: [index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts)
- Modify: [HomePage.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/HomePage.vue)
  - 首页搜索框改为跳转到 `/search?search=...`
  - 首页可保留分类 标签筛选与分页，搜索体验以 `/search` 为主

**验证**
- 通过 curl 验证 `/api/search` 参数与返回结构
- 通过浏览器验证 `/search` 页面可分享与回退，筛选与分页正常

---

### Task 1: 后端新增 /api/search（仅已发布）

**Files:**
- Modify: [app.py](file:///e:/Hackathon/personal_blog/personal-blog/backend/app.py)

- [ ] **Step 1: 添加最小可用路由**

在 `app.py` 增加：

```python
@app.route('/api/search', methods=['GET'])
def search_published_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = (request.args.get('category') or '').strip()
    tag = (request.args.get('tag') or '').strip()
    search = (request.args.get('search') or '').strip()

    query = Post.query.filter_by(status='published')
    if category:
        query = query.filter(Post.category == category)
    if tag:
        query = query.filter(Post.tags.contains([tag]))
    if search:
        like = f'%{search}%'
        query = query.filter(db.or_(
            Post.title.ilike(like),
            Post.category.ilike(like),
            Post.tags.contains([search])
        ))

    posts = query.order_by(Post.published_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    items = [{
        'id': p.id,
        'title': p.title,
        'slug': p.slug,
        'excerpt': p.excerpt,
        'category': p.category,
        'tags': p.tags or [],
        'cover_url': p.cover_url,
        'read_time': p.read_time,
        'published_at': p.published_at.isoformat() if p.published_at else None,
        'created_at': p.created_at.isoformat() if p.created_at else None
    } for p in posts.items]

    return json_response({'success': True, 'data': {'items': items, 'total': posts.total, 'pages': posts.pages, 'current_page': page}})
```

- [ ] **Step 2: SQLite 直连路径**

在同一路由里加入 SQLite 分支（当数据库 URI 不包含 `mysql` 时走 SQLite），语义与上面一致：

```python
uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
if 'mysql' not in uri:
    import sqlite3, os, json
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        where_conditions = ["status = 'published'"]
        params = []
        if category:
            where_conditions.append("category = ?")
            params.append(category)
        if tag:
            where_conditions.append("tags LIKE ?")
            params.append(f'%\"{tag}\"%')
        if search:
            where_conditions.append("(title LIKE ? OR category LIKE ? OR tags LIKE ?)")
            like = f'%{search}%'
            params.extend([like, like, like])

        where_clause = " AND ".join(where_conditions)
        cursor.execute(f"SELECT COUNT(*) FROM posts WHERE {where_clause}", params)
        total = cursor.fetchone()[0]

        offset = (page - 1) * per_page
        cursor.execute(
            f\"\"\"SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, published_at, created_at
                 FROM posts
                 WHERE {where_clause}
                 ORDER BY published_at DESC, created_at DESC
                 LIMIT ? OFFSET ?\"\"\",
            params + [per_page, offset]
        )
        rows = cursor.fetchall()

        items = []
        for row in rows:
            post_id, title, slug, excerpt, category_val, tags_raw, cover_url, read_time, published_at, created_at = row
            try:
                tags_list = json.loads(tags_raw) if tags_raw else []
            except Exception:
                tags_list = []
            items.append({
                'id': post_id,
                'title': title,
                'slug': slug,
                'excerpt': excerpt,
                'category': category_val,
                'tags': tags_list,
                'cover_url': cover_url,
                'read_time': read_time,
                'published_at': published_at,
                'created_at': created_at
            })

        pages = (total + per_page - 1) // per_page
        return json_response({'success': True, 'data': {'items': items, 'total': total, 'pages': pages, 'current_page': page}})
    finally:
        cursor.close()
        conn.close()
```

- [ ] **Step 3: 手工验证**

Run:

```bash
curl.exe -s "http://127.0.0.1:5000/api/search?page=1&per_page=10"
curl.exe -s "http://127.0.0.1:5000/api/search?search=vue"
curl.exe -s "http://127.0.0.1:5000/api/search?category=前端"
curl.exe -s "http://127.0.0.1:5000/api/search?tag=性能"
```

Expected: `success=true` 且 `data.items` 为列表，`data.pages/current_page/total` 为数字。

---

### Task 2: 新增前端 /search 页面（URL 驱动）

**Files:**
- Create: [Search.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/Search.vue)
- Modify: [index.ts](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/router/index.ts)

- [ ] **Step 1: 增加路由**

在 `router/index.ts`：

```ts
const Search = () => import('../views/Search.vue')
```

并加入 routes：

```ts
{
  path: '/search',
  name: 'Search',
  component: Search
}
```

- [ ] **Step 2: Search.vue 实现（可分享 query）**

核心行为：
- `search/category/tag/page` 来自 `route.query`
- 搜索输入 300ms 防抖更新 query
- 点击分类 标签立即更新 query
- 任一筛选变化时重置 page=1
- `watch(route.query)` 触发拉取 `/api/search`
- 支持 AbortController，避免旧响应覆盖

- [ ] **Step 3: UI 规范**

页面包含：
- 搜索输入框
- 分类列表与标签列表（复用现有 `/api/categories/published` 与 `/api/tags/published`）
- 结果列表（复用首页卡片结构）
- 分页按钮
- 空态与错误态

---

### Task 3: 首页搜索框跳转到 /search

**Files:**
- Modify: [HomePage.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/HomePage.vue)

- [ ] **Step 1: 输入框行为调整**

改为在输入时防抖写入 `/search?search=...`，并在按下 Enter 时立即跳转。

- [ ] **Step 2: 清晰的用户引导**

在首页搜索框 placeholder 增加提示，例如“搜索文章（跳转到搜索页）”。

---

### Task 4: 本地验证与回归

**Files:**
- Verify: 前端与后端启动

- [ ] **Step 1: 启动后端**

Run:

```bash
cd backend
python app.py
```

- [ ] **Step 2: 启动前端**

Run:

```bash
cd frontend
npm run dev
```

- [ ] **Step 3: 浏览器验证**

检查点：
- `/home` 输入关键词会跳到 `/search?search=...`
- `/search` 更改关键词 分类 标签 会更新 URL query，刷新后状态可复现
- 浏览器后退 前进可回放筛选与分页
- 搜索只返回已发布文章

---

## Plan 自检

- 覆盖需求：独立搜索页、URL 可分享、后端 API、匹配标题与标签分类、仅已发布
- 无占位：所有步骤包含具体文件、代码片段与验证命令
