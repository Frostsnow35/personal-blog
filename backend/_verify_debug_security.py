"""诊断端点鉴权与脱敏的安全回归测试。

背景
----
`/api/debug/db` 曾公开返回完整的 `DATABASE_URL`，其中含数据库明文密码。
任何访问者只要请求一次该端点，即获得生产数据库的完整访问权限。
本次修复做了两层防护：

  1. 三个诊断端点（debug / debug/db / init-db）都要求管理员 JWT
  2. 即便鉴权通过，`_mask_db_uri` 也会去掉用户名与密码

本测试同时验证「未鉴权时 401」与「鉴权后仍看不到密码」——
第二点比第一点更重要：光加鉴权不够，万一将来token 泄露，
连接串本身也不该再成为可用凭据。

用法：
    python backend/_verify_debug_security.py
"""
import os
import shutil
import sys
import tempfile

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, 'backend'))

PASS, FAIL = [], []
TMP_DIR = ''
ENGINES = []


def check(label, cond, detail=''):
    (PASS if cond else FAIL).append(label)
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}" + (f' -> {detail}' if detail else ''))


def build():
    import importlib
    # 若外部已提供 DATABASE_URL（如线上 PostgreSQL），直接沿用，
    # 不覆盖——覆盖成 SQLite 会让「无回归」那组用例失去意义
    # （项目里SQLite 与非 SQLite 走的是两套查询路径）。
    if not os.getenv('DATABASE_URL'):
        db = os.path.join(TMP_DIR, 'sec_test.db')
        os.environ['DATABASE_URL'] = f'sqlite:///{db}?check_same_thread=False'
    os.environ['FLASK_ENV'] = 'development'
    os.environ['SECRET_KEY'] = 'x'
    os.environ['JWT_SECRET'] = 'y'
    os.environ['ADMIN_USERNAME'] = 'sectest'
    os.environ['ADMIN_PASSWORD'] = 'secpass123'
    sys.modules.pop('app', None)
    m = importlib.import_module('app')
    m.app.config['TESTING'] = True
    global ENGINES
    with m.app.app_context():
        ENGINES.append(m.db.engine)
    return m


def admin_headers(m, client):
    r = client.post('/api/auth/login',
                    json={'username': 'sectest', 'password': 'secpass123'})
    token = (r.get_json() or {}).get('access_token')
    return {'Authorization': f'Bearer {token}'} if token else {}


def test_mask():
    print('\n[1] _mask_db_uri 脱敏函数')
    m = build()
    cases = [
        ('postgresql://postgres.abc123:SecretPwd%21@aws-0-x.pooler.supabase.com:6543/postgres?sslmode=require',
         ['不应含 SecretPwd', '不应含 postgres.abc123'], ['pooler.supabase.com', 'postgres']),
        ('mysql://root:pass@127.0.0.1:3306/blog', ['不应含 pass', '不应含 root'], ['127.0.0.1', 'blog']),
        ('sqlite:///./personal_blog.db', [], ['personal_blog.db']),
        ('', [], []),
    ]
    for uri, forbidden, expected in cases:
        masked = m._mask_db_uri(uri)
        ok = all(f not in masked for f in forbidden) and all(e in masked for e in expected)
        check(f'{uri[:46] or "(空)"} -> {masked[:56]}', ok, masked)

    # 解析失败时不能回显原文
    check('畸形输入不泄露原文', 'SecretPwd' not in m._mask_db_uri('not a url SecretPwd'))


def test_requires_auth(m):
    print('\n[2] 未鉴权时拒绝访问（关键）')
    app = m.app
    app.config['TESTING'] = True
    with app.test_client() as c:
        for method, url in [('get', '/api/debug/db'),
                            ('get', '/api/debug'),
                            ('post', '/api/init-db')]:
            r = getattr(c, method)(url)
            check(f'{method.upper()} {url} -> 401', r.status_code == 401, f'status={r.status_code}')
            body = r.get_data(as_text=True)
            check(f'  {url} 响应体不含密码', 'SecretPwd' not in body and 'postgresql://' not in body,
                  body[:60])

        # 无 token / 坏 token 都应被拒
        r = c.get('/api/debug/db', headers={'Authorization': 'Bearer garbage'})
        check('无效 token -> 401', r.status_code == 401, f'status={r.status_code}')


