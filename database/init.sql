-- 创建个人博客数据库
CREATE DATABASE IF NOT EXISTS personal_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE personal_blog;

-- 创建个人资料表
CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(500),
    bio TEXT,
    email VARCHAR(100),
    location VARCHAR(100),
    website VARCHAR(500),
    github VARCHAR(500),
    twitter VARCHAR(500),
    skills JSON,
    interests JSON,
    education VARCHAR(200),
    occupation VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建博客文章表
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    category VARCHAR(100),
    tags JSON,
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_time INT DEFAULT 5,
    cover_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认个人资料
INSERT INTO profiles (name, avatar, bio, email, location, website, github, twitter, skills, interests, education, occupation) VALUES (
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
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 插入示例分类
INSERT INTO categories (name, description) VALUES 
('技术分享', '技术相关的文章和教程'),
('个人感悟', '个人生活和思考的记录'),
('哲学思考', '关于哲学和人生的思考')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 插入示例标签
INSERT INTO tags (name) VALUES 
('Vue.js'),
('前端开发'),
('技术'),
('生活'),
('思考'),
('海洋'),
('哲学'),
('自然')
ON DUPLICATE KEY UPDATE name = name;

-- 插入示例博客文章
INSERT INTO blog_posts (title, content, excerpt, category, tags, read_time) VALUES 
('欢迎来到我的博客', '这是一个全新的开始，我将在这里分享我的技术心得、生活感悟和对世界的思考。', '这是一个全新的开始，我将在这里分享我的技术心得、生活感悟和对世界的思考。', '个人感悟', '["生活", "思考", "博客"]', 3),
('Vue.js 3 组合式API实践', '深入探讨Vue.js 3组合式API的使用方法和最佳实践，通过实例学习如何更好地组织组件逻辑。', '深入探讨Vue.js 3组合式API的使用方法和最佳实践，通过实例学习如何更好地组织组件逻辑。', '技术分享', '["Vue.js", "前端开发", "技术"]', 8),
('海洋的哲学思考', '通过海洋的深邃和广阔，探讨人生的哲学思考，寻找内心的平静和智慧。', '通过海洋的深邃和广阔，探讨人生的哲学思考，寻找内心的平静和智慧。', '哲学思考', '["海洋", "哲学", "思考", "自然"]', 5)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 创建索引
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_publish_date ON blog_posts(publish_date);
CREATE INDEX idx_blog_posts_title ON blog_posts(title);

-- 显示创建的表
SHOW TABLES;

-- 显示个人资料
SELECT * FROM profiles;

-- 显示博客文章
SELECT * FROM blog_posts;

-- 显示分类
SELECT * FROM categories;

-- 显示标签
SELECT * FROM tags;
