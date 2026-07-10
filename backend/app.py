from flask import Flask, jsonify, request
import json
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timezone, timedelta
import os
import re
import locale
from dotenv import load_dotenv
import jwt
from sqlalchemy.pool import NullPool
from werkzeug.security import generate_password_hash, check_password_hash

# 加载环境变量
load_dotenv()

app = Flask(__name__)

# 配置数据库
# 在 Railway 等生产环境中使用绝对路径
database_url = (os.getenv('DATABASE_URL') or '').strip()
if database_url:
    if database_url.startswith('mysql://'):
        database_url = f"mysql+pymysql://{database_url[len('mysql://'):]}"
    elif database_url.startswith('postgres://'):
        database_url = f"postgresql://{database_url[len('postgres://'):]}"
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # 本地开发使用相对路径，生产环境使用绝对路径
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}?check_same_thread=False'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')


def build_engine_options(uri: str) -> dict:
    if 'mysql' in uri:
        return {
            'connect_args': {
                'charset': 'utf8mb4',
                'collation': 'utf8mb4_unicode_ci'
            }
        }
    if uri.startswith('sqlite:'):
        return {
            'connect_args': {
                'check_same_thread': False,
                'timeout': 20
            }
        }
    if uri.startswith('postgresql:'):
        return {'poolclass': NullPool}
    return {}


engine_options = build_engine_options(db_uri)
if engine_options:
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options

# 确保JSON编码支持中文
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# 设置Flask应用的编码
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
JWT_SECRET = os.getenv('JWT_SECRET', 'change-this-in-env')
JWT_ALG = 'HS256'

# 初始化扩展
db = SQLAlchemy(app)
migrate = Migrate(app, db)

cors_origins_env = os.getenv('CORS_ORIGINS', '')
cors_origins_from_env = [o.strip() for o in str(cors_origins_env).split(',') if o.strip()]
cors_default_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://frostsnow35-blog.netlify.app',
    'https://frostsnow35.dpdns.org',
    'https://*.trycloudflare.com',
    'https://*.vercel.app'
]

def _origin_to_pattern(value: str):
    v = (value or '').strip()
    if not v:
        return None
    if '*' in v:
        escaped = re.escape(v).replace('\\*', '.*')
        return re.compile(f'^{escaped}$')
    return v

cors_allowed_origins = []
for origin in (cors_default_origins + cors_origins_from_env):
    pattern = _origin_to_pattern(origin)
    if pattern is None:
        continue
    if isinstance(pattern, str):
        if pattern in cors_allowed_origins:
            continue
        cors_allowed_origins.append(pattern)
        continue
    pattern_str = getattr(pattern, 'pattern', None)
    if not pattern_str:
        continue
    if any(getattr(existing, 'pattern', None) == pattern_str for existing in cors_allowed_origins):
        continue
    cors_allowed_origins.append(pattern)

# 允许前端携带 Authorization 头
CORS(
    app,
    resources={r"/api/*": {"origins": cors_allowed_origins}},
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Authorization"],
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

def uses_direct_sqlite_queries() -> bool:
    return app.config.get('SQLALCHEMY_DATABASE_URI', '').startswith('sqlite:')


def uses_sqlalchemy_queries() -> bool:
    return not uses_direct_sqlite_queries()


def _iso_or_none(value):
    return value.isoformat() if value else None


def _serialize_post_summary(post):
    return {
        'id': post.id,
        'title': post.title,
        'slug': post.slug,
        'excerpt': post.excerpt,
        'category': post.category,
        'tags': post.tags or [],
        'cover_url': post.cover_url,
        'read_time': post.read_time,
        'views': getattr(post, 'views', 0),
        'likes': getattr(post, 'likes', 0),
        'published_at': _iso_or_none(post.published_at),
        'created_at': _iso_or_none(post.created_at)
    }


def _serialize_post_detail(post):
    data = _serialize_post_summary(post)
    data.update({
        'content': post.content,
        'status': post.status,
        'updated_at': _iso_or_none(post.updated_at)
    })
    return data

 

# 上传目录
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 数据模型
class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(500))
    category = db.Column(db.String(100))
    tags = db.Column(db.JSON)
    publish_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    read_time = db.Column(db.Integer, default=5)
    cover_image = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Tag(db.Model):
    __tablename__ = 'tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# 个人资料模型
