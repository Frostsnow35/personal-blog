from flask import Flask, jsonify, request
import json
import random
import urllib.request
import urllib.error
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
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash
from concurrent.futures import ThreadPoolExecutor

# 加载环境变量
load_dotenv()

_frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'dist')

app = Flask(
    __name__,
    static_folder=None,
    static_url_path=None
)

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

# 惰性初始化标志
_db_initialized = False


@app.before_request
def lazy_init():
    global _db_initialized
    if not _db_initialized and request.path.startswith('/api/'):
        if request.path in ('/api/health', '/api/debug'):
            return
        _db_initialized = True
        try:
            bootstrap()
        except Exception as e:
            app.logger.error(f"Database init failed: {e}")


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


# 浏览量异步写库线程池（单例，模块级创建）
_view_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix='view-counter')


def _async_increment_view(post_id):
    """后台线程：增加文章浏览量，独立 app context 避免跨线程问题"""
    try:
        with app.app_context():
            p = Post.query.get(post_id)
            if p is not None:
                p.views = (p.views or 0) + 1
                db.session.commit()
    except Exception as e:
        app.logger.error(f"Async view increment failed for post {post_id}: {e}")


# 列表接口字段顺序（与 with_entities / 原生 SQL SELECT 一致）
_POST_LIST_FIELDS = (
    'id', 'title', 'slug', 'excerpt', 'category', 'tags',
    'cover_url', 'read_time', 'views', 'likes',
    'published_at', 'created_at'
)


def _build_post_summary_item(row):
    """从 12 字段元组/Row 构造列表项，views/likes 兜底 None；published_at/created_at 兼容 datetime 或 str"""
    tags_value = row[5] or []
    if isinstance(tags_value, str):
        try:
            tags_value = json.loads(tags_value)
        except Exception:
            tags_value = []
    if not isinstance(tags_value, list):
        tags_value = []
    # 兼容 SQLAlchemy Row（可按名访问）与 sqlite3 tuple（按索引）
    def _field(idx, key=None):
        if key is not None:
            try:
                return row._mapping[key]
            except (AttributeError, KeyError):
                return row[idx]
        return row[idx]

    published_at = _field(10, 'published_at')
    created_at = _field(11, 'created_at')
    if published_at is not None and not isinstance(published_at, str):
        try:
            published_at = published_at.isoformat()
        except AttributeError:
            published_at = str(published_at)
    if created_at is not None and not isinstance(created_at, str):
        try:
            created_at = created_at.isoformat()
        except AttributeError:
            created_at = str(created_at)
    return {
        'id': row[0],
        'title': row[1],
        'slug': row[2],
        'excerpt': row[3],
        'category': row[4],
        'tags': tags_value,
        'cover_url': row[6],
        'read_time': row[7],
        'views': row[8] or 0,
        'likes': row[9] or 0,
        'published_at': published_at,
        'created_at': created_at
    }


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

 

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')


def _ensure_upload_dir():
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    except Exception:
        pass

# 数据模型
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
    site_title = db.Column(db.String(200))
    site_subtitle = db.Column(db.String(500))
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


