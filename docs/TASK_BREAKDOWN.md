# 任务拆分 TASK_BREAKDOWN

本文档将“独立搜索页 + 后端搜索接口”拆分为原子任务。每个原子任务满足单一职责，并给出明确输入输出。

## Atom 1 新增后端搜索接口

输入

1. HTTP GET 参数：search category tag page per_page

输出

1. HTTP 200 JSON：success,data.items,total,pages,current_page

涉及函数

1. search_published_posts

约束

1. 仅返回 status 为 published 的文章
2. search 匹配 title 与 category 的包含匹配，并支持 tags 的包含匹配

## Atom 2 新增前端 /search 页面

输入

1. 路由 URL query：search category tag page
2. 后端接口：/api/search /api/categories/published /api/tags/published

输出

1. 搜索页 UI：结果列表 分页 控件状态与 URL 一致

涉及函数

1. fetchResults
2. replaceQuery
3. goToPage

约束

1. URL query 为唯一状态源
2. 搜索输入防抖 300ms，并支持 Enter 立即应用
3. 变更筛选条件时 page 复位到 1

## Atom 3 首页搜索入口跳转

输入

1. 首页搜索输入框内容

输出

1. 路由跳转到 /search 并写入 search 以及可选的 category tag

涉及函数

1. onSearchInput
2. applySearchNow

约束

1. 首页不再以 search 过滤文章列表，统一由 /search 承担搜索体验
