import unittest

from backend import app as blog_app


class DatabaseModeTest(unittest.TestCase):
    def test_postgresql_uses_sqlalchemy_queries(self):
        original_uri = blog_app.app.config.get("SQLALCHEMY_DATABASE_URI", "")
        try:
            blog_app.app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://user:pass@localhost/db"

            self.assertFalse(blog_app.uses_direct_sqlite_queries())
            self.assertTrue(blog_app.uses_sqlalchemy_queries())
        finally:
            blog_app.app.config["SQLALCHEMY_DATABASE_URI"] = original_uri

    def test_sqlite_uses_direct_sqlite_queries(self):
        original_uri = blog_app.app.config.get("SQLALCHEMY_DATABASE_URI", "")
        try:
            blog_app.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///personal_blog.db"

            self.assertTrue(blog_app.uses_direct_sqlite_queries())
            self.assertFalse(blog_app.uses_sqlalchemy_queries())
        finally:
            blog_app.app.config["SQLALCHEMY_DATABASE_URI"] = original_uri

    def test_postgresql_engine_uses_null_pool_for_serverless(self):
        options = blog_app.build_engine_options(
            "postgresql://postgres.project:password@aws-0-region.pooler.supabase.com:6543/postgres"
        )

        self.assertEqual(options["poolclass"].__name__, "NullPool")


if __name__ == "__main__":
    unittest.main()