class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(500))
    bio = db.Column(db.Text)
    email = db.Column(db.String(100))
    location = db.Column(db.String(100))
    website = db.Column(db.String(500))
    github = db.Column(db.String(500))
    twitter = db.Column(db.String(500))
    skills = db.Column(db.JSON)
    interests = db.Column(db.JSON)
    education = db.Column(db.String(200))
    occupation = db.Column(db.String(200))
    featured_slugs = db.Column(db.JSON)
    contact_markdown = db.Column(db.Text)
    cooperation_markdown = db.Column(db.Text)
    site_notice_markdown = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# 文章模型（后台管理）
class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), unique=True, index=True)
    content = db.Column(db.Text, default='')
    excerpt = db.Column(db.String(500), default='')
    status = db.Column(db.String(20), default='draft', index=True)  # draft | published
    cover_url = db.Column(db.String(500))
    category = db.Column(db.String(100))
    tags = db.Column(db.JSON)  # list[str]
    read_time = db.Column(db.Integer, default=3)
    views = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    published_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Like(db.Model):
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    ip_hash = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('post_id', 'ip_hash', name='uq_post_ip_like'),
    )

# JWT 认证装饰器
def jwt_required_admin(fn):
    from functools import wraps

    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            if payload.get('role') != 'admin':
                return jsonify({'success': False, 'message': 'Forbidden'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token expired'}), 401
        except Exception as e:
            return jsonify({'success': False, 'message': f'Invalid token: {str(e)}'}), 401
        return fn(*args, **kwargs)

    return wrapper


def _slugify(title: str) -> str:
    base = ''.join(ch.lower() if ch.isalnum() else '-' for ch in (title or '').strip())
    while '--' in base:
        base = base.replace('--', '-')
    base = base.strip('-') or 'post'
    # 保证唯一
    candidate = base
    i = 1
    while Post.query.filter_by(slug=candidate).first() is not None:
        i += 1
        candidate = f"{base}-{i}"
    return candidate


# 管理文章列表
@app.route('/api/admin/posts', methods=['GET'])
@jwt_required_admin
def admin_list_posts():
    q = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    category = request.args.get('category')

    query = Post.query
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Post.title.ilike(like), Post.excerpt.ilike(like), Post.content.ilike(like)))
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)

    posts = query.order_by(Post.updated_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'success': True,
        'data': {
            'items': [{
                'id': p.id,
                'title': p.title,
                'slug': p.slug,
                'status': p.status,
                'category': p.category,
                'tags': p.tags or [],
                'updated_at': p.updated_at.isoformat()
            } for p in posts.items],
            'total': posts.total,
            'page': page,
            'pages': posts.pages
        }
    })


@app.route('/api/admin/posts/<int:post_id>', methods=['GET'])
@jwt_required_admin
def admin_get_post(post_id):
    p = Post.query.get_or_404(post_id)
    return jsonify({'success': True, 'data': {
        'id': p.id,
        'title': p.title,
        'slug': p.slug,
        'content': p.content,
        'excerpt': p.excerpt,
        'status': p.status,
        'cover_url': p.cover_url,
        'category': p.category,
        'tags': p.tags or [],
        'read_time': p.read_time,
        'published_at': p.published_at.isoformat() if p.published_at else None,
        'created_at': p.created_at.isoformat(),
        'updated_at': p.updated_at.isoformat()
    }})


