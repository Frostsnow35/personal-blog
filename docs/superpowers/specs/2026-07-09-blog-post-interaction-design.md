# 博客推文发布、展示、互动功能改进设计

## 1. 需求概述

基于用户反馈，当前博客在以下四个维度存在不足，需要全面升级：

| 维度 | 当前问题 | 期望改进 |
|------|----------|----------|
| **发布入口** | 入口不便捷，角色限定不清晰 | 导航栏快捷按钮（管理员专属）、管理面板优化 |
| **编辑器体验** | EasyMDE CDN 加载不稳定，缺少图片上传 | 使用 Tiptap 编辑器，支持富文本编辑和图片上传 |
| **数据持久化** | 无自动保存，意外关闭丢失内容 | localStorage 自动保存 + 服务器端草稿同步 |
| **访客互动** | 无评论、点赞、阅读统计 | Giscus 评论 + 点赞 + 阅读统计 + 分享功能 |

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                       前端 (Vue 3)                          │
├─────────────────────────────────────────────────────────────┤
│  组件层                                                     │
│  ├── TiptapEditor.vue    # Tiptap 富文本编辑器              │
│  ├── CommentSection.vue  # Giscus 评论区                    │
│  ├── PostInteraction.vue # 点赞/分享/阅读统计               │
│  └── PublishButton.vue   # 快捷发布按钮（管理员专属）        │
├─────────────────────────────────────────────────────────────┤
│  视图层                                                     │
│  ├── AdminPostEdit.vue   # 文章编辑页（升级）                │
│  ├── AdminPosts.vue      # 文章管理页（优化）               │
│  ├── BlogPost.vue        # 文章详情页（新增互动）            │
│  └── HomePage.vue        # 首页（新增发布入口）              │
├─────────────────────────────────────────────────────────────┤
│  状态管理                                                   │
│  ├── blog.ts             # 博客数据状态                     │
│  └── profile.ts          # 用户资料状态                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       后端 (Flask)                          │
├─────────────────────────────────────────────────────────────┤
│  API 层                                                     │
│  ├── /api/admin/posts    # 文章 CRUD（扩展）                │
│  ├── /api/posts/:id/like # 点赞 API                        │
│  ├── /api/posts/:id/view # 阅读统计 API                     │
│  └── /api/admin/upload   # 图片上传（扩展）                 │
├─────────────────────────────────────────────────────────────┤
│  数据模型                                                   │
│  ├── Post                # 文章模型（新增 views/likes 字段）│
│  └── Like                # 点赞记录模型（新增）             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 编辑器架构

```
TiptapEditor.vue
├── useEditor()             # Tiptap 编辑器实例
├── useMarkdown()           # Markdown 导出扩展
├── useImageUpload()        # 图片上传扩展
├── useAutoSave()           # 自动保存 hook
└── Toolbar.vue             # 工具栏组件
```

## 3. 数据库设计

### 3.1 Posts 表变更

新增字段：
- `views` INT DEFAULT 0 - 阅读次数
- `likes` INT DEFAULT 0 - 点赞次数

### 3.2 Likes 表（新增）

```sql
CREATE TABLE likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE (post_id, ip_hash)
);
```

## 4. API 设计

### 4.1 文章编辑相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/admin/posts | 创建文章 | Admin |
| PUT | /api/admin/posts/:id | 更新文章 | Admin |
| POST | /api/admin/posts/:id/draft | 保存草稿 | Admin |
| POST | /api/admin/upload | 上传图片 | Admin |

### 4.2 互动相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/posts/:id/like | 点赞文章 | 公开 |
| GET | /api/posts/:id/like | 获取点赞状态 | 公开 |
| POST | /api/posts/:id/view | 记录阅读 | 公开 |

### 4.3 响应格式

```json
// 点赞响应
{
  "success": true,
  "data": {
    "liked": true,
    "count": 123
  }
}

// 阅读响应
{
  "success": true,
  "data": {
    "views": 456
  }
}
```

## 5. 前端组件设计

### 5.1 TiptapEditor.vue

**功能**：
- 富文本编辑（标题、粗体、斜体、列表、引用、代码块）
- 图片上传与插入
- Markdown 导出
- 自动保存状态提示