def test_auth_response_masked(m):
    print('\n[3] 鉴权通过后仍不泄露密码')
    app = m.app
    app.config['TESTING'] = True
    with app.test_client() as c:
        H = admin_headers(m, c)
        check('管理员可登录', bool(H))
        if not H:
            return

        r = c.get('/api/debug/db', headers=H)
        check('/api/debug/db -> 200', r.status_code == 200, f'status={r.status_code}')
        d = r.get_json() or {}
        uri = d.get('db_uri', '')
        print(f"      db_uri = {uri}")
        check('db_uri 已脱敏（不含密码）',
              'sectest' not in uri and 'secpass' not in uri
              and 'BlogAdmin' not in uri, uri)
        # 至少要留下「连的是哪个库」这一信息，否则排障端点就废了
        check('仍能看出连的是哪个库',
              ('sec_test' in uri) if 'sqlite' in uri else ('supabase' in uri or 'postgres' in uri),
              uri)
        check('返回表列表（排障仍可用）', isinstance(d.get('tables'), list))
        check('vercel_env 转为布尔', isinstance(d.get('vercel_env'), bool),
              f'实得 {d.get("vercel_env")!r}')

        r = c.get('/api/debug', headers=H)
        check('/api/debug -> 200', r.status_code == 200)
        d = r.get_json() or {}
        check('不再返回 cwd', 'cwd' not in d, str(sorted(d.keys())))
        check('不再返回路由清单', 'all_routes' not in d, str(sorted(d.keys())))
        check('仍返回数据库是否配置', 'database_url_set' in d)

        # 全响应体扫描一遍，确保没有意外泄露
        for url in ['/api/debug/db', '/api/debug']:
            body = c.get(url, headers=H).get_data(as_text=True)
            bad = [s for s in ('secpass', 'sectest', 'BlogAdmin') if s in body]
            check(f'{url} 响应体无凭据残留', not bad, f'泄露: {bad}' if bad else '')


def test_init_db_admin(m):
    print('\n[4] /api/init-db 鉴权后可用')
    app = m.app
    app.config['TESTING'] = True
    with app.test_client() as c:
        H = admin_headers(m, c)
        r = c.post('/api/init-db', headers=H)
        check('管理员可触发', r.status_code == 200, f'status={r.status_code}')


def test_no_regression(m):
    print('\n[5] 公开端点不受影响')
    # 建表：这几个接口在 SQLite 下走原生 SQL 路径，直接连
    # backend/personal_blog.db（该文件已被 .gitignore 忽略、不存在），
    # 故会报 no such table。那是测试环境问题，不是回归。
    with m.app.app_context():
        m.db.create_all()
    app = m.app
    app.config['TESTING'] = True
    with app.test_client() as c:
        for url in ['/api/health', '/health', '/api/posts/published',
                    '/api/tags/published', '/api/search']:
            r = c.get(url)
            check(f'{url} -> 200', r.status_code == 200, f'status={r.status_code}')


def main():
    global TMP_DIR
    TMP_DIR = tempfile.mkdtemp(prefix='blog_sec_')
    m = build()
    try:
        test_mask()
        test_requires_auth(m)
        test_auth_response_masked(m)
        test_init_db_admin(m)
        test_no_regression(m)
    finally:
        for e in ENGINES:
            try:
                e.dispose()
            except Exception:
                pass
        shutil.rmtree(TMP_DIR, ignore_errors=True)
    print(f'\n{"=" * 46}\n通过 {len(PASS)} / 失败 {len(FAIL)}')
    if FAIL:
        print('失败项:')
        for f in FAIL:
            print('  -', f)
        sys.exit(1)
    print('全部通过')


if __name__ == '__main__':
    main()
