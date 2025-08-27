# 个人博客项目

这是一个体现个人风格的博客网站，采用海蓝色海洋主题，支持暗色/亮色主题切换，包含3D光标尾随特效和音乐播放器。

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- Python 3.8+
- MySQL 8.0

### 安装依赖

#### 前端
```bash
cd frontend
npm install
```

#### 后端
```bash
cd backend
pip install -r requirements.txt
```

### 启动开发环境

#### Windows
双击运行 `start-dev.bat`

#### Linux/Mac
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## 📁 项目结构

```
blog/
├── frontend/                    # Vue.js前端项目
│   ├── src/
│   │   ├── components/         # 组件
│   │   ├── stores/             # 状态管理
│   │   ├── views/              # 页面组件
│   │   ├── services/           # API服务
│   │   └── router/             # 路由配置
│   ├── package.json            # 前端依赖
│   └── vite.config.ts          # Vite配置
├── backend/                     # Python Flask后端
│   ├── app.py                  # 主应用文件
│   └── requirements.txt        # Python依赖
└── database/                    # 数据库相关
    └── init.sql               # 数据库初始化脚本
```

## 🔧 技术栈

- **前端**: Vue.js 3 + TypeScript + Tailwind CSS
- **后端**: Python Flask + MySQL 8.0
- **特效**: Three.js (3D粒子效果) + GSAP (动画)
- **状态管理**: Pinia
- **路由**: Vue Router 4

## ✨ 核心功能

- 🎨 海洋主题设计
- 🌙 暗色/亮色主题切换
- 🎯 3D光标尾随特效
- 🎵 音乐播放器
- 📝 博客文章管理
- 🔍 搜索和分类
- 📱 响应式设计

## 🐛 常见问题

### TypeScript类型错误
如果遇到类型声明错误，请确保：
1. 已安装所有依赖：`npm install`
2. 重启TypeScript服务
3. 检查`tsconfig.json`配置

### 依赖安装失败
```bash
# 清除缓存
npm cache clean --force
# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 问题描述
博客文章的中文内容（标题、摘要、分类、正文）全部显示为问号（????），但数据库中的内容正常。

#### 问题分析
通过诊断发现：
- ✅ 数据库中的中文内容正常
- ✅ JSON序列化/反序列化正常  
- ✅ Flask响应编码设置正常
- ❌ SQLAlchemy ORM层在数据获取时破坏编码

#### 根本原因
SQLAlchemy ORM在从数据库模型对象获取属性时，进行了错误的编码转换，导致中文字符被转换为问号。

#### 解决过程

##### 1. 初步诊断
```bash
# 检查数据库内容
python test_simple_encoding.py

# 检查API响应
(Invoke-RestMethod -Uri "http://localhost:5000/api/posts/published" -Method Get) | ConvertTo-Json -Depth 3
```

##### 2. 编码配置修复
```python
# 在 app.py 中添加编码配置
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

# 修改 json_response 函数
def json_response(data, status_code=200):
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    response.headers['Content-Encoding'] = 'utf-8'
    response.charset = 'utf-8'
    response.encoding = 'utf-8'
    return response, status_code
```

##### 3. 绕过SQLAlchemy（最终解决方案）
由于SQLAlchemy的编码问题无法通过配置完全解决，采用直接SQL查询的方式：

```python
@app.route('/api/posts/published', methods=['GET'])
def get_published_posts():
    """获取已发布的文章列表（用于前台展示）"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 构建查询条件
        where_conditions = ["status = 'published'"]
        params = []
        
        if category:
            where_conditions.append("category = ?")
            params.append(category)
        
        if search:
            where_conditions.append("(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)")
            search_pattern = f'%{search}%'
            params.extend([search_pattern, search_pattern, search_pattern])
        
        # 构建SQL查询
        where_clause = " AND ".join(where_conditions)
        count_sql = f"SELECT COUNT(*) FROM posts WHERE {where_clause}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # 分页查询
        offset = (page - 1) * per_page
        query_sql = f"""
            SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, 
                   published_at, created_at
            FROM posts 
            WHERE {where_clause}
            ORDER BY published_at DESC, created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, params + [per_page, offset])
        posts = cursor.fetchall()
        
        # 构建响应数据
        items = []
        for post in posts:
            post_id, title, slug, excerpt, category, tags, cover_url, read_time, published_at, created_at = post
            
            # 处理tags字段（JSON字符串）
            try:
                if tags and isinstance(tags, str):
                    tags_list = json.loads(tags)
                else:
                    tags_list = []
            except:
                tags_list = []
            
            items.append({
                'id': post_id,
                'title': title,
                'slug': slug,
                'excerpt': excerpt,
                'category': category,
                'tags': tags_list,
                'cover_url': cover_url,
                'read_time': read_time,
                'published_at': published_at,
                'created_at': created_at
            })
        
        # 计算总页数
        pages = (total + per_page - 1) // per_page
        
        return json_response({
            'success': True,
            'data': {
                'items': items,
                'total': total,
                'pages': pages,
                'current_page': page
            }
        })
        
    finally:
        cursor.close()
        conn.close()
```

#### 修复的API端点
- `/api/posts/published` - 获取已发布文章列表
- `/api/posts/slug/<slug>` - 根据slug获取单篇文章

#### 验证方法
```bash
# 重启Flask应用
python app.py

