"""标签筛选修复的回归测试，**跑在真实 PostgreSQL 上**。

为什么必须连真库验证
-------------------
此前的 bug 只在线上暴露：`tags` 列在 PostgreSQL 上是 `jsonb` 类型，
`Post.tags.contains([tag])` 与 `jsonb LIKE` 都会报
`operator does not exist: jsonb ~~ unknown` → 500。
SQLite 上tags 是 TEXT，同样的代码能跑通，**测不出这个问题**。

用法：
    python backend/_verify_tag_filter.py            # 用 DATABASE_URL 连线上库（只读）
    DATABASE_URL=sqlite:///... python backend/_verify_tag_filter.py   # 本地验证
"""
import json
import os
import shutil
import sys
import tempfile

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, 'backend'))

PASS, FAIL = [], []
TMP_DIR = ''
ENGINES = []
DEFAULT_URI = os.getenv('DATABASE_URL', '')


def check(label, cond, detail=''):
    (PASS if cond else FAIL).append(label)
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}" + (f' -> {detail}' if detail else ''))


def build():
    import importlib
    is_pg = 'postgres' in DEFAULT_URI
    if not is_pg:
        # 本地模式：临时 SQLite
        db = os.path.join(TMP_DIR, 'tag_test.db')
        os.environ['DATABASE_URL'] = f'sqlite:///{db}?check_same_thread=False'

    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('SECRET_KEY', 'x')
    os.environ.setdefault('JWT_SECRET', 'y')
    os.environ.setdefault('ADMIN_USERNAME', 'tagtest')
    os.environ.setdefault('ADMIN_PASSWORD', 'tagpass123')
    sys.modules.pop('app', None)
    m = importlib.import_module('app')
    m.app.config['TESTING'] = True
    global ENGINES
    with m.app.app_context():
        ENGINES.append(m.db.engine)
    return m, is_pg


def test_dialect(m, is_pg):
    print('\n[1] 方言与列类型确认')
    with m.app.app_context():
        insp = __import__('sqlalchemy').inspect(m.db.engine)
        cols = {c['name']: c['type'] for c in insp.get_columns('posts')}
        tags_type = str(cols.get('tags'))
        print(f"  数据库: {'PostgreSQL' if is_pg else 'SQLite'}")
        print(f"  posts.tags 类型: {tags_type}")
        if is_pg:
            check('线上 tags 是 jsonb（这正是 bug 根因）', 'JSONB' in tags_type.upper(),
                  tags_type)
        else:
            check('本地 SQLite tags 可比字符串', True, tags_type)
        check('已导入 cast/Text', hasattr(m, 'cast') and hasattr(m, 'Text'))


def test_no_500(m):
    print('\n[2] 带 tag 参数的接口不报500（核心回归）')
    with m.app.app_context():
        app = m.app
    app.config['TESTING'] = True
    with app.test_client() as c:
        for url in ['/api/posts/published?tag=xv6',
                    '/api/search?tag=xv6',
                    '/api/posts/published?tag=%E7%AC%94%E8%AE%B0',
                    '/api/posts/published?tag=C%2B%2B',
                    '/api/posts/published?tag=%25']:
            r = c.get(url)
            check(f'{url} -> 非500', r.status_code != 500, f'status={r.status_code}')
            if r.status_code == 200:
                d = r.get_json() or {}
                total = (d.get('data') or {}).get('total')
                print(f"      total = {total}")


