#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一次性修复 posts 表中被错误编码写入而显示为“？”的中文字段。
策略：
- 如果 title/ category / excerpt 含有 “?”，则进行替换：
  - title: 去掉“?”后若为空/过短，则用“示例文章 {id}”占位
  - category: 设置为“未分类”
  - excerpt: 设置为“本文内容已修复占位，待补充。”
仅更新确实发生变化的记录。

兼容两种数据库：
- MySQL（从环境变量 DATABASE_URL 解析，使用 utf8mb4）
- SQLite（默认：backend/personal_blog.db）
"""

import os
import sys
from typing import Tuple, Any
from urllib.parse import urlparse, parse_qs


def _connect_mysql(database_url: str):
    import pymysql
    # 允许两种形式：mysql+pymysql://user:pass@host:port/db?...
    if database_url.startswith('mysql+pymysql://'):
        raw = database_url.replace('mysql+pymysql://', '')
        url = urlparse('mysql://' + raw)
    else:
        url = urlparse(database_url)
    user = url.username or 'root'
    password = url.password or ''
    host = url.hostname or '127.0.0.1'
    port = int(url.port or 3306)
    dbname = (url.path or '/').lstrip('/') or 'personal_blog'
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=dbname,
        charset='utf8mb4'
    )
    return conn


def _connect_sqlite() -> Any:
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
    return sqlite3.connect(db_path)


def _is_mysql(url: str) -> bool:
    return 'mysql' in (url or '').lower()


def _looks_corrupted(s: str) -> bool:
    if not s:
        return False
    return '??' in s or '？' in s  # 连续问号或全角问号


def _fix_title(original: str, post_id: int) -> str:
    if not original:
        return f'示例文章 {post_id}'
    cleaned = original.replace('？', '').replace('?', '').strip()
    if len(cleaned) < 3:
        cleaned = f'示例文章 {post_id}'
    return cleaned


def _fix_category(original: str) -> str:
    if not original:
        return '未分类'
    cleaned = original.replace('？', '').replace('?', '').strip()
    return cleaned or '未分类'


def _fix_excerpt(original: str) -> str:
    return '本文内容已修复占位，待补充。'


def main():
    database_url = os.getenv('DATABASE_URL', '').strip()
    using_mysql = _is_mysql(database_url)

    try:
        if using_mysql:
            conn = _connect_mysql(database_url)
        else:
            conn = _connect_sqlite()
    except Exception as e:
        print(f'连接数据库失败: {e}')
        sys.exit(1)

    updated = 0
    try:
        cur = conn.cursor()
        # 读取 posts
        cur.execute("SELECT id, title, category, excerpt FROM posts ORDER BY updated_at DESC")
        rows = cur.fetchall()

        # 不同驱动返回不同类型的行
        def _row_get(r, idx):
            try:
                return r[idx]
            except Exception:
                # 适配 dict/Row 类型
                return list(r.values())[idx]

        for r in rows:
            post_id = _row_get(r, 0)
            title = _row_get(r, 1) or ''
            category = _row_get(r, 2) or ''
            excerpt = _row_get(r, 3) or ''

            new_title = title
            new_category = category
            new_excerpt = excerpt

            if _looks_corrupted(title):
                new_title = _fix_title(title, post_id)
            if _looks_corrupted(category):
                new_category = _fix_category(category)
            if _looks_corrupted(excerpt):
                new_excerpt = _fix_excerpt(excerpt)

            if (new_title != title) or (new_category != category) or (new_excerpt != excerpt):
                if using_mysql:
                    cur.execute(
                        "UPDATE posts SET title=%s, category=%s, excerpt=%s WHERE id=%s",
                        (new_title, new_category, new_excerpt, post_id)
                    )
                else:
                    cur.execute(
                        "UPDATE posts SET title=?, category=?, excerpt=? WHERE id=?",
                        (new_title, new_category, new_excerpt, post_id)
                    )
                updated += 1
                print(f"已修复: id={post_id}, title='{title}' -> '{new_title}', category='{category}' -> '{new_category}'")

        conn.commit()
        print(f"修复完成，共更新 {updated} 条记录。")

    except Exception as e:
        conn.rollback()
        print(f'修复失败: {e}')
        sys.exit(2)
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


if __name__ == '__main__':
    main()