**Props**：
- `modelValue`: string - Markdown 内容
- `disabled`: boolean - 是否禁用

**Events**：
- `update:modelValue`: 内容变化
- `save`: 手动保存

### 5.2 CommentSection.vue

**功能**：
- 集成 Giscus 评论系统
- 支持环境变量配置
- 失败降级处理

**Props**：
- `slug`: string - 文章标识
- `title`: string - 文章标题

### 5.3 PostInteraction.vue

**功能**：
- 点赞按钮（带动画效果）
- 阅读量显示
- 分享按钮（支持原生分享和社交媒体链接）

**Props**：
- `post`: Post - 文章对象

## 6. 数据持久化方案

### 6.1 前端自动保存

```
编辑开始
    │
    ▼
每 30 秒触发
    │
    ├─── localStorage 保存（本地）
    │
    └─── 服务器草稿保存（如有网络）
            │
            ▼
页面刷新/重新打开
    │
    ▼
检查 localStorage 是否有未保存内容
    │
    ├─── 有 → 提示恢复
    │
    └─── 无 → 正常加载
```

### 6.2 后端草稿保存

- 新增 `/api/admin/posts/:id/draft` 端点
- 不更新 published_at，保持 status 为 draft
- 返回上次保存时间

## 7. 互动功能设计

### 7.1 评论系统

使用 Giscus（GitHub Discussions）：
- 以文章 `slug` 作为讨论话题映射键
- 支持浅色/深色模式
- 环境变量配置：`VITE_COMMENTS_PROVIDER`, `VITE_GISCUS_REPO`, 等

### 7.2 点赞功能

- 基于 IP 限流（同 IP 24 小时内只能点赞一次）
- 使用 IP 哈希存储，保护用户隐私
- 前端显示点赞动画和数量

### 7.3 阅读统计

- 页面加载时调用 API 递增计数
- 使用 IP 去重（可选）
- 在文章列表和详情页显示

### 7.4 分享功能

- 使用 Web Share API（原生分享）
- 降级方案：复制链接到剪贴板
- 支持的平台：微信、微博、QQ、复制链接

## 8. 发布入口设计

### 8.1 导航栏入口

- 仅管理员可见（通过 localStorage 中 access_token 判断）
- 显示「写文章」按钮或浮动操作按钮
- 点击跳转到 `/admin/posts/new`

### 8.2 管理面板入口

- 优化侧边栏布局，突出常用操作
- 添加快捷创建按钮

## 9. 安全与隐私

### 9.1 权限控制

- 管理员操作需要 JWT 认证
- 公开 API（点赞、阅读）无需认证但有限流

### 9.2 隐私保护

- IP 地址仅存储哈希值
- 不存储用户个人信息
- 评论数据由 Giscus 管理，符合 GitHub 隐私政策

### 9.3 反垃圾

- 点赞 API：IP 限流（24 小时/次）
- 阅读统计：可选 IP 去重
- 评论：依赖 Giscus/GitHub 反垃圾能力

## 10. 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue | 3.x |
| 编辑器 | Tiptap | 2.x |
| 状态管理 | Pinia | 2.x |
| 样式 | Tailwind CSS | 3.x |
| 后端框架 | Flask | 2.x |
| ORM | SQLAlchemy | 2.x |
| 数据库 | SQLite/MySQL/PostgreSQL | - |
| 评论系统 | Giscus | - |

## 11. 实施步骤

1. **数据库迁移**：更新 Posts 表，创建 Likes 表
2. **后端 API**：实现点赞、阅读统计 API
3. **前端组件**：创建 TiptapEditor、CommentSection、PostInteraction 组件
4. **文章编辑页**：升级 AdminPostEdit.vue 使用新编辑器
5. **文章详情页**：新增互动功能
6. **首页优化**：添加发布入口
7. **数据持久化**：实现自动保存和本地恢复
8. **测试验证**：功能测试和边界情况测试

## 12. 风险与降级

| 风险 | 降级策略 |
|------|----------|
| Tiptap 加载失败 | 降级为 textarea + 简单 Markdown 预览 |
| Giscus 加载失败 | 显示「评论加载失败」提示和替代入口 |
| 网络不可用 | 自动保存到 localStorage，联网后同步 |
| 图片上传失败 | 显示错误提示，保留原有内容 |
