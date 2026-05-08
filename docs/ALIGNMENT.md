# 需求对齐 ALIGNMENT

本次改动的目标是让站点更符合成熟个人博客的使用预期，优先补齐站内搜索（Search / 站内检索）的独立搜索页体验，并保证可分享与可回退的 URL 状态。

范围

1. 新增独立搜索页 `/search`，支持关键词（search）、分类（category）、标签（tag）与分页（page）筛选。
2. 搜索结果仅覆盖已发布文章（Published / 已发布），不暴露草稿（Draft / 草稿）。
3. 搜索状态以 URL query 为唯一状态源，页面刷新与前进后退可复现相同结果。
4. 后端提供统一搜索接口 `/api/search`，参数协议与前端 URL query 对齐。
5. 首页搜索框作为入口，引导跳转到 `/search`，首页本身保留分类 标签与分页浏览。

非目标

1. 不做全文检索引擎升级（FTS5 / Full Text Search 5 或外部搜索服务），仅做当前体量可上线的 LIKE 方案。
2. 不做自动补全（Autocomplete / 自动补全）、高亮（Highlight / 高亮）与相关性排序（Relevance / 相关性）等进阶体验。
3. 不在本次改动中重构全站导航为单一共享组件，优先完成可用闭环。

成功标准

1. 访问 `/search` 可正常加载分类 标签与结果列表，无控制台报错。
2. 组合筛选（search + category + tag）可正确联动并更新 URL。
3. 分页可用，且浏览器前进后退可回放分页状态。
4. `/api/search` 返回结构稳定：success,data.items,total,pages,current_page 字段完整。