class GuestMessage(db.Model):
    """留言板留言（独立端到端，替代原文章评论）"""
    __tablename__ = 'guest_messages'

    id = db.Column(db.Integer, primary_key=True)
    author_name = db.Column(db.String(32), nullable=False)
    author_email = db.Column(db.String(120), nullable=True)
    content = db.Column(db.Text, nullable=False)
    referenced_post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=True, index=True)
    ip_hash = db.Column(db.String(64), nullable=False, index=True)
    user_agent = db.Column(db.String(500), nullable=True)
    is_approved = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class Album(db.Model):
    """相册"""
    __tablename__ = 'albums'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(140), unique=True, index=True)
    description = db.Column(db.Text)
    cover_url = db.Column(db.String(500))
    sort_order = db.Column(db.Integer, default=0, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Photo(db.Model):
    """相册照片"""
    __tablename__ = 'photos'

    id = db.Column(db.Integer, primary_key=True)
    album_id = db.Column(db.Integer, db.ForeignKey('albums.id', ondelete='CASCADE'), nullable=False, index=True)
    url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    description = db.Column(db.String(500))
    taken_at = db.Column(db.DateTime)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class MusicFavorite(db.Model):
    """百宝箱 - 个人喜爱音乐"""
    __tablename__ = 'music_favorites'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200))
    album = db.Column(db.String(200))
    cover_url = db.Column(db.String(500))
    source_url = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    tags = db.Column(db.JSON)
    sort_order = db.Column(db.Integer, default=0, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class MovieFavorite(db.Model):
    """百宝箱 - 喜爱电影"""
    __tablename__ = 'movie_favorites'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    director = db.Column(db.String(200))
    year = db.Column(db.Integer)
    cover_url = db.Column(db.String(500))
    source_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    rating = db.Column(db.Integer)  # 1-10
    tags = db.Column(db.JSON)
    sort_order = db.Column(db.Integer, default=0, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class FriendLink(db.Model):
    """百宝箱 - 友链"""
    __tablename__ = 'friend_links'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    logo_url = db.Column(db.String(500))
    description = db.Column(db.String(500))
    email = db.Column(db.String(120))
    sort_order = db.Column(db.Integer, default=0, index=True)
    is_featured = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

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
    # 仅保留 ASCII 字母/数字（剥离 CJK / 全角字符），其他字符替换为 '-'
    base = ''.join(ch if (ch.isascii() and ch.isalnum()) else '-' for ch in (title or '').strip())
    while '--' in base:
        base = base.replace('--', '-')
    base = base.strip('-')
    if not base:
        # 全部为非 ASCII 时（如纯中文），使用 djb2 哈希生成稳定的短后缀
        h = _djb2((title or '').strip())
        base = f'post-{h:06x}'
    # 截断到 100 字符（DB 字段 220，保留余量）
    if len(base) > 100:
        base = base[:100].rstrip('-') or 'post'
    # 保证唯一
    candidate = base
    i = 1
    while Post.query.filter_by(slug=candidate).first() is not None:
        i += 1
        suffix = f'-{i}'
        # 拼上后缀再截断，确保总长不超 220
        candidate = f"{base[: 220 - len(suffix)]}{suffix}"
    return candidate


def _djb2(s: str) -> int:
    """32-bit djb2 哈希，与前端 slugify 保持一致，用于非 ASCII 标题的稳定后缀"""
    h = 5381
    for c in (s or '').encode('utf-8'):
        h = ((h * 33) + c) & 0xFFFFFFFF
    return h


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

    # 用 with_entities 限制查询字段，减少数据传输
    query = query.with_entities(
        Post.id, Post.title, Post.slug, Post.status,
        Post.category, Post.tags, Post.updated_at
    )
    posts = query.order_by(Post.updated_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'success': True,
        'data': {
            'items': [{
                'id': pid,
                'title': title,
                'slug': slug,
                'status': status,
                'category': category,
                'tags': tags or [],
                'updated_at': updated_at.isoformat() if updated_at else None,
            } for (pid, title, slug, status, category, tags, updated_at) in posts.items],
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
    if not re.match(r'^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$', slug):
        return jsonify({'success': False, 'message': 'slug 格式仅允许字母、数字及中划线（不可含中文）'}), 400
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
    try:
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
            if not re.match(r'^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$', new_slug):
                return jsonify({'success': False, 'message': 'slug 格式仅允许字母、数字及中划线（不可含中文）'}), 400
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
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


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
    try:
        p.status = 'published'
        p.published_at = p.published_at or datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({'success': True, 'message': '已发布'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/admin/posts/<int:post_id>/unpublish', methods=['POST'])
@jwt_required_admin
def admin_unpublish_post(post_id):
    p = Post.query.get_or_404(post_id)
    try:
        p.status = 'draft'
        db.session.commit()
        return jsonify({'success': True, 'message': '已撤回为草稿'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============== 留言板管理 ==============
def _message_to_dict(m: GuestMessage) -> dict:
    return {
        'id': m.id,
        'author_name': m.author_name,
        'author_email': m.author_email,
        'content': m.content,
        'referenced_post_id': m.referenced_post_id,
        'is_approved': m.is_approved,
        'created_at': m.created_at.isoformat() if m.created_at else None,
    }


@app.route('/api/admin/guestbook/messages', methods=['GET'])
@jwt_required_admin
def admin_list_guestbook():
    """留言管理列表"""
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 20))))
    is_approved = request.args.get('is_approved')
    q = GuestMessage.query
    if is_approved == 'true':
        q = q.filter_by(is_approved=True)
    elif is_approved == 'false':
        q = q.filter_by(is_approved=False)
    total = q.count()
    rows = q.order_by(GuestMessage.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    items = [_message_to_dict(c) for c in rows]
    # 附关联文章标题
    post_ids = list({c['referenced_post_id'] for c in items if c['referenced_post_id']})
    posts_map = {}
    if post_ids:
        for p in Post.query.filter(Post.id.in_(post_ids)).all():
            posts_map[p.id] = {'id': p.id, 'title': p.title, 'slug': p.slug}
    for it in items:
        it['referenced_post'] = posts_map.get(it['referenced_post_id']) if it['referenced_post_id'] else None
    return jsonify({'success': True, 'data': {'items': items, 'total': total, 'page': page, 'per_page': per_page}})


@app.route('/api/admin/guestbook/messages/<int:msg_id>/approve', methods=['PUT'])
@jwt_required_admin
def admin_approve_guestbook(msg_id):
    m = GuestMessage.query.get_or_404(msg_id)
    try:
        m.is_approved = True
        db.session.commit()
        return jsonify({'success': True, 'message': '已通过'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/admin/guestbook/messages/<int:msg_id>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_guestbook(msg_id):
    m = GuestMessage.query.get_or_404(msg_id)
    try:
        db.session.delete(m)
        db.session.commit()
        return jsonify({'success': True, 'message': '已删除'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============== 相册（公开 + 管理） ==============
def _album_to_dict(a: Album, include_photos: bool = False) -> dict:
    data = {
        'id': a.id,
        'name': a.name,
        'slug': a.slug,
        'description': a.description,
        'cover_url': a.cover_url,
        'sort_order': a.sort_order,
        'created_at': a.created_at.isoformat() if a.created_at else None,
        'photo_count': Photo.query.filter_by(album_id=a.id).count(),
    }
    if include_photos:
        photos = Photo.query.filter_by(album_id=a.id).order_by(Photo.sort_order.asc(), Photo.id.asc()).all()
        data['photos'] = [{
            'id': p.id,
            'url': p.url,
            'thumbnail_url': p.thumbnail_url,
            'description': p.description,
            'taken_at': p.taken_at.isoformat() if p.taken_at else None,
            'sort_order': p.sort_order,
        } for p in photos]
    return data


def _photo_to_dict(p: Photo) -> dict:
    return {
        'id': p.id,
        'album_id': p.album_id,
        'url': p.url,
        'thumbnail_url': p.thumbnail_url,
        'description': p.description,
        'taken_at': p.taken_at.isoformat() if p.taken_at else None,
        'sort_order': p.sort_order,
        'created_at': p.created_at.isoformat() if p.created_at else None,
    }


@app.route('/api/albums', methods=['GET'])
def list_albums():
    """公开：相册列表（不含照片）"""
    rows = Album.query.order_by(Album.sort_order.asc(), Album.id.desc()).all()
    return json_response({'success': True, 'data': [_album_to_dict(a, include_photos=False) for a in rows]})


@app.route('/api/albums/daily', methods=['GET'])
def daily_album():
    """公开：每日精选相册"""
    rows = Album.query.all()
    if not rows:
        return json_response({'success': True, 'data': None})
    today = datetime.now(timezone.utc).date().isoformat()
    random.seed(today)
    selected = random.choice(rows)
    return json_response({'success': True, 'data': _album_to_dict(selected, include_photos=True)})


@app.route('/api/albums/<int:album_id>', methods=['GET'])
def get_album(album_id):
    """公开：相册详情（含照片）"""
    a = Album.query.get_or_404(album_id)
    return json_response({'success': True, 'data': _album_to_dict(a, include_photos=True)})


@app.route('/api/admin/albums', methods=['POST'])
@jwt_required_admin
def admin_create_album():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': '相册名称必填'}), 400
    slug = (data.get('slug') or '').strip() or _slugify(name)
    # 确保唯一
    base = slug
    i = 1
    while Album.query.filter_by(slug=slug).first() is not None:
        i += 1
        slug = f"{base}-{i}"
    a = Album(
        name=name[:120],
        slug=slug,
        description=(data.get('description') or '').strip() or None,
        cover_url=(data.get('cover_url') or '').strip() or None,
        sort_order=int(data.get('sort_order') or 0),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({'success': True, 'data': _album_to_dict(a)})


@app.route('/api/admin/albums/<int:album_id>', methods=['PUT'])
@jwt_required_admin
def admin_update_album(album_id):
    a = Album.query.get_or_404(album_id)
    data = request.get_json() or {}
    if 'name' in data:
        nm = (data.get('name') or '').strip()
        if not nm:
            return jsonify({'success': False, 'message': '相册名称不能为空'}), 400
        a.name = nm[:120]
    if 'description' in data:
        a.description = (data.get('description') or '').strip() or None
    if 'cover_url' in data:
        a.cover_url = (data.get('cover_url') or '').strip() or None
    if 'sort_order' in data:
        try:
            a.sort_order = int(data.get('sort_order') or 0)
        except (TypeError, ValueError):
            pass
    db.session.commit()
    return jsonify({'success': True, 'data': _album_to_dict(a)})


@app.route('/api/admin/albums/<int:album_id>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_album(album_id):
    a = Album.query.get_or_404(album_id)
    try:
        db.session.delete(a)  # 照片级联删除（ondelete=CASCADE）
        db.session.commit()
        return jsonify({'success': True, 'message': '已删除'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/admin/albums/<int:album_id>/photos', methods=['POST'])
@jwt_required_admin
def admin_add_photos(album_id):
    a = Album.query.get_or_404(album_id)
    data = request.get_json() or {}
    items = data.get('photos') if isinstance(data, dict) else data
    if not isinstance(items, list) or not items:
        return jsonify({'success': False, 'message': 'photos 必须是非空数组'}), 400
    created = []
    try:
        for it in items:
            url = (it.get('url') or '').strip()
            if not url:
                continue
            p = Photo(
                album_id=a.id,
                url=url[:500],
                thumbnail_url=(it.get('thumbnail_url') or '').strip() or None,
                description=(it.get('description') or '').strip() or None,
                sort_order=int(it.get('sort_order') or 0),
            )
            db.session.add(p)
            created.append(p)
        # 若相册没有封面，取第一张
        if not a.cover_url and created:
            a.cover_url = created[0].url
        db.session.commit()
        return jsonify({'success': True, 'data': [_photo_to_dict(p) for p in created]})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/admin/photos/<int:photo_id>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_photo(photo_id):
    p = Photo.query.get_or_404(photo_id)
    try:
        db.session.delete(p)
        db.session.commit()
        return jsonify({'success': True, 'message': '已删除'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============== 百宝箱 - 音乐/电影/友链 ==============
def _music_to_dict(m: MusicFavorite) -> dict:
    return {
        'id': m.id,
        'title': m.title,
        'artist': m.artist,
        'album': m.album,
        'cover_url': m.cover_url,
        'source_url': m.source_url,
        'description': m.description,
        'tags': m.tags or [],
        'sort_order': m.sort_order,
        'created_at': m.created_at.isoformat() if m.created_at else None,
    }


def _movie_to_dict(m: MovieFavorite) -> dict:
    return {
        'id': m.id,
        'title': m.title,
        'director': m.director,
        'year': m.year,
        'cover_url': m.cover_url,
        'source_url': m.source_url,
        'description': m.description,
        'rating': m.rating,
        'tags': m.tags or [],
        'sort_order': m.sort_order,
        'created_at': m.created_at.isoformat() if m.created_at else None,
    }


def _friend_to_dict(f: FriendLink) -> dict:
    return {
        'id': f.id,
        'name': f.name,
        'url': f.url,
        'logo_url': f.logo_url,
        'description': f.description,
        'email': f.email,
        'sort_order': f.sort_order,
        'is_featured': f.is_featured,
        'created_at': f.created_at.isoformat() if f.created_at else None,
    }


# --- 音乐 ---
@app.route('/api/music-favorites', methods=['GET'])
def list_music_favorites():
    rows = MusicFavorite.query.order_by(MusicFavorite.sort_order.asc(), MusicFavorite.id.desc()).all()
    return json_response({'success': True, 'data': [_music_to_dict(m) for m in rows]})


@app.route('/api/music-favorites/daily', methods=['GET'])
def daily_music_favorite():
    rows = MusicFavorite.query.all()
    if not rows:
        return json_response({'success': True, 'data': []})
    today = datetime.now(timezone.utc).date().isoformat()
    random.seed(today)
    shuffled = random.sample(rows, min(len(rows), 10))
    return json_response({'success': True, 'data': [_music_to_dict(m) for m in shuffled]})


@app.route('/api/admin/music-favorites', methods=['GET'])
@jwt_required_admin
def admin_list_music():
    rows = MusicFavorite.query.order_by(MusicFavorite.sort_order.asc(), MusicFavorite.id.desc()).all()
    return json_response({'success': True, 'data': [_music_to_dict(m) for m in rows]})


@app.route('/api/admin/music-favorites', methods=['POST'])
@jwt_required_admin
def admin_create_music():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    source_url = (data.get('source_url') or '').strip()
    if not title or not source_url:
        return jsonify({'success': False, 'message': '标题和音频源必填'}), 400
    m = MusicFavorite(
        title=title[:200],
        artist=(data.get('artist') or '').strip() or None,
        album=(data.get('album') or '').strip() or None,
        cover_url=(data.get('cover_url') or '').strip() or None,
        source_url=source_url[:500],
        description=(data.get('description') or '').strip() or None,
        tags=data.get('tags') or [],
        sort_order=int(data.get('sort_order') or 0),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'success': True, 'data': _music_to_dict(m)})


@app.route('/api/admin/music-favorites/<int:mid>', methods=['PUT'])
@jwt_required_admin
def admin_update_music(mid):
    m = MusicFavorite.query.get_or_404(mid)
    data = request.get_json() or {}
    for field in ['title', 'artist', 'album', 'cover_url', 'source_url', 'description']:
        if field in data:
            val = (data.get(field) or '').strip() or None
            if field == 'title' and not val:
                return jsonify({'success': False, 'message': '标题不能为空'}), 400
            if field == 'source_url' and not val:
                return jsonify({'success': False, 'message': '音频源不能为空'}), 400
            setattr(m, field, (val or '')[:500] if field in ('source_url', 'cover_url') else (val or '')[:200] if field == 'title' else val)
    if 'tags' in data:
        m.tags = data.get('tags') or []
    if 'sort_order' in data:
        try:
            m.sort_order = int(data.get('sort_order') or 0)
        except (TypeError, ValueError):
            pass
    db.session.commit()
    return jsonify({'success': True, 'data': _music_to_dict(m)})


@app.route('/api/admin/music-favorites/<int:mid>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_music(mid):
    m = MusicFavorite.query.get_or_404(mid)
    try:
        db.session.delete(m)
        db.session.commit()
        return jsonify({'success': True, 'message': '已删除'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# --- 电影 ---
@app.route('/api/movie-favorites', methods=['GET'])
def list_movie_favorites():
    rows = MovieFavorite.query.order_by(MovieFavorite.sort_order.asc(), MovieFavorite.id.desc()).all()
    return json_response({'success': True, 'data': [_movie_to_dict(m) for m in rows]})


@app.route('/api/movie-favorites/daily', methods=['GET'])
def daily_movie_favorite():
    rows = MovieFavorite.query.all()
    if not rows:
        return json_response({'success': True, 'data': None})
    today = datetime.now(timezone.utc).date().isoformat()
    random.seed(today)
    selected = random.choice(rows)
    return json_response({'success': True, 'data': _movie_to_dict(selected)})


@app.route('/api/admin/movie-favorites', methods=['POST'])
@jwt_required_admin
def admin_create_movie():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'success': False, 'message': '标题必填'}), 400
    m = MovieFavorite(
        title=title[:200],
        director=(data.get('director') or '').strip() or None,
        year=int(data['year']) if data.get('year') else None,
        cover_url=(data.get('cover_url') or '').strip() or None,
        source_url=(data.get('source_url') or '').strip() or None,
        description=(data.get('description') or '').strip() or None,
        rating=int(data['rating']) if data.get('rating') else None,
        tags=data.get('tags') or [],
        sort_order=int(data.get('sort_order') or 0),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'success': True, 'data': _movie_to_dict(m)})


@app.route('/api/admin/movie-favorites/<int:mid>', methods=['PUT'])
@jwt_required_admin
def admin_update_movie(mid):
    m = MovieFavorite.query.get_or_404(mid)
    data = request.get_json() or {}
    for field in ['title', 'director', 'cover_url', 'source_url', 'description']:
        if field in data:
            val = (data.get(field) or '').strip() or None
            if field == 'title' and not val:
                return jsonify({'success': False, 'message': '标题不能为空'}), 400
            if field in ('cover_url', 'source_url'):
                val = (val or '')[:500]
            setattr(m, field, val)
    if 'year' in data:
        try: m.year = int(data['year']) if data.get('year') else None
        except (TypeError, ValueError): pass
    if 'rating' in data:
        try: m.rating = int(data['rating']) if data.get('rating') else None
        except (TypeError, ValueError): pass
    if 'tags' in data:
        m.tags = data.get('tags') or []
    if 'sort_order' in data:
        try: m.sort_order = int(data.get('sort_order') or 0)
        except (TypeError, ValueError): pass
    db.session.commit()
    return jsonify({'success': True, 'data': _movie_to_dict(m)})


@app.route('/api/admin/movie-favorites/<int:mid>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_movie(mid):
    m = MovieFavorite.query.get_or_404(mid)
    try:
        db.session.delete(m)
        db.session.commit()
        return jsonify({'success': True, 'message': '已删除'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# --- 友链 ---
@app.route('/api/friend-links', methods=['GET'])
def list_friend_links():
    featured = request.args.get('featured')
    q = FriendLink.query
    if featured == 'true':
        q = q.filter_by(is_featured=True)
    elif featured == 'false':
        q = q.filter_by(is_featured=False)
    rows = q.order_by(FriendLink.is_featured.desc(), FriendLink.sort_order.asc(), FriendLink.id.desc()).all()
    return json_response({'success': True, 'data': [_friend_to_dict(f) for f in rows]})


@app.route('/api/friend-links/daily', methods=['GET'])
def daily_friend_link():
    rows = FriendLink.query.all()
    if not rows:
        return json_response({'success': True, 'data': None})
    today = datetime.now(timezone.utc).date().isoformat()
    random.seed(today)
    selected = random.choice(rows)
    return json_response({'success': True, 'data': _friend_to_dict(selected)})


@app.route('/api/admin/friend-links', methods=['POST'])
@jwt_required_admin
def admin_create_friend():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    url = (data.get('url') or '').strip()
    if not name or not url:
        return jsonify({'success': False, 'message': '名称和链接必填'}), 400
    f = FriendLink(
        name=name[:100],
        url=url[:500],
        logo_url=(data.get('logo_url') or '').strip() or None,
        description=(data.get('description') or '').strip() or None,
        email=(data.get('email') or '').strip() or None,
        sort_order=int(data.get('sort_order') or 0),
        is_featured=bool(data.get('is_featured')),
    )
    db.session.add(f)
    db.session.commit()
    return jsonify({'success': True, 'data': _friend_to_dict(f)})


@app.route('/api/admin/friend-links/<int:fid>', methods=['PUT'])
@jwt_required_admin
def admin_update_friend(fid):
    f = FriendLink.query.get_or_404(fid)
    data = request.get_json() or {}
    for field in ['name', 'url', 'logo_url', 'description', 'email']:
        if field in data:
            val = (data.get(field) or '').strip() or None
            if field in ('name',) and not val:
                return jsonify({'success': False, 'message': '名称不能为空'}), 400
            if field in ('url',) and not val:
                return jsonify({'success': False, 'message': '链接不能为空'}), 400
            setattr(f, field, val)
    if 'sort_order' in data:
        try: f.sort_order = int(data.get('sort_order') or 0)
        except (TypeError, ValueError): pass
    if 'is_featured' in data:
        f.is_featured = bool(data.get('is_featured'))
    db.session.commit()
    return jsonify({'success': True, 'data': _friend_to_dict(f)})


@app.route('/api/admin/friend-links/<int:fid>', methods=['DELETE'])
@jwt_required_admin
def admin_delete_friend(fid):
    f = FriendLink.query.get_or_404(fid)
    try:
        db.session.delete(f)
        db.session.commit()
        return jsonify({'success': True, 'message': '已删除'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


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


# --- 外部 API 代理 ---

# TMDb API 配置
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
TMDB_BEARER_TOKEN = os.environ.get('TMDB_BEARER_TOKEN', '')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

@app.route('/api/proxy/tmdb/movie/search', methods=['GET'])
def proxy_tmdb_search():
    q = request.args.get('q', '')
    page = request.args.get('page', '1')
    if not q:
        return jsonify({'success': False, 'message': '搜索关键词不能为空'}), 400
    if not TMDB_BEARER_TOKEN:
        return jsonify({'success': False, 'message': 'TMDb Bearer Token 未配置'}), 500
    
    url = f'{TMDB_BASE_URL}/search/movie?query={urllib.parse.quote(q)}&page={page}&language=zh-CN'
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0',
            'Authorization': f'Bearer {TMDB_BEARER_TOKEN}'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return json_response({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'无法连接到TMDb: {str(e)}'}), 500


@app.route('/api/proxy/tmdb/movie/popular', methods=['GET'])
def proxy_tmdb_popular():
    page = request.args.get('page', '1')
    if not TMDB_BEARER_TOKEN:
        return jsonify({'success': False, 'message': 'TMDb Bearer Token 未配置'}), 500
    
    url = f'{TMDB_BASE_URL}/movie/popular?page={page}&language=zh-CN'
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0',
            'Authorization': f'Bearer {TMDB_BEARER_TOKEN}'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return json_response({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'无法连接到TMDb: {str(e)}'}), 500


@app.route('/api/proxy/douban/movie/search', methods=['GET'])
def proxy_douban_search():
    q = request.args.get('q', '')
    count = request.args.get('count', '8')
    if not q:
        return jsonify({'success': False, 'message': '搜索关键词不能为空'}), 400
    
    urls = [
        f'https://api.douban.com/v2/movie/search?q={urllib.parse.quote(q)}&count={count}',
        f'https://douban.uieee.cn/v2/movie/search?q={urllib.parse.quote(q)}&count={count}'
    ]
    
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return json_response({'success': True, 'data': data})
        except Exception:
            continue
    
    return jsonify({'success': False, 'message': '无法连接到豆瓣电影'}), 500


@app.route('/api/proxy/douban/movie/hot', methods=['GET'])
def proxy_douban_hot():
    urls = [
        'https://api.douban.com/v2/movie/in_theaters',
        'https://douban.uieee.cn/v2/movie/in_theaters'
    ]
    
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return json_response({'success': True, 'data': data})
        except Exception:
            continue
    
    return jsonify({'success': False, 'message': '无法连接到豆瓣电影'}), 500


@app.route('/api/proxy/netease/music/search', methods=['GET'])
def proxy_netease_search():
    q = request.args.get('q', '')
    limit = request.args.get('limit', '6')
    if not q:
        return jsonify({'success': False, 'message': '搜索关键词不能为空'}), 400
    
    url = f'https://api.imjad.cn/cloudmusic/?type=search&s={urllib.parse.quote(q)}&limit={limit}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return json_response({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'无法连接到网易云音乐: {str(e)}'}), 500


@app.route('/api/proxy/netease/music/hot', methods=['GET'])
def proxy_netease_hot():
    url = 'https://api.imjad.cn/cloudmusic/?type=playlist&id=3778678'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return json_response({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'message': f'无法连接到网易云音乐: {str(e)}'}), 500


def _music_request(url: str) -> tuple:
    import ssl
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://music.163.com/',
                'Origin': 'https://music.163.com',
                'Accept': 'application/json',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        )
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return True, data
    except urllib.error.HTTPError as e:
        return False, f'HTTP Error {e.code}: {e.reason}'
    except urllib.error.URLError as e:
        return False, f'URL Error: {str(e.reason)}'
    except Exception as e:
        return False, f'Unknown Error: {str(e)}'


@app.route('/api/proxy/music/search', methods=['GET'])
def proxy_music_search():
    keywords = request.args.get('keywords', '')
    platform = request.args.get('platform', 'netease')
    limit = request.args.get('limit', '10')
    if not keywords:
        return jsonify({'success': False, 'message': '搜索关键词不能为空'}), 400

    if platform == 'netease':
        url = f'https://music.163.com/api/search/get/web?csrf_token=&hlpretag=&hlposttag=&s={urllib.parse.quote(keywords)}&type=1&offset=0&total=true&limit={limit}'
        success, data = _music_request(url)
        if success:
            result = {
                'result': {
                    'songs': data.get('result', {}).get('songs', [])
                }
            }
            return json_response({'success': True, 'data': result})
        return jsonify({'success': False, 'message': f'搜索失败: {data}'}), 500
    else:
        return jsonify({'success': False, 'message': '暂不支持该平台'}), 400


@app.route('/api/proxy/music/song/detail', methods=['GET'])
def proxy_music_song_detail():
    ids = request.args.get('ids', '')
    platform = request.args.get('platform', 'netease')
    if not ids:
        return jsonify({'success': False, 'message': '歌曲ID不能为空'}), 400

    if platform == 'netease':
        url = f'https://music.163.com/api/song/detail/?id={ids}&ids=[{ids}]'
        success, data = _music_request(url)
        if success:
            return json_response({'success': True, 'data': data})
        return jsonify({'success': False, 'message': f'获取歌曲详情失败: {data}'}), 500
    else:
        return jsonify({'success': False, 'message': '暂不支持该平台'}), 400


@app.route('/api/proxy/music/toplist', methods=['GET'])
def proxy_music_toplist():
    platform = request.args.get('platform', 'netease')
    if platform == 'netease':
        url = 'https://music.163.com/api/playlist/detail?id=3779629'
        success, data = _music_request(url)
        if success:
            return json_response({'success': True, 'data': data})
        return jsonify({'success': False, 'message': f'获取榜单失败: {data}'}), 500
    else:
        return jsonify({'success': False, 'message': '暂不支持该平台'}), 400


@app.route('/api/proxy/music/url', methods=['GET'])
def proxy_music_url():
    id = request.args.get('id', '')
    platform = request.args.get('platform', 'netease')
    br = request.args.get('br', '320000')
    if not id:
        return jsonify({'success': False, 'message': '歌曲ID不能为空'}), 400

    if platform == 'netease':
        url = f'https://music.163.com/api/song/enhance/player/url?csrf_token=&ids=[{id}]&br={br}'
        success, data = _music_request(url)
        if success:
            return json_response({'success': True, 'data': data})
        return jsonify({'success': False, 'message': f'获取播放链接失败: {data}'}), 500
    else:
        return jsonify({'success': False, 'message': '暂不支持该平台'}), 400


@app.route('/api/proxy/music/playlist', methods=['GET'])
def proxy_music_playlist():
    id = request.args.get('id', '')
    platform = request.args.get('platform', 'netease')
    if not id:
        return jsonify({'success': False, 'message': '歌单ID不能为空'}), 400

    if platform == 'netease':
        url = f'https://music.163.com/api/playlist/detail?id={id}'
        success, data = _music_request(url)
        if success:
            return json_response({'success': True, 'data': data})
        return jsonify({'success': False, 'message': f'获取歌单失败: {data}'}), 500
    else:
        return jsonify({'success': False, 'message': '暂不支持该平台'}), 400


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
        db_name_result = db.session.execute(text('SELECT DATABASE()'))
        db_name = list(db_name_result.fetchone() or [''])[0]
        if not db_name:
            return
        db.session.execute(text(f"ALTER DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        tables_result = db.session.execute(text('SHOW TABLES'))
        tables = [list(row)[0] for row in tables_result]
        for table in tables:
            try:
                db.session.execute(text(f"ALTER TABLE `{table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
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
        'site_notice_markdown': 'TEXT',
        'site_title': 'VARCHAR(200)',
        'site_subtitle': 'VARCHAR(500)'
    }

    try:
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if 'mysql' in uri:
            try:
                db_name_result = db.session.execute(text('SELECT DATABASE()'))
                db_name = list(db_name_result.fetchone() or [''])[0]
                if not db_name:
                    return
                existing_result = db.session.execute(
                    text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = 'profiles'"),
                    {'db': db_name}
                )
                existing = {list(row)[0] for row in existing_result}
                for col, col_type in required_columns.items():
                    if col in existing:
                        continue
                    db.session.execute(text(f"ALTER TABLE `profiles` ADD COLUMN `{col}` {col_type}"))
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

    if uses_sqlalchemy_queries():
        # SQLAlchemy 路径：用 with_entities 限制只取列表所需 12 个字段，避免加载 content
        query = query.with_entities(
            Post.id, Post.title, Post.slug, Post.excerpt, Post.category, Post.tags,
            Post.cover_url, Post.read_time, Post.views, Post.likes,
            Post.published_at, Post.created_at
        )
        posts = query.order_by(Post.published_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        items = [_build_post_summary_item(r) for r in posts.items]
        return json_response({
            'success': True,
            'data': {
                'items': items,
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

        # 分页查询：仅 SELECT 列表所需 12 字段，不加载 content
        offset = (page - 1) * per_page
        query_sql = f"""
            SELECT id, title, slug, excerpt, category, tags, cover_url, read_time,
                   views, likes, published_at, created_at
            FROM posts
            WHERE {where_clause}
            ORDER BY published_at DESC, created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, params + [per_page, offset])
        posts = cursor.fetchall()

        # 构建响应数据
        items = [_build_post_summary_item(post) for post in posts]

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
        }, cache_control='public, max-age=60, stale-while-revalidate=300')
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
        }, cache_control='public, max-age=60, stale-while-revalidate=300')

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


@app.route('/api/tags/published', methods=['GET'])
def get_published_tags():
    """获取已发布文章的标签列表（带文章数量），优先使用 SQL 原生聚合"""
    if uses_sqlalchemy_queries():
        # SQLAlchemy 路径（MySQL/PostgreSQL）：优先用 text() 执行 JSON_TABLE，失败回退 Python 聚合
        tag_counts = {}
        try:
            if 'mysql' in db_uri:
                # MySQL 8+: JSON_TABLE 拆分 tags JSON 数组后 GROUP BY
                sql = text(
                    "SELECT jt.tag AS tag, COUNT(*) AS cnt "
                    "FROM posts, JSON_TABLE(posts.tags, '$[*]' "
                    "  COLUMNS (tag VARCHAR(100) PATH '$')) AS jt "
                    "WHERE posts.status = 'published' AND posts.tags IS NOT NULL "
                    "GROUP BY jt.tag "
                    "ORDER BY cnt DESC"
                )
                rows = db.session.execute(sql).fetchall()
            else:
                # PostgreSQL 等其他：fallback 到 Python 聚合（暂无 JSON_TABLE 通用方案）
                raise RuntimeError('JSON_TABLE not supported on this dialect')
            for row in rows:
                tag_counts[row.tag] = int(row.cnt)
        except Exception as e:
            app.logger.warning(f"SQL tag aggregation failed, falling back to Python: {e}")
            # Fallback: 加载已发布文章的 tags 字段后在 Python 聚合
            rows = Post.query.with_entities(Post.tags).filter(
                Post.status == 'published',
                Post.tags.isnot(None)
            ).all()
            for row in rows:
                tags_value = row[0] or []
                if isinstance(tags_value, str):
                    try:
                        tags_value = json.loads(tags_value)
                    except Exception:
                        tags_value = []
                for tag in (tags_value or []):
                    tag_counts[str(tag)] = tag_counts.get(str(tag), 0) + 1

        tags_with_count = [{'name': tag, 'count': count} for tag, count in tag_counts.items()]
        return json_response({
            'success': True,
            'data': sorted(tags_with_count, key=lambda x: x['count'], reverse=True)
        }, cache_control='public, max-age=60, stale-while-revalidate=300')

    """获取已发布文章的标签列表（带文章数量）"""
    # 直接 SQLite 路径：使用 SQLite 原生 json_each 完成拆分 + 聚合
    import sqlite3
    import os

    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # SQLite 3.38+ 内置 json_each，单条 SQL 完成 tag 拆分 + GROUP BY + COUNT
        cursor.execute(
            "SELECT j.value AS tag, COUNT(*) AS cnt "
            "FROM posts, json_each(posts.tags) j "
            "WHERE posts.status = 'published' AND posts.tags IS NOT NULL "
            "GROUP BY j.value "
            "ORDER BY cnt DESC"
        )
        tag_rows = cursor.fetchall()

        # 当 json_each 不可用（极老 SQLite < 3.38）时回退到 Python 聚合
        if not tag_rows:
            cursor.execute("SELECT tags FROM posts WHERE status = 'published' AND tags IS NOT NULL AND tags != ''")
            posts_with_tags = cursor.fetchall()
            tag_counts = {}
            for post in posts_with_tags:
                tags_str = post[0]
                if tags_str:
                    try:
                        tags_list = json.loads(tags_str)
                        for tag in (tags_list or []):
                            tag_counts[str(tag)] = tag_counts.get(str(tag), 0) + 1
                    except Exception:
                        continue
            tags_with_count = [{'name': tag, 'count': count} for tag, count in tag_counts.items()]
        else:
            tags_with_count = [{'name': row[0], 'count': int(row[1])} for row in tag_rows]

        return json_response({
            'success': True,
            'data': sorted(tags_with_count, key=lambda x: x['count'], reverse=True)
        }, cache_control='public, max-age=60, stale-while-revalidate=300')

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
            'site_title': '霜雪旧曾谙的世界',
            'site_subtitle': '这里记录着我的技术分享、生活感悟和对世界的思考',
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
        'site_title': getattr(profile, 'site_title', '') or '',
        'site_subtitle': getattr(profile, 'site_subtitle', '') or '',
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
        'site_title',
        'site_subtitle',
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
    """记录阅读（公开接口）：主请求立即返回 202，写库推到线程池异步执行"""
    # 主线程不查 DB、不 commit，立即入队后台任务
    try:
        _view_executor.submit(_async_increment_view, post_id)
    except Exception as e:
        app.logger.error(f"Failed to submit view task: {e}")
    return json_response({
        'success': True,
        'data': {
            'views': 'pending'
        }
    }, status_code=202)


# 留言 XSS 过滤
import re as _re
_SCRIPT_RE = _re.compile(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', _re.IGNORECASE | _re.DOTALL)
_HTML_TAG_RE = _re.compile(r'<[^>]+>')
def _sanitize_message(text: str) -> str:
    if not text:
        return ''
    t = _SCRIPT_RE.sub('', text)
    t = _HTML_TAG_RE.sub('', t)
    return t.strip()


# 留言频率限制（内存版，单实例生效；多实例需要 Redis 替换）
_guest_rate = {}
def _check_guest_rate(ip_hash: str, window_sec: int = 60, limit: int = 2) -> bool:
    import time
    now = time.time()
    arr = _guest_rate.get(ip_hash, [])
    arr = [t for t in arr if now - t < window_sec]
    if len(arr) >= limit:
        _guest_rate[ip_hash] = arr
        return False
    arr.append(now)
    _guest_rate[ip_hash] = arr
    return True


# ============== 留言板（公开） ==============
@app.route('/api/guestbook/messages', methods=['GET'])
def list_guestbook():
    """公开：获取已审核留言（分页）"""
    page = max(1, int(request.args.get('page', 1)))
    per_page = min(100, max(1, int(request.args.get('per_page', 20))))
    q = GuestMessage.query.filter_by(is_approved=True)
    total = q.count()
    rows = q.order_by(GuestMessage.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    items = [_message_to_dict(c) for c in rows]
    # 附关联文章
    post_ids = list({it['referenced_post_id'] for it in items if it['referenced_post_id']})
    posts_map = {}
    if post_ids:
        for p in Post.query.filter(Post.id.in_(post_ids)).all():
            posts_map[p.id] = {'id': p.id, 'title': p.title, 'slug': p.slug}
    for it in items:
        it['referenced_post'] = posts_map.get(it['referenced_post_id']) if it['referenced_post_id'] else None
    return json_response({'success': True, 'data': {'items': items, 'total': total, 'page': page, 'per_page': per_page}})


@app.route('/api/guestbook/messages', methods=['POST'])
def create_guestbook():
    """公开：提交留言，默认待审核"""
    data = request.get_json() or {}
    author_name = (data.get('author_name') or '').strip()
    author_email = (data.get('author_email') or '').strip() or None
    content_raw = data.get('content') or ''
    content = _sanitize_message(str(content_raw)).strip()
    referenced_post_id = data.get('referenced_post_id')

    if not author_name or len(author_name) > 32:
        return json_response({'success': False, 'message': '昵称必填且不超过 32 字符'}, 400)
    if not content or len(content) > 1000:
        return json_response({'success': False, 'message': '留言内容必填且不超过 1000 字符'}, 400)
    if author_email and len(author_email) > 120:
        return json_response({'success': False, 'message': '邮箱过长'}, 400)
    if referenced_post_id:
        try:
            referenced_post_id = int(referenced_post_id)
            post = Post.query.get(referenced_post_id)
            if not post or post.status != 'published':
                referenced_post_id = None
        except (TypeError, ValueError):
            referenced_post_id = None

    ip = _get_client_ip()
    ip_hash = _hash_ip(ip)
    if not _check_guest_rate(ip_hash):
        return json_response({'success': False, 'message': '留言过于频繁，请稍后再试'}, 429)

    try:
        m = GuestMessage(
            author_name=author_name[:32],
            author_email=author_email,
            content=content[:1000],
            referenced_post_id=referenced_post_id,
            ip_hash=ip_hash,
            user_agent=(request.headers.get('User-Agent') or '')[:500],
            is_approved=False,
        )
        db.session.add(m)
        db.session.commit()
        return json_response({'success': True, 'message': '留言提交成功，等待审核后显示', 'data': {'id': m.id}})
    except Exception as e:
        db.session.rollback()
        return json_response({'success': False, 'message': str(e)}, 500)


@app.route('/api/guestbook/posts-for-mention', methods=['GET'])
def guestbook_posts_for_mention():
    """公开：返回已发布文章列表（供留言@下拉用）"""
    rows = (Post.query
            .filter_by(status='published')
            .with_entities(Post.id, Post.title, Post.slug)
            .order_by(Post.published_at.desc())
            .limit(200)
            .all())
    return json_response({'success': True, 'data': [
        {'id': pid, 'title': title, 'slug': slug} for (pid, title, slug) in rows
    ]})


# 健康检查
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()})

# 兼容前端期望的 /api/health
@app.route('/api/health', methods=['GET'])
def health_check_api():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now(timezone.utc).isoformat()})

@app.route('/api/init-db', methods=['POST'])
def init_db():
    """初始化数据库表结构，仅在首次部署时调用一次"""
    try:
        bootstrap()
        return jsonify({'status': 'success', 'message': '数据库初始化完成'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/debug')
def debug_info():
    import os
    info = {
        'request_path': request.path,
        'request_url': request.url,
        'request_method': request.method,
        'all_routes': sorted([str(r) for r in app.url_map.iter_rules() if '/api/admin' in str(r) or '/api/auth' in str(r) or '/api/posts' in str(r)][:20]),
        'cwd': os.getcwd(),
        'frontend_dist': _frontend_dist,
        'frontend_dist_exists': os.path.isdir(_frontend_dist),
        'database_url_set': bool(app.config.get('SQLALCHEMY_DATABASE_URI', '').strip()),
        'db_initialized': _db_initialized,
    }
    return jsonify(info)

# 前端静态文件服务
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    from flask import send_from_directory
    assets_dir = os.path.join(_frontend_dist, 'assets')
    resp = send_from_directory(assets_dir, filename)
    resp.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    return resp


@app.route('/js/<path:filename>')
def serve_js(filename):
    from flask import send_from_directory
    js_dir = os.path.join(_frontend_dist, 'js')
    resp = send_from_directory(js_dir, filename)
    resp.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    return resp


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    from flask import send_from_directory
    if path.startswith('api/') or path.startswith('uploads/'):
        return jsonify({'error': 'Not found', 'message': '请求的资源不存在'}), 404
    full_path = os.path.join(_frontend_dist, path)
    if path and os.path.isfile(full_path):
        return send_from_directory(_frontend_dist, path)
    index_path = os.path.join(_frontend_dist, 'index.html')
    if os.path.isfile(index_path):
        return send_from_directory(_frontend_dist, 'index.html')
    return jsonify({'error': 'Frontend not built', 'message': '前端文件未构建'}), 500


# 错误处理
@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Not found', 'message': '请求的资源不存在'}), 404
    return serve_frontend(request.path.lstrip('/'))

@app.errorhandler(500)
def internal_error(error):
    try:
        app.logger.exception(error)
    except Exception:
        pass
    return jsonify({'error': 'Internal server error', 'message': '服务器内部错误'}), 500

@app.errorhandler(Exception)
def handle_exception(error):
    import traceback
    tb = traceback.format_exc()
    print('=== HANDLE EXCEPTION ===', flush=True)
    print(tb, flush=True)
    try:
        with open('e:/train/personal-blog/backend/error.log', 'a', encoding='utf-8') as f:
            f.write(tb + '\n---\n')
    except Exception:
        pass
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
def json_response(data, status_code=200, cache_control=None):
    """返回正确编码的JSON响应，支持可选缓存头"""
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    if cache_control:
        response.headers['Cache-Control'] = cache_control
    return response, status_code

if __name__ == '__main__':
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

if __name__ == '__main__':
    bootstrap()
    app.run(debug=False, host='0.0.0.0', port=5000)
elif os.environ.get('VERCEL'):
    # Vercel 环境下延迟初始化，避免冷启动超时
    pass
else:
    bootstrap()