@app.route('/api/admin/posts', methods=['POST'])
@jwt_required_admin
def admin_create_post():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': '标题不能为空'}), 400
    slug = (data.get('slug') or '').strip() or _slugify(title)
    # 校验长度与slug格式
    if len(title) > 200:
        return jsonify({'success': False, 'message': '标题过长(<=200)'}), 400
    if len(data.get('excerpt') or '') > 500:
        return jsonify({'success': False, 'message': '摘要过长(<=500)'}), 400
    import re
    if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', slug):
        return jsonify({'success': False, 'message': 'slug 格式仅允许小写字母、数字及中划线'}), 400
    if Post.query.filter_by(slug=slug).first():
        return jsonify({'success': False, 'message': 'slug 已存在'}), 400

    p = Post(
        title=title,
        slug=slug,
        content=data.get('content') or '',
        excerpt=data.get('excerpt') or '',
        status=data.get('status') or 'draft',
        cover_url=data.get('cover_url'),
        category=data.get('category'),
        tags=data.get('tags') or [],
    )
    # 简单计算阅读时长：按每分钟 300 字
    words = len((p.content or '').replace('\n', ''))
    p.read_time = max(1, words // 300)
    if p.status == 'published' and not p.published_at:
        p.published_at = datetime.now(timezone.utc)
    db.session.add(p)
    db.session.commit()
    return jsonify({'success': True, 'data': {'id': p.id}, 'message': '创建成功'})


@app.route('/api/admin/posts/<int:post_id>', methods=['PUT'])
@jwt_required_admin
def admin_update_post(post_id):
    p = Post.query.get_or_404(post_id)
    data = request.get_json() or {}
    if 'title' in data:
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'success': False, 'message': '标题不能为空'}), 400
        if len(title) > 200:
            return jsonify({'success': False, 'message': '标题过长(<=200)'}), 400
        p.title = title
    if 'slug' in data:
        new_slug = (data.get('slug') or '').strip() or _slugify(p.title)
        import re
        if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', new_slug):
            return jsonify({'success': False, 'message': 'slug 格式仅允许小写字母、数字及中划线'}), 400
        if new_slug != p.slug and Post.query.filter_by(slug=new_slug).first():
            return jsonify({'success': False, 'message': 'slug 已存在'}), 400
        p.slug = new_slug
    for f in ['content', 'excerpt', 'cover_url', 'category']:
        if f in data:
            if f == 'excerpt' and data.get('excerpt') and len(data.get('excerpt')) > 500:
                return jsonify({'success': False, 'message': '摘要过长(<=500)'}), 400
            setattr(p, f, data.get(f))
    if 'tags' in data:
        p.tags = data.get('tags') or []
    if 'status' in data:
        st = data.get('status') or 'draft'
        if st not in ['draft', 'published']:
            return jsonify({'success': False, 'message': '非法状态'}), 400
        p.status = st
        if p.status == 'published' and not p.published_at:
            p.published_at = datetime.now(timezone.utc)
    # 重算阅读时长
    words = len((p.content or '').replace('\n', ''))
    p.read_time = max(1, words // 300)
    db.session.commit()
    return jsonify({'success': True, 'message': '更新成功'})


@app.route('/api/admin/posts/<int:post_id>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_post(post_id):
    p = Post.query.get_or_404(post_id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'success': True, 'message': '已删除'})


@app.route('/api/admin/posts/<int:post_id>/publish', methods=['POST'])
@jwt_required_admin
def admin_publish_post(post_id):
    p = Post.query.get_or_404(post_id)
    p.status = 'published'
    p.published_at = p.published_at or datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({'success': True, 'message': '已发布'})


@app.route('/api/admin/posts/<int:post_id>/unpublish', methods=['POST'])
@jwt_required_admin
def admin_unpublish_post(post_id):
    p = Post.query.get_or_404(post_id)
    p.status = 'draft'
    db.session.commit()
    return jsonify({'success': True, 'message': '已撤回为草稿'})

@app.route('/api/admin/upload', methods=['POST'])
@jwt_required_admin
def admin_upload():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '未选择文件'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'success': False, 'message': '文件名为空'}), 400
    safe_name = f"{int(datetime.now(timezone.utc).timestamp())}_{f.filename}"
    save_path = os.path.join(UPLOAD_DIR, safe_name)
    f.save(save_path)
    url = f"/uploads/{safe_name}"
    return jsonify({'success': True, 'data': {'url': url}})


# 静态提供上传文件
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    from flask import send_from_directory
    return send_from_directory(UPLOAD_DIR, filename)

def _get_site_url() -> str:
    site_url = (os.getenv('SITE_URL') or '').strip()
    if site_url:
        return site_url.rstrip('/')
    return request.host_url.rstrip('/')

@app.route('/sitemap.xml')
def sitemap():
    """生成 sitemap.xml"""
    from flask import make_response
    import xml.etree.ElementTree as ET
    
    site_url = _get_site_url()

    # 创建 XML 根元素
    urlset = ET.Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    # 添加静态页面
    static_pages = ['', '/home', '/about', '/archive', '/category', '/tag', '/profile']
    for page in static_pages:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f'{site_url}{page}'
        lastmod = ET.SubElement(url, 'lastmod')
        lastmod.text = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = 'weekly'
        priority = ET.SubElement(url, 'priority')
        priority.text = '0.8'
    
    # 添加已发布的文章
    published_posts = Post.query.filter_by(status='published').all()
    for post in published_posts:
        url = ET.SubElement(urlset, 'url')
        loc = ET.SubElement(url, 'loc')
        loc.text = f'{site_url}/post/{post.slug}'
        lastmod = ET.SubElement(url, 'lastmod')
        lastmod.text = post.updated_at.strftime('%Y-%m-%d')
        changefreq = ET.SubElement(url, 'changefreq')
        changefreq.text = 'monthly'
        priority = ET.SubElement(url, 'priority')
        priority.text = '0.6'
    
    # 生成 XML 字符串
    xml_str = ET.tostring(urlset, encoding='unicode')
    
    response = make_response(xml_str)
    response.headers['Content-Type'] = 'application/xml'
    return response

