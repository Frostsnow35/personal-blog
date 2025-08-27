#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite数据库初始化脚本
"""

import sqlite3
import os
from datetime import datetime, timezone

def init_sqlite_database():
    """初始化SQLite数据库"""
    # 确保数据库文件位于 backend 目录，和后端应用一致
    db_path = os.path.join(os.path.dirname(__file__), "personal_blog.db")
    
    # 如果数据库文件已存在，先删除
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"已删除旧的数据库文件: {db_path}")
    
    # 创建数据库连接
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    
    print("正在创建SQLite数据库...")
    
    # 创建posts表（用于前台展示）
    cursor.execute('''
        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            excerpt TEXT DEFAULT '',
            status TEXT DEFAULT 'published',
            cover_url TEXT,
            category TEXT,
            tags TEXT,  -- JSON字符串
            read_time INTEGER DEFAULT 3,
            published_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建blog_posts表（兼容旧版本）
    cursor.execute('''
        CREATE TABLE blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            category TEXT,
            tags TEXT,  -- JSON字符串
            publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_time INTEGER DEFAULT 5,
            cover_image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建categories表
    cursor.execute('''
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建tags表
    cursor.execute('''
        CREATE TABLE tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建profiles表
    cursor.execute('''
        CREATE TABLE profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            avatar TEXT,
            bio TEXT,
            email TEXT,
            location TEXT,
            website TEXT,
            github TEXT,
            twitter TEXT,
            skills TEXT,  -- JSON字符串
            interests TEXT,  -- JSON字符串
            education TEXT,
            occupation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建users表（管理员）
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    print("表创建完成，正在插入示例数据...")
    
    # 插入示例分类
    categories = [
        ('技术分享', '技术相关的文章和教程'),
        ('个人感悟', '个人生活和思考的记录'),
        ('哲学思考', '关于哲学和人生的思考'),
        ('前端开发', '前端技术和框架分享'),
        ('后端技术', '后端开发经验分享')
    ]
    
    cursor.executemany('''
        INSERT INTO categories (name, description) VALUES (?, ?)
    ''', categories)
    
    # 插入示例标签
    tags = [
        ('Vue.js',),
        ('前端开发',),
        ('技术',),
        ('生活',),
        ('思考',),
        ('海洋',),
        ('哲学',),
        ('自然',),
        ('Python',),
        ('Flask',),
        ('数据库',),
        ('Web开发',)
    ]
    
    cursor.executemany('''
        INSERT INTO tags (name) VALUES (?)
    ''', tags)
    
    # 插入示例文章
    sample_posts = [
        {
            'title': '欢迎来到我的博客',
            'slug': 'welcome-to-my-blog',
            'content': '''这是一个全新的开始，我将在这里分享我的技术心得、生活感悟和对世界的思考。

## 关于我
我是一名计算机专业的学生，热爱技术，也热爱生活。我喜欢探索新事物，思考人生哲理，也喜欢分享我的经验和见解。

## 博客内容
这个博客将包含以下内容：
- 技术分享：前端开发、后端技术、数据库等
- 个人感悟：生活中的点滴思考和感悟
- 哲学思考：对人生、世界、价值的思考
- 学习笔记：各种技术的学习记录

## 技术栈
- 前端：Vue.js 3 + TypeScript + Tailwind CSS
- 后端：Python + Flask
- 数据库：SQLite（开发）/ MySQL（生产）

希望这个博客能够成为我们交流的平台，也希望能够帮助到有需要的朋友。''',
            'excerpt': '这是一个全新的开始，我将在这里分享我的技术心得、生活感悟和对世界的思考。',
            'category': '个人感悟',
            'tags': '["生活", "思考", "博客"]',
            'read_time': 3,
            'status': 'published'
        },
        {
            'title': 'Vue.js 3 组合式API实践',
            'slug': 'vue3-composition-api-practice',
            'content': '''深入探讨Vue.js 3组合式API的使用方法和最佳实践，通过实例学习如何更好地组织组件逻辑。

## 组合式API的优势
相比选项式API，组合式API提供了更好的逻辑复用和代码组织能力。

### 1. 逻辑复用
```javascript
// 可以轻松提取和复用逻辑
function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  const decrement = () => count.value--
  
  return { count, increment, decrement }
}
```

### 2. 更好的TypeScript支持
组合式API天然支持TypeScript，类型推导更加准确。

### 3. 逻辑组织
相关的逻辑可以组织在一起，提高代码的可读性。

## 实际应用
在实际项目中，组合式API特别适合：
- 复杂的表单处理
- 状态管理
- 异步操作
- 第三方库集成

通过合理使用组合式API，我们可以写出更加清晰、可维护的Vue组件。''',
            'excerpt': '深入探讨Vue.js 3组合式API的使用方法和最佳实践，通过实例学习如何更好地组织组件逻辑。',
            'category': '技术分享',
            'tags': '["Vue.js", "前端开发", "技术"]',
            'read_time': 8,
            'status': 'published'
        },
        {
            'title': '海洋的哲学思考',
            'slug': 'philosophical-thoughts-on-ocean',
            'content': '''通过海洋的深邃和广阔，探讨人生的哲学思考，寻找内心的平静和智慧。

## 海洋的象征意义
海洋象征着：
- **无限性**：海洋的广阔无垠，提醒我们世界的无限可能
- **深度**：海洋的深邃，象征着知识的深度和思考的深度
- **包容性**：海洋包容万物，教会我们宽容和理解
- **变化性**：海洋的潮起潮落，象征着生命的起伏变化

## 人生的哲学思考
站在海边，我们常常会思考：

### 1. 关于时间
海洋的永恒流动，让我们思考时间的本质。时间如流水，一去不复返，我们应该珍惜当下。

### 2. 关于空间
海洋的广阔无垠，让我们思考空间的意义。在浩瀚的宇宙中，我们每个人都是渺小的，但也是独特的。

### 3. 关于生命
海洋中孕育着无数生命，让我们思考生命的价值和意义。每一个生命都是珍贵的，都值得被尊重。

## 内心的平静
面对海洋，我们常常能够找到内心的平静。这种平静来自于：
- 对自然力量的敬畏
- 对生命本质的思考
- 对自我价值的认知

通过海洋的哲学思考，我们可以更好地理解自己，理解世界，找到内心的平静和智慧。''',
            'excerpt': '通过海洋的深邃和广阔，探讨人生的哲学思考，寻找内心的平静和智慧。',
            'category': '哲学思考',
            'tags': '["海洋", "哲学", "思考", "自然"]',
            'read_time': 5,
            'status': 'published'
        },
        {
            'title': 'Python Flask Web开发入门',
            'slug': 'python-flask-web-development-intro',
            'content': '''Flask是一个轻量级的Python Web框架，非常适合初学者学习和快速开发。

## Flask的特点
- **轻量级**：核心功能简单，易于理解
- **灵活**：可以根据需要选择组件
- **易学**：学习曲线平缓，适合初学者
- **扩展性强**：丰富的扩展生态系统

## 基本使用
```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
```

## 路由系统
Flask的路由系统非常灵活，支持多种URL模式：
- 静态路由：`/about`
- 动态路由：`/user/<username>`
- 类型转换：`/post/<int:post_id>`

## 模板系统
Flask使用Jinja2模板引擎，支持：
- 变量渲染
- 控制结构
- 模板继承
- 过滤器

## 数据库集成
Flask可以轻松集成各种数据库：
- SQLite（开发环境）
- MySQL（生产环境）
- PostgreSQL
- MongoDB

Flask是学习Web开发的绝佳选择，通过实践项目，你可以快速掌握Web开发的核心概念。''',
            'excerpt': 'Flask是一个轻量级的Python Web框架，非常适合初学者学习和快速开发。',
            'category': '后端技术',
            'tags': '["Python", "Flask", "Web开发", "后端技术"]',
            'read_time': 6,
            'status': 'published'
        },
        {
            'title': '前端开发中的设计模式',
            'slug': 'design-patterns-in-frontend-development',
            'content': '''设计模式是软件开发中的重要概念，在前端开发中同样适用。

## 常见的设计模式

### 1. 单例模式
确保一个类只有一个实例，并提供全局访问点。
```javascript
class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance
    }
    Logger.instance = this
  }
  
  log(message) {
    console.log(message)
  }
}
```

### 2. 观察者模式
定义对象间的一对多依赖关系，当一个对象状态改变时，所有依赖者都会得到通知。
```javascript
class EventEmitter {
  constructor() {
    this.events = {}
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }
}
```

### 3. 工厂模式
通过工厂方法创建对象，而不直接使用new操作符。
```javascript
class UserFactory {
  createUser(type) {
    switch (type) {
      case 'admin':
        return new AdminUser()
      case 'regular':
        return new RegularUser()
      default:
        throw new Error('Invalid user type')
    }
  }
}
```

## 实际应用
在前端开发中，这些设计模式可以帮助我们：
- 写出更加清晰的代码
- 提高代码的可维护性
- 减少代码重复
- 更好地组织代码结构

通过学习和应用设计模式，我们可以成为更好的前端开发者。''',
            'excerpt': '设计模式是软件开发中的重要概念，在前端开发中同样适用。',
            'category': '前端开发',
            'tags': '["前端开发", "设计模式", "JavaScript", "技术"]',
            'read_time': 7,
            'status': 'published'
        }
    ]
    
    for post in sample_posts:
        cursor.execute('''
            INSERT INTO posts (title, slug, content, excerpt, category, tags, read_time, status, published_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            post['title'],
            post['slug'],
            post['content'],
            post['excerpt'],
            post['category'],
            post['tags'],
            post['read_time'],
            post['status'],
            datetime.now(timezone.utc),
            datetime.now(timezone.utc),
            datetime.now(timezone.utc)
        ))
    
    # 插入个人资料
    cursor.execute('''
        INSERT INTO profiles (name, avatar, bio, email, location, website, github, twitter, skills, interests, education, occupation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        '霜雪旧曾谙',
        '/avatar.jpg',
        '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者',
        'example@email.com',
        '中国',
        'https://example.com',
        'https://github.com/username',
        'https://twitter.com/username',
        '["Vue.js", "Python", "Flask", "MySQL", "TypeScript", "Tailwind CSS"]',
        '["二次元", "海洋", "自然", "哲学", "技术分享"]',
        '计算机科学与技术',
        '学生'
    ))
    
    # 插入管理员用户
    cursor.execute('''
        INSERT INTO users (username, password_hash, role)
        VALUES (?, ?, ?)
    ''', (
        'admin',
        'pbkdf2:sha256:260000$your-salt$your-hash',  # 实际使用时需要正确的哈希
        'admin'
    ))
    
    # 提交事务
    connection.commit()
    
    print("示例数据插入完成！")
    
    # 验证数据
    cursor.execute("SELECT COUNT(*) FROM posts")
    post_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM categories")
    category_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tags")
    tag_count = cursor.fetchone()[0]
    
    print(f"\n数据库统计:")
    print(f"  文章: {post_count} 篇")
    print(f"  分类: {category_count} 个")
    print(f"  标签: {tag_count} 个")
    
    # 显示文章预览
    cursor.execute("SELECT title, category FROM posts LIMIT 3")
    posts = cursor.fetchall()
    
    print(f"\n文章预览:")
    for post in posts:
        print(f"  - {post[0]} ({post[1]})")
    
    cursor.close()
    connection.close()
    
    print(f"\n✅ SQLite数据库初始化完成: {db_path}")
    print("现在可以启动Flask应用了！")

if __name__ == "__main__":
    init_sqlite_database()