# 测试API
(Invoke-RestMethod -Uri "http://localhost:5000/api/posts/published" -Method Get) | ConvertTo-Json -Depth 3
```

#### 注意事项
- 此方案适用于开发环境，生产环境建议使用MySQL并正确配置字符集
- 直接SQL查询需要手动处理分页、搜索等逻辑
- 保持了原有的所有功能（分页、搜索、分类过滤等）

#### 预防措施
1. 开发环境使用SQLite时，确保Python文件使用UTF-8编码
2. 生产环境使用MySQL时，设置正确的字符集：`utf8mb4`
3. 在数据库连接字符串中添加字符集参数
4. 定期测试中文内容的显示效果

## 📝 开发说明

### 添加新页面
1. 在`frontend/src/views/`创建Vue组件
2. 在`frontend/src/router/index.ts`添加路由
3. 在导航菜单中添加链接

### 修改主题色彩
编辑`frontend/tailwind.config.js`中的颜色配置

## 🔧 故障排除

### 中文编码问题（博客文章显示问号）

#### 问题描述
博客文章的中文内容（标题、摘要、分类、正文）全部显示为问号（????），但数据库中的内容正常。

#### 问题分析
通过诊断发现：
- ✅ 数据库中的中文内容正常
- ✅ JSON序列化/反序列化正常  
- ✅ Flask响应编码设置正常
- ❌ SQLAlchemy ORM层在数据获取时破坏编码

#### 根本原因
SQLAlchemy ORM在从数据库模型对象获取属性时，进行了错误的编码转换，导致中文字符被转换为问号。

#### 解决过程

##### 1. 初步诊断
```bash
# 检查数据库内容
python test_simple_encoding.py

# 检查API响应
(Invoke-RestMethod -Uri "http://localhost:5000/api/posts/published" -Method Get) | ConvertTo-Json -Depth 3
```

##### 2. 编码配置修复
```python
# 在 app.py 中添加编码配置
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

# 修改 json_response 函数
def json_response(data, status_code=200):
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    response.headers['Content-Encoding'] = 'utf-8'
    response.charset = 'utf-8'
    response.encoding = 'utf-8'
    return response, status_code
```

##### 3. 绕过SQLAlchemy（最终解决方案）
由于SQLAlchemy的编码问题无法通过配置完全解决，采用直接SQL查询的方式：

```python
@app.route('/api/posts/published', methods=['GET'])
def get_published_posts():
    """获取已发布的文章列表（用于前台展示）"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 构建查询条件
        where_conditions = ["status = 'published'"]
        params = []
        
        if category:
            where_conditions.append("category = ?")
            params.append(category)
        
        if search:
            where_conditions.append("(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)")
            search_pattern = f'%{search}%'
            params.extend([search_pattern, search_pattern, search_pattern])
        
        # 构建SQL查询
        where_clause = " AND ".join(where_conditions)
        count_sql = f"SELECT COUNT(*) FROM posts WHERE {where_clause}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # 分页查询
        offset = (page - 1) * per_page
        query_sql = f"""
            SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, 
                   published_at, created_at
            FROM posts 
            WHERE {where_clause}
            ORDER BY published_at DESC, created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, params + [per_page, offset])
        posts = cursor.fetchall()
        
        # 构建响应数据
        items = []
        for post in posts:
            post_id, title, slug, excerpt, category, tags, cover_url, read_time, published_at, created_at = post
            
            # 处理tags字段（JSON字符串）
            try:
                if tags and isinstance(tags, str):
                    tags_list = json.loads(tags)
                else:
                    tags_list = []
            except:
                tags_list = []
            
            items.append({
                'id': post_id,
                'title': title,
                'slug': slug,
                'excerpt': excerpt,
                'category': category,
                'tags': tags_list,
                'cover_url': cover_url,
                'read_time': read_time,
                'published_at': published_at,
                'created_at': created_at
            })
        
        # 计算总页数
        pages = (total + per_page - 1) // per_page
        
        return json_response({
            'success': True,
            'data': {
                'items': items,
                'total': total,
                'pages': pages,
                'current_page': page
            }
        })
        
    finally:
        cursor.close()
        conn.close()
```

#### 修复的API端点
- `/api/posts/published` - 获取已发布文章列表
- `/api/posts/slug/<slug>` - 根据slug获取单篇文章

#### 验证方法
```bash
# 重启Flask应用
python app.py

# 测试API
(Invoke-RestMethod -Uri "http://localhost:5000/api/posts/published" -Method Get) | ConvertTo-Json -Depth 3
```

#### 注意事项
- 此方案适用于开发环境，生产环境建议使用MySQL并正确配置字符集
- 直接SQL查询需要手动处理分页、搜索等逻辑
- 保持了原有的所有功能（分页、搜索、分类过滤等）

#### 预防措施
1. 开发环境使用SQLite时，确保Python文件使用UTF-8编码
2. 生产环境使用MySQL时，设置正确的字符集：`utf8mb4`
3. 在数据库连接字符串中添加字符集参数
4. 定期测试中文内容的显示效果

### 其他常见问题

#### 数据库连接失败
```bash
# 检查MySQL服务状态
sc query MySQL80

# 启动MySQL服务
net start MySQL80

# 检查端口占用
netstat -an | findstr :3306
```

#### 前端构建失败
```bash
# 清除缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node --version
```

### 添加新特效
在`frontend/src/components/`中创建新组件

## 🚀 部署

### 前端部署
```bash
cd frontend
npm run build
# 将dist目录部署到静态服务器
```

### 后端部署
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！
