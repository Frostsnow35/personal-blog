#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
仅保留标题为“欢迎来到我的博客”的一篇文章：
- 若同名有多条，仅保留最早的一条（id 最小），其余全部删除
- 确保保留的这条文章处于 published 状态
适用于 SQLite：backend/personal_blog.db 的 posts 表
"""

import os
import sqlite3

TARGET_TITLE = '欢迎来到我的博客'

db_path = os.path.join(os.path.dirname(__file__), 'personal_blog.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute("SELECT id, status FROM posts WHERE title = ? ORDER BY id ASC", (TARGET_TITLE,))
    rows = cur.fetchall()
    if not rows:
        print('未找到标题为“欢迎来到我的博客”的文章，未做变更。')
    else:
        keep_id = rows[0][0]
        # 确保保留的这条为已发布
        cur.execute("UPDATE posts SET status='published' WHERE id=?", (keep_id,))
        # 删除除保留外的所有文章
        cur.execute("DELETE FROM posts WHERE id <> ?", (keep_id,))
        conn.commit()
        print(f'已保留 id={keep_id}，并删除其余文章。')
finally:
    cur.close()
    conn.close()


