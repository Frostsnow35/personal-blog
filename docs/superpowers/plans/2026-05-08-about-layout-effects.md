# 作者主页布局与唯美特效 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/about` 作者主页改为深色质感的双栏侧栏布局，首屏突出头像与一句话气质，降低拥挤与无序，并增加不妨碍观感体验的唯美背景特效。

**Architecture:** `/about` 页面结构做“侧栏作者卡与页内导航 + 右侧单一主容器分章节”的信息架构收敛；唯美特效使用 CSS 级别的低开销背景层（渐变光斑与轻微动效），限定 `pointer-events:none` 与低对比度，避免影响阅读与交互。

**Tech Stack:** Vue 3 + Vue Router + TypeScript + Tailwind CSS。

---

## 文件结构与边界

- Create: [AmbientBackdrop.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/components/AmbientBackdrop.vue)
  - 仅负责渲染背景光斑与动效，不包含业务逻辑
- Modify: [About.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/About.vue)
  - 重排布局与章节结构
  - 引入 AmbientBackdrop
  - 增加页内锚点与侧栏导航

---

### Task 1: 新增 AmbientBackdrop 组件

**Files:**
- Create: [AmbientBackdrop.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/components/AmbientBackdrop.vue)

- [ ] **Step 1: 实现低开销背景层**

组件要求：
- 固定铺满容器，`pointer-events: none`
- 三个渐变光斑缓慢漂移与呼吸，不要闪烁
- 在暗色主题更明显，在亮色主题更克制

- [ ] **Step 2: 确保无控制台报错**

---

### Task 2: About.vue 重排为深色质感双栏

**Files:**
- Modify: [About.vue](file:///e:/Hackathon/personal_blog/personal-blog/frontend/src/views/About.vue)

- [ ] **Step 1: 外层宽度与栅格**

将 `max-w-4xl` 调整为更舒展的 `max-w-6xl` 或 `max-w-7xl`，两栏结构为：
- 左侧：作者卡 + 社媒 + 页内导航（sticky）
- 右侧：单一主容器（glass panel），内部按章节排列

- [ ] **Step 2: 章节结构收敛**

右侧章节顺序：
1. 关于我
2. 技能与兴趣（同一章节，内部两块）
3. 精选文章（网格卡片）
4. 最新文章（极简列表）
5. 联系与合作（两列小面板）
6. 站点声明

- [ ] **Step 3: 页内导航与锚点**

侧栏导航链接到 `#about #works #latest #contact #notice`。

---

### Task 3: 本地验证

- [ ] **Step 1: 预览 /about**

验证项：
- 页面不再拥挤，模块层级清晰
- 背景动效不遮挡文本，不影响点击与滚动
- 深色主题更有质感，亮色主题保持克制

- [ ] **Step 2: 诊断与修复**

Run: VS Code diagnostics，无 TS 报错。