@app.route('/rss.xml')
def rss():
    """生成 RSS feed"""
    from flask import make_response
    import xml.etree.ElementTree as ET
    
    site_url = _get_site_url()

    # 创建 RSS 根元素
    rss = ET.Element('rss')
    rss.set('version', '2.0')
    
    channel = ET.SubElement(rss, 'channel')
    
    # 频道信息
    title = ET.SubElement(channel, 'title')
    title.text = '霜雪旧曾谙的个人博客'
    link = ET.SubElement(channel, 'link')
    link.text = site_url
    description = ET.SubElement(channel, 'description')
    description.text = '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者'
    language = ET.SubElement(channel, 'language')
    language.text = 'zh-CN'
    
    # 添加已发布的文章
    published_posts = Post.query.filter_by(status='published').order_by(Post.published_at.desc()).limit(20).all()
    for post in published_posts:
        item = ET.SubElement(channel, 'item')
        
        item_title = ET.SubElement(item, 'title')
        item_title.text = post.title
        
        item_link = ET.SubElement(item, 'link')
        item_link.text = f'{site_url}/post/{post.slug}'
        
        item_description = ET.SubElement(item, 'description')
        item_description.text = post.excerpt or post.content[:200] + '...' if len(post.content) > 200 else post.content
        
        item_pubDate = ET.SubElement(item, 'pubDate')
        item_pubDate.text = post.published_at.strftime('%a, %d %b %Y %H:%M:%S %z') if post.published_at else ''
        
        item_guid = ET.SubElement(item, 'guid')
        item_guid.text = f'{site_url}/post/{post.slug}'
    
    # 生成 XML 字符串
    xml_str = ET.tostring(rss, encoding='unicode')
    
    response = make_response(xml_str)
    response.headers['Content-Type'] = 'application/rss+xml'
    return response

# 用户模型（用于管理员登录）
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='admin')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


def ensure_default_admin():
    """在启动时确保存在一个管理员账号。优先从环境变量创建。"""
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD')
    admin_password_hash = os.getenv('ADMIN_PASSWORD_HASH')

    existing = User.query.filter_by(username=admin_username).first()
    if existing:
        return

    if admin_password_hash:
        password_hash = admin_password_hash
    elif admin_password:
        password_hash = generate_password_hash(admin_password)
    else:
        # 开发兜底（不推荐用于生产）
        password_hash = generate_password_hash('admin')

    user = User(username=admin_username, password_hash=password_hash, role='admin')
    db.session.add(user)
    db.session.commit()


