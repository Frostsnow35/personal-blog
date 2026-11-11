"""PostgreSQL 驱动解析回归测试。

背景（2026-11-11 事故）：SQLAlchemy 2.1+ 的 postgresql:// 默认走 psycopg3
（import psycopg），而 requirements 只装 psycopg2-binary，导致
SQLAlchemy(app) 在导入期抛 ModuleNotFoundError，Vercel 降级到兜底 app、
线上全站 404。以下测试覆盖：URL 强制重写到 +psycopg2、NullPool 配置、
以及"数据库不可达时模块导入不崩溃"。
"""
import os
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _import_with_database_url(database_url: str):
    code = (
        "import backend.app as m\n"
        "print('URI=' + m.app.config['SQLALCHEMY_DATABASE_URI'])\n"
        "with m.app.app_context():\n"
        "    print('DBAPI=' + m.db.engine.dialect.dbapi.__name__)\n"
    )
    env = {**os.environ, 'DATABASE_URL': database_url}
    return subprocess.run(
        [sys.executable, '-c', code],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )


class PostgresDriverTest(unittest.TestCase):
    def test_plain_postgresql_url_forced_to_psycopg2(self):
        # 127.0.0.1:1 立即拒绝连接：重点验证导入期不崩溃、驱动为 psycopg2
        proc = _import_with_database_url('postgresql://user:pass@127.0.0.1:1/db')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn('URI=postgresql+psycopg2://user:pass@127.0.0.1:1/db', proc.stdout)
        self.assertIn('DBAPI=psycopg2', proc.stdout)

    def test_psycopg3_url_rewritten_to_psycopg2(self):
        proc = _import_with_database_url('postgresql+psycopg://user:pass@127.0.0.1:1/db')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn('URI=postgresql+psycopg2://user:pass@127.0.0.1:1/db', proc.stdout)
        self.assertIn('DBAPI=psycopg2', proc.stdout)

    def test_null_pool_applies_to_psycopg2_url(self):
        from backend.app import build_engine_options
        options = build_engine_options('postgresql+psycopg2://u:p@host/db')
        self.assertEqual(options['poolclass'].__name__, 'NullPool')


if __name__ == '__main__':
    unittest.main()
