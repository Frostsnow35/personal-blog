# Changelog

## Unreleased

### Fixed

- 修复 Supabase Security Advisor 告警 "Table publicly accessible"（public 表未启用 RLS，任何人可凭项目 URL + anon key 经 PostgREST 读写删数据）：新增幂等脚本 `sql/enable_rls.sql` 可在 SQL Editor 立即执行；后端启动时 `ensure_postgres_rls()` 自动为 public 全部表补开 RLS（含后续新建表），仅对含 supabase 的 DATABASE_URL 生效。应用以表属主直连、不受 RLS 影响（未启用 FORCE），PostgREST 侧默认拒绝、零策略。

### Added

- 新增独立搜索页 `/search`，支持关键词 分类 标签与分页，并以 URL query 作为可分享状态源。
- 新增后端搜索接口 `/api/search`，仅返回已发布文章，匹配标题与标签分类。
- 作者主页新增唯美背景动效层，提升深色质感与氛围但不影响阅读与交互。

### Changed

- 首页搜索框改为跳转到 `/search`，首页保留分类 标签筛选与分页浏览。
- 后端 CORS 增加 `http://localhost:3001` 以支持开发端口自动切换。
- 作者主页 `/about` 重排为深色质感双栏侧栏布局，模块分层收敛，降低拥挤感与无序感。