def ensure_mysql_utf8mb4():
    """当使用 MySQL 时，确保数据库与所有表使用 utf8mb4 编码与排序规则。
    仅在 MySQL 数据库下执行；对 SQLite 无影响。
    """
    try:
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if 'mysql' not in uri:
            return
        # 获取当前数据库名
        db_name_result = db.session.execute('SELECT DATABASE()')
        db_name = list(db_name_result.fetchone() or [''])[0]
        if not db_name:
            return
        # 设置数据库级别字符集
        db.session.execute(f"ALTER DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        # 遍历所有表并转换字符集
        tables_result = db.session.execute('SHOW TABLES')
        tables = [list(row)[0] for row in tables_result]
        for table in tables:
            try:
                db.session.execute(f"ALTER TABLE `{table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            except Exception:
                pass
        db.session.commit()
    except Exception:
        db.session.rollback()


def ensure_profile_schema():
    required_columns = {
        'featured_slugs': 'TEXT',
        'contact_markdown': 'TEXT',
        'cooperation_markdown': 'TEXT',
        'site_notice_markdown': 'TEXT'
    }

    try:
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if 'mysql' in uri:
            try:
                db_name_result = db.session.execute('SELECT DATABASE()')
                db_name = list(db_name_result.fetchone() or [''])[0]
                if not db_name:
                    return
                existing_result = db.session.execute(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'profiles'",
                    {'db': db_name}
                )
                existing = {list(row)[0] for row in existing_result}
                for col, col_type in required_columns.items():
                    if col in existing:
                        continue
                    db.session.execute(f"ALTER TABLE `profiles` ADD COLUMN `{col}` {col_type}")
                db.session.commit()
            except Exception:
                db.session.rollback()
            return

        if not uses_direct_sqlite_queries():
            return

        import sqlite3
        import os

        db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
        conn = sqlite3.connect(db_path)
        try:
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(profiles)")
            existing = {row[1] for row in cur.fetchall()}
            for col, col_type in required_columns.items():
                if col in existing:
                    continue
                cur.execute(f"ALTER TABLE profiles ADD COLUMN {col} {col_type}")
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


def create_access_token(username: str, role: str = 'admin', expires_minutes: int = 120) -> str:
    payload = {
        'sub': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(minutes=expires_minutes),
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

# API路由
@app.route('/api/posts', methods=['GET'])
def get_posts():
    """获取博客文章列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    tag = request.args.get('tag')
    search = request.args.get('search')
    
    query = BlogPost.query
    
    if category:
        query = query.filter(BlogPost.category == category)
    if tag:
        query = query.filter(BlogPost.tags.contains([tag]))
    if search:
        query = query.filter(
            db.or_(
                BlogPost.title.contains(search),
                BlogPost.content.contains(search)
            )
        )
    
    posts = query.order_by(BlogPost.publish_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return json_response({
        'posts': [{
            'id': post.id,
            'title': post.title,
            'excerpt': post.excerpt,
            'category': post.category,
            'tags': post.tags,
            'publish_date': post.publish_date.isoformat(),
            'read_time': post.read_time,
            'cover_image': post.cover_image
        } for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    })

@app.route('/api/posts/published', methods=['GET'])
def get_published_posts():
    """获取已发布的文章列表（用于前台展示）"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    tag = request.args.get('tag')
    search = request.args.get('search')
    
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
    
    posts = query.order_by(Post.published_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    if uses_sqlalchemy_queries():
        return json_response({
            'success': True,
            'data': {
                'items': [_serialize_post_summary(p) for p in posts.items],
                'total': posts.total,
                'pages': posts.pages,
                'current_page': page
            }
        })
    
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

        if tag:
            where_conditions.append("tags LIKE ?")
            params.append(f'%"{tag}"%')
        
        if search:
            where_conditions.append("(title LIKE ? OR category LIKE ? OR tags LIKE ?)")
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
            
            # 处理日期字段
            published_at_str = published_at if published_at else None
            created_at_str = created_at if created_at else None
            
            items.append({
                'id': post_id,
                'title': title,
                'slug': slug,
                'excerpt': excerpt,
                'category': category,
                'tags': tags_list,
                'cover_url': cover_url,
                'read_time': read_time,
                'published_at': published_at_str,
                'created_at': created_at_str
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

    if uses_sqlalchemy_queries():
        return json_response({
            'success': True,
            'data': {
                'items': [_serialize_post_summary(p) for p in posts.items],
                'total': posts.total,
                'pages': posts.pages,
                'current_page': page
            }
        })

    import sqlite3
    import os

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
            params.append(f'%"{tag}"%')

        if search:
            where_conditions.append("(title LIKE ? OR category LIKE ? OR tags LIKE ?)")
            like = f'%{search}%'
            params.extend([like, like, like])

        where_clause = " AND ".join(where_conditions)
        cursor.execute(f"SELECT COUNT(*) FROM posts WHERE {where_clause}", params)
        total = cursor.fetchone()[0]

        offset = (page - 1) * per_page
        cursor.execute(
            f"""
            SELECT id, title, slug, excerpt, category, tags, cover_url, read_time,
                   published_at, created_at
            FROM posts
            WHERE {where_clause}
            ORDER BY published_at DESC, created_at DESC
            LIMIT ? OFFSET ?
            """,
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

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    if uses_sqlalchemy_queries():
        post = Post.query.filter_by(id=post_id, status='published').first()
        if not post:
            return jsonify({'success': False, 'message': 'Post not found or unpublished'}), 404
        return json_response({'success': True, 'data': _serialize_post_detail(post)})

    """获取单篇博客文章"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    import json
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, title, slug, content, excerpt, status, cover_url, category, 
                   tags, read_time, published_at, created_at, updated_at
            FROM posts 
            WHERE id = ? AND status = 'published'
        """, [post_id])
        
        post = cursor.fetchone()
        if not post:
            return jsonify({'success': False, 'message': '文章不存在或未发布'}), 404
        
        post_id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at, created_at, updated_at = post
        
        # 处理tags字段
        try:
            if tags and isinstance(tags, str):
                tags_list = json.loads(tags)
            else:
                tags_list = []
        except:
            tags_list = []
        
        return json_response({
            'success': True,
            'data': {
                'id': post_id,
                'title': title,
                'slug': slug,
                'content': content,
                'excerpt': excerpt,
                'status': status,
                'cover_url': cover_url,
                'category': category,
                'tags': tags_list,
                'read_time': read_time,
                'published_at': published_at,
                'created_at': created_at,
                'updated_at': updated_at
            }
        })
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/posts/slug/<slug>', methods=['GET'])
def get_post_by_slug(slug):
    if uses_sqlalchemy_queries():
        post = Post.query.filter_by(slug=slug, status='published').first()
        if not post:
            return jsonify({'success': False, 'message': 'Post not found or unpublished'}), 404
        return json_response({'success': True, 'data': _serialize_post_detail(post)})

    """根据 slug 获取已发布的博客文章"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, title, slug, content, excerpt, status, cover_url, category, 
                   tags, read_time, published_at, created_at, updated_at
            FROM posts 
            WHERE slug = ? AND status = 'published'
        """, [slug])
        
        post = cursor.fetchone()
        if not post:
            return jsonify({'success': False, 'message': '文章不存在或未发布'}), 404
        
        post_id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at, created_at, updated_at = post
        
        # 处理tags字段
        try:
            if tags and isinstance(tags, str):
                tags_list = json.loads(tags)
            else:
                tags_list = []
        except:
            tags_list = []
        
        return json_response({
            'success': True,
            'data': {
                'id': post_id,
                'title': title,
                'slug': slug,
                'content': content,
                'excerpt': excerpt,
                'status': status,
                'cover_url': cover_url,
                'category': category,
                'tags': tags_list,
                'read_time': read_time,
                'published_at': published_at,
                'created_at': created_at,
                'updated_at': updated_at
            }
        })
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/categories', methods=['GET'])
def get_categories():
    if uses_sqlalchemy_queries():
        categories = Category.query.order_by(Category.name).all()
        return json_response([{
            'id': category.id,
            'name': category.name,
            'description': category.description
        } for category in categories])

    """获取分类列表"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, name, description FROM categories ORDER BY name")
        categories = cursor.fetchall()
        
        return json_response([{
            'id': cat[0],
            'name': cat[1],
            'description': cat[2]
        } for cat in categories])
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/categories/published', methods=['GET'])
def get_published_categories():
    if uses_sqlalchemy_queries():
        rows = (
            db.session.query(Post.category, db.func.count(Post.id))
            .filter(Post.status == 'published', Post.category.isnot(None), Post.category != '')
            .group_by(Post.category)
            .order_by(db.func.count(Post.id).desc())
            .all()
        )
        return json_response({
            'success': True,
            'data': [{'name': category, 'count': count} for category, count in rows]
        })

    """获取已发布文章的分类列表（带文章数量）"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 统计每个分类下的已发布文章数量
        cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM posts 
            WHERE status = 'published' AND category IS NOT NULL AND category != ''
            GROUP BY category 
            ORDER BY count DESC
        """)
        categories_with_count = cursor.fetchall()
        
        return json_response({
            'success': True,
            'data': [{
                'name': cat[0],
                'count': cat[1]
            } for cat in categories_with_count]
        })
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tags', methods=['GET'])
def get_tags():
    if uses_sqlalchemy_queries():
        tags = Tag.query.order_by(Tag.name).all()
        return json_response([{
            'id': tag.id,
            'name': tag.name
        } for tag in tags])

    """获取标签列表"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, name FROM tags ORDER BY name")
        tags = cursor.fetchall()
        
        return json_response([{
            'id': tag[0],
            'name': tag[1]
        } for tag in tags])
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tags/published', methods=['GET'])
def get_published_tags():
    if uses_sqlalchemy_queries():
        rows = Post.query.with_entities(Post.tags).filter(
            Post.status == 'published',
            Post.tags.isnot(None)
        ).all()
        tag_counts = {}
        for row in rows:
            tags_value = row[0] or []
            if isinstance(tags_value, str):
                try:
                    tags_value = json.loads(tags_value)
                except Exception:
                    tags_value = []
            for tag in tags_value:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        tags_with_count = [{'name': tag, 'count': count} for tag, count in tag_counts.items()]
        return json_response({
            'success': True,
            'data': sorted(tags_with_count, key=lambda x: x['count'], reverse=True)
        })

    """获取已发布文章的标签列表（带文章数量）"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    import json
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 获取所有已发布文章的标签
        cursor.execute("SELECT tags FROM posts WHERE status = 'published' AND tags IS NOT NULL AND tags != ''")
        posts_with_tags = cursor.fetchall()
        
        tag_counts = {}
        for post in posts_with_tags:
            tags_str = post[0]
            if tags_str:
                try:
                    tags_list = json.loads(tags_str)
                    for tag in tags_list:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
                except:
                    # 如果JSON解析失败，跳过
                    continue
        
        tags_with_count = [{'name': tag, 'count': count} for tag, count in tag_counts.items()]
        
        return json_response({
            'success': True,
            'data': sorted(tags_with_count, key=lambda x: x['count'], reverse=True)
        })
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/stats', methods=['GET'])
def get_stats():
    if uses_sqlalchemy_queries():
        return json_response({
            'total_posts': Post.query.count(),
            'total_categories': Category.query.count(),
            'total_tags': Tag.query.count()
        })

    """获取博客统计信息"""
    # 使用直接SQL查询避免SQLAlchemy编码问题
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 统计文章数量
        cursor.execute("SELECT COUNT(*) FROM posts")
        total_posts = cursor.fetchone()[0]
        
        # 统计分类数量
        cursor.execute("SELECT COUNT(*) FROM categories")
        total_categories = cursor.fetchone()[0]
        
        # 统计标签数量
        cursor.execute("SELECT COUNT(*) FROM tags")
        total_tags = cursor.fetchone()[0]
        
        return json_response({
            'total_posts': total_posts,
            'total_categories': total_categories,
            'total_tags': total_tags
        })
        
    finally:
        cursor.close()
        conn.close()

@app.route('/api/profile', methods=['GET'])
def get_profile():
    """获取个人资料"""
    profile = Profile.query.first()
    if not profile:
        return json_response({
            'id': 1,
            'name': '霜雪旧曾谙',
            'avatar': '/avatar.jpg',
            'bio': '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者',
            'email': 'example@email.com',
            'location': '中国',
            'website': 'https://example.com',
            'github': 'https://github.com/username',
            'twitter': 'https://twitter.com/username',
            'skills': ['Vue.js', 'Python', 'Flask', 'MySQL', 'TypeScript', 'Tailwind CSS'],
            'interests': ['二次元', '海洋', '自然', '哲学', '技术分享'],
            'education': '计算机科学与技术',
            'occupation': '学生',
            'featured_slugs': [],
            'contact_markdown': '',
            'cooperation_markdown': '',
            'site_notice_markdown': '',
            'updated_at': datetime.now(timezone.utc).isoformat()
        })

    updated_at = profile.updated_at.isoformat() if getattr(profile, 'updated_at', None) else None
    return json_response({
        'id': profile.id,
        'name': profile.name or '',
        'avatar': profile.avatar or '/avatar.jpg',
        'bio': profile.bio or '',
        'email': profile.email or '',
        'location': profile.location or '',
        'website': profile.website or '',
        'github': profile.github or '',
        'twitter': profile.twitter or '',
        'skills': profile.skills or [],
        'interests': profile.interests or [],
        'education': profile.education or '',
        'occupation': profile.occupation or '',
        'featured_slugs': profile.featured_slugs or [],
        'contact_markdown': profile.contact_markdown or '',
        'cooperation_markdown': profile.cooperation_markdown or '',
        'site_notice_markdown': profile.site_notice_markdown or '',
        'updated_at': updated_at
    })

@app.route('/api/profile', methods=['PUT'])
@jwt_required_admin
def update_profile():
    """更新个人资料"""
    data = request.get_json()
    
    profile = Profile.query.first()
    if not profile:
        # 如果没有个人资料，创建一个新的
        profile = Profile()
        db.session.add(profile)
    
    # 更新字段
    for field in [
        'name',
        'avatar',
        'bio',
        'email',
        'location',
        'website',
        'github',
        'twitter',
        'skills',
        'interests',
        'education',
        'occupation',
        'featured_slugs',
        'contact_markdown',
        'cooperation_markdown',
        'site_notice_markdown'
    ]:
        if field in data:
            setattr(profile, field, data[field])
    
    profile.updated_at = datetime.now(timezone.utc)
    
    try:
        db.session.commit()
        return jsonify({'message': '个人资料更新成功', 'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'更新失败: {str(e)}', 'success': False}), 500


# 登录接口
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': '用户名或密码不能为空'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401

    token = create_access_token(username=user.username, role=user.role)
    return jsonify({
        'success': True,
        'access_token': token,
        'user': {
            'username': user.username,
            'role': user.role
        }
    })


def _get_client_ip():
    """获取客户端 IP 地址"""
    ip = request.headers.get('X-Forwarded-For', '').split(',')[0].strip()
    if not ip:
        ip = request.headers.get('X-Real-IP', '').strip()
    if not ip:
        ip = request.remote_addr or ''
    return ip.strip()


def _hash_ip(ip: str) -> str:
    """对 IP 地址进行哈希处理，保护隐私"""
    import hashlib
    return hashlib.sha256((ip + app.config.get('SECRET_KEY', '')).encode()).hexdigest()[:64]


@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    """点赞文章（公开接口）"""
    post = Post.query.get_or_404(post_id)
    ip = _get_client_ip()
    ip_hash = _hash_ip(ip)

    try:
        existing = Like.query.filter_by(post_id=post_id, ip_hash=ip_hash).first()
        if existing:
            Like.query.filter_by(post_id=post_id, ip_hash=ip_hash).delete()
            post.likes = max(0, (post.likes or 0) - 1)
            liked = False
        else:
            like = Like(post_id=post_id, ip_hash=ip_hash)
            db.session.add(like)
            post.likes = (post.likes or 0) + 1
            liked = True
        db.session.commit()
        return json_response({
            'success': True,
            'data': {
                'liked': liked,
                'count': post.likes
            }
        })
    except Exception as e:
        db.session.rollback()
        return json_response({'success': False, 'message': str(e)}, 500)


@app.route('/api/posts/<int:post_id>/like', methods=['GET'])
def get_like_status(post_id):
    """获取点赞状态（公开接口）"""
    post = Post.query.get_or_404(post_id)
    ip = _get_client_ip()
    ip_hash = _hash_ip(ip)

    existing = Like.query.filter_by(post_id=post_id, ip_hash=ip_hash).first()
    return json_response({
        'success': True,
        'data': {
            'liked': existing is not None,
            'count': post.likes or 0
        }
    })


@app.route('/api/posts/<int:post_id>/view', methods=['POST'])
def view_post(post_id):
    """记录阅读（公开接口）"""
    post = Post.query.get_or_404(post_id)
    post.views = (post.views or 0) + 1
    db.session.commit()
    return json_response({
        'success': True,
        'data': {
            'views': post.views
        }
    })


# 健康检查
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()})

# 兼容前端期望的 /api/health
@app.route('/api/health', methods=['GET'])
def health_check_api():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()})

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'message': '请求的资源不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    try:
        app.logger.exception(error)
    except Exception:
        pass
    return jsonify({'error': 'Internal server error', 'message': '服务器内部错误'}), 500

@app.errorhandler(Exception)
def handle_exception(error):
    try:
        app.logger.exception(error)
    except Exception:
        pass
    try:
        addr = (request.remote_addr or '').strip()
        is_local = addr == '::1' or addr.startswith('127.') or addr.endswith('127.0.0.1')
        is_production = (os.getenv('FLASK_ENV') == 'production') or (os.getenv('ENV') == 'production')
        if request.args.get('debug') == '1' and is_local and not is_production:
            return jsonify({'error': type(error).__name__, 'message': str(error)}), 500
    except Exception:
        pass
    return jsonify({'error': 'Server error', 'message': '服务器错误'}), 500

# 自定义JSON响应函数，确保编码正确
def json_response(data, status_code=200):
    """返回正确编码的JSON响应"""
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response, status_code

if __name__ == '__main__':
    import sys
    
    if hasattr(sys, 'setdefaultencoding'):
        sys.setdefaultencoding('utf-8')
    
    try:
        locale.setlocale(locale.LC_ALL, 'zh_CN.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, 'C.UTF-8')
        except:
            pass
    
    app.run(debug=False, host='0.0.0.0', port=5000)

def bootstrap():
    try:
        try:
            locale.setlocale(locale.LC_ALL, 'zh_CN.UTF-8')
        except:
            try:
                locale.setlocale(locale.LC_ALL, 'C.UTF-8')
            except:
                pass

        with app.app_context():
            db.create_all()
            ensure_mysql_utf8mb4()
            ensure_profile_schema()
            ensure_default_admin()
    except Exception as e:
        try:
            app.logger.exception(e)
        except Exception:
            pass

bootstrap()