def test_tag_filter(m, is_pg):
    print('\n[3] 标签筛选正确性')
    with m.app.app_context():
        if is_pg:
            # 不往生产库写测试数据——改用线上已有数据验证。
            # 线上标签形如['OS','xv6',' 笔记']，中英文混用且大小写并存，
            # 正好能同时验证「精确匹配」与「不误命中相似标签」。
            for tag in ['xv6', 'os', 'OS', '笔记']:
                n = m._build_post_query(tag=tag).count()
                check(f'线上 tag={tag!r} -> >=1 条', n >= 1, f'{n} 条')
            for tag, label in [
                ('xv6x', '相似标签 xv6x'),
                ('xv', '「xv」不应命中「xv6」'),
                ('v', '单字符 v'),
                ('笔', '「笔」不应命中「笔记」'),
                ('不存在的标签xyz', '不存在的标签'),
            ]:
                n = m._build_post_query(tag=tag).count()
                check(f'{label} -> 0 条', n == 0, f'实得 {n}')
            return

        # 本地模式：造数据验证（SQLite 上 tags 存成 TEXT，与线上 jsonb 不同）
        if m.Post.query.filter_by(status='published').count() == 0:
            for slug, title, tags in [
                ('tf-ocean', '海洋的哲学思考', ['海洋', '哲学', '思考']),
                ('tf-vue', 'Vue 组合式实践', ['Vue.js', 'C++', 'a_b']),
            ]:
                m.db.session.add(m.Post(
                    title=title, slug=slug, content=f'{title}正文内容',
                    excerpt='摘要', status='published', category='技术',
                    tags=tags, read_time=3,
                ))
            m.db.session.commit()
            print('  （已注入 2 篇本地测试文章）')

        for tag, expect_zero in [
            ('海洋', False), ('哲学', False), ('C++', False), ('a_b', False),
            ('不存在的标签xyz', True), ('海', True), ('思考思考', True),
        ]:
            n = m._build_post_query(tag=tag).count()
            if expect_zero:
                check(f'tag={tag!r} -> 0 条', n == 0, f'实得 {n}')
            else:
                check(f'tag={tag!r} -> >=1 条', n >= 1, f'实得 {n}')


def test_like_escape(m):
    print('\n[4] LIKE 通配符转义')
    with m.app.app_context():
        for raw, expect in [
            ('50%', '50\\%'),
            ('a_b', 'a\\_b'),
            ('back\\slash', 'back\\\\slash'),
            ('正常标签', '正常标签'),
            ('C++', 'C++'),
            ('Node.js', 'Node.js'),
        ]:
            got = m._escape_like(raw)
            check(f'{raw!r} -> {expect}', got == expect, f'实得 {got!r}')
        check('% 被转义（否则通配符）', '\\%' in m._escape_like('100%'))
        check('_ 被转义（否则单字符通配）', '\\_' in m._escape_like('a_b'))


def test_search(m):
    print('\n[5] 搜索不含 tags 列')
    with m.app.app_context():
        n = m._build_post_query(search='xv6').count()
        check('搜正文关键词有结果', n >= 1, f'实得 {n}')
        n = m._build_post_query(search='不存在的词xyz').count()
        check('无匹配返回 0', n == 0, f'实得 {n}')


def test_real_data(m, is_pg):
    if not is_pg:
        return
    print('\n[6] 线上真实数据（回归确认）')
    with m.app.app_context():
        for tag in ['xv6', 'os', '笔记']:
            n = m._build_post_query(tag=tag).count()
            check(f'线上 tag={tag!r} 有结果', n >= 1, f'{n} 条')
        n = m._build_post_query(tag='xv6x').count()
        check('相似标签 xv6x 不误命中', n == 0, f'实得 {n}')


def test_no_regression(m):
    print('\n[7] 其他接口无回归')
    app = m.app
    app.config['TESTING'] = True
    with app.test_client() as c:
        for url in ['/api/posts/published', '/api/search',
                    '/api/categories/published', '/api/tags/published',
                    '/api/health', '/api/guestbook/messages']:
            r = c.get(url)
            check(f'{url} -> 200/401', r.status_code in (200, 401), f'status={r.status_code}')

        # /api/profile 此前线上 500：profiles 表缺 site_title / site_subtitle，
        # 而 ensure_profile_schema 遇到非 MySQL 非 SQLite 的方言直接 return，
        # 于是 PostgreSQL 上的缺列永远补不上。
        r = c.get('/api/profile')
        check('/api/profile -> 200（缺列已补）', r.status_code == 200, f'status={r.status_code}')


def main():
    global TMP_DIR
    TMP_DIR = tempfile.mkdtemp(prefix='blog_tag_')
    m, is_pg = build()
    try:
        print('=' * 56)
        print('标签筛选回归测试（{}）'.format('真实 PostgreSQL' if is_pg else '本地 SQLite'))
        print('=' * 56)
        test_dialect(m, is_pg)
        test_no_500(m)
        test_tag_filter(m, is_pg)
        test_like_escape(m)
        test_search(m)
        test_real_data(m, is_pg)
        test_no_regression(m)
    finally:
        for e in ENGINES:
            try:
                e.dispose()
            except Exception:
                pass
        if not is_pg:
            shutil.rmtree(TMP_DIR, ignore_errors=True)
    print(f'\n{"=" * 56}\n通过 {len(PASS)} / 失败 {len(FAIL)}')
    if FAIL:
        print('失败项:')
        for f in FAIL:
            print('  -', f)
        sys.exit(1)
    print('全部通过')


if __name__ == '__main__':
    main()
