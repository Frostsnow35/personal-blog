# 个人博客项目结构

## 项目概述
这是一个体现个人风格的个人博客网站，采用海蓝色海洋主题，支持暗色/亮色主题切换，包含3D光标尾随特效和音乐播放器。

## 技术架构
- **前端**: Vue.js 3 + TypeScript + Tailwind CSS
- **后端**: Python Flask + MySQL 8.0
- **特效**: Three.js (3D粒子效果) + GSAP (动画)
- **状态管理**: Pinia
- **路由**: Vue Router 4

## 目录结构

```
blog/
├── frontend/                    # Vue.js前端项目
│   ├── src/
│   │   ├── components/         # 组件
│   │   │   ├── CursorEffect.vue    # 3D光标尾随特效
│   │   │   ├── MusicPlayer.vue     # 音乐播放器
│   │   │   └── ThemeToggle.vue     # 主题切换
│   │   ├── stores/             # 状态管理
│   │   │   ├── blog.ts         # 博客数据状态
│   │   │   └── theme.ts        # 主题状态
│   │   ├── views/              # 页面组件
│   │   │   ├── LandingPage.vue     # 封面页
│   │   │   ├── HomePage.vue        # 主页
│   │   │   ├── About.vue           # 关于页面
│   │   │   ├── Archive.vue         # 归档页面
│   │   │   ├── Category.vue        # 分类页面
│   │   │   ├── Tag.vue             # 标签页面
│   │   │   └── BlogPost.vue        # 文章详情页
│   │   ├── services/           # API服务
│   │   │   └── api.ts          # API接口
│   │   ├── router/             # 路由配置
│   │   │   └── index.ts        # 路由定义
│   │   ├── App.vue             # 根组件
│   │   ├── main.ts             # 入口文件
│   │   └── style.css           # 全局样式
│   ├── package.json            # 前端依赖
│   ├── vite.config.ts          # Vite配置
│   ├── tailwind.config.js      # Tailwind配置
│   └── tsconfig.json           # TypeScript配置
├── backend/                     # Python Flask后端
│   ├── app.py                  # 主应用文件
│   ├── requirements.txt        # Python依赖
│   └── env.example            # 环境变量示例
├── database/                    # 数据库相关
│   └── init.sql               # 数据库初始化脚本
├── docs/                       # 项目文档
├── start-dev.bat              # Windows启动脚本
├── start-dev.sh               # Linux/Mac启动脚本
├── README.md                   # 项目说明
└── PROJECT_STRUCTURE.md        # 项目结构说明
```

## 核心功能

### 1. 封面页 (LandingPage)
- 全屏展示个人图片
- 海蓝色渐变背景
- 优雅的进入动画
- 点击进入主页

### 2. 主页 (HomePage)
- 文章列表展示
- 搜索功能
- 分类和标签筛选
- 响应式设计

### 3. 特效功能
- **3D光标尾随**: 使用Three.js创建海洋粒子效果
- **主题切换**: 支持暗色/亮色主题
- **音乐播放器**: 固定在左下角的播放器

### 4. 博客功能
- 文章展示、分类、标签
- 归档页面
- 搜索功能
- 个人介绍页面

## 特色设计

### 海洋主题色彩
- 主色调: 海蓝色 (#0ea5e9)
- 辅助色: 海洋绿 (#14b8a6)
- 渐变效果: 从海蓝到海洋绿的过渡

### 动画效果
- 波浪动画
- 浮动元素
- 发光效果
- 流畅的过渡动画

## 开发指南

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 数据库设置
1. 启动MySQL服务
2. 执行 `database/init.sql` 初始化数据库
3. 配置 `backend/env.example` 中的数据库连接信息

## 部署说明

### GitHub Pages部署
1. 构建前端项目: `npm run build`
2. 将 `dist` 目录推送到GitHub Pages分支
3. 配置域名和SSL证书

### 后端部署
1. 使用Gunicorn部署Flask应用
2. 配置Nginx反向代理
3. 设置环境变量和数据库连接

## 技术亮点

1. **现代化技术栈**: Vue 3 + TypeScript + Tailwind CSS
2. **3D特效**: Three.js实现的海洋粒子效果
3. **响应式设计**: 完美适配各种设备
4. **主题系统**: 支持暗色/亮色主题切换
5. **性能优化**: 组件懒加载、图片优化等
6. **SEO友好**: 服务端渲染支持

## 后续开发计划

- [ ] 评论系统
- [ ] 用户认证
- [ ] 文章编辑器
- [ ] 图片上传
- [ ] 统计分析
- [ ] 移动端APP
- [ ] 国际化支持

