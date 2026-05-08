#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite到MySQL数据迁移脚本
"""

import sqlite3
import pymysql
import json
import os
from datetime import datetime

def migrate_sqlite_to_mysql():
    print("🔄 开始数据迁移...")
    
    # SQLite连接
    sqlite_conn = sqlite3.connect('personal_blog.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # MySQL连接（请修改为你的实际配置）
    mysql_conn = pymysql.connect(
        host='localhost',
        user='blog_user',
        password='N@deshiko0304',  # 请修改为你的密码
        database='personal_blog',
        charset='utf8mb4'
    )
    mysql_cursor = mysql_conn.cursor()
    
    try:
        # 迁移博客文章
        print("📝 迁移博客文章...")
        sqlite_cursor.execute("SELECT * FROM posts")
        posts = sqlite_cursor.fetchall()
        
        for post in posts:
            try:
                mysql_cursor.execute("""
                    INSERT INTO posts (id, title, slug, content, excerpt, status, 
                                     cover_url, category, tags, read_time, 
                                     published_at, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, post)
                print(f"✅ 迁移文章: {post[1]}")
            except Exception as e:
                print(f"❌ 迁移文章失败 {post[1]}: {e}")
        
        # 迁移分类
        print("📂 迁移分类...")
        sqlite_cursor.execute("SELECT * FROM categories")
        categories = sqlite_cursor.fetchall()
        
        for category in categories:
            try:
                mysql_cursor.execute("""
                    INSERT INTO categories (id, name, description, created_at)
                    VALUES (%s, %s, %s, %s)
                """, category)
                print(f"✅ 迁移分类: {category[1]}")
            except Exception as e:
                print(f"❌ 迁移分类失败 {category[1]}: {e}")
        
        # 迁移标签
        print("🏷️ 迁移标签...")
        sqlite_cursor.execute("SELECT * FROM tags")
        tags = sqlite_cursor.fetchall()
        
        for tag in tags:
            try:
                mysql_cursor.execute("""
                    INSERT INTO tags (id, name, created_at)
                    VALUES (%s, %s, %s)
                """, tag)
                print(f"✅ 迁移标签: {tag[1]}")
            except Exception as e:
                print(f"❌ 迁移标签失败 {tag[1]}: {e}")
        
        # 迁移个人资料
        print("👤 迁移个人资料...")
        sqlite_cursor.execute("""
            SELECT id, name, avatar, bio, email, location, website,
                   github, twitter, skills, interests, education, occupation,
                   featured_slugs, contact_markdown, cooperation_markdown, site_notice_markdown,
                   created_at, updated_at
            FROM profiles
        """)
        profiles = sqlite_cursor.fetchall()
        
        for profile in profiles:
            try:
                mysql_cursor.execute("""
                    INSERT INTO profiles (id, name, avatar, bio, email, location, website, 
                                       github, twitter, skills, interests, education, occupation, 
                                       featured_slugs, contact_markdown, cooperation_markdown, site_notice_markdown,
                                       created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, profile)
                print(f"✅ 迁移个人资料: {profile[1]}")
            except Exception as e:
                print(f"❌ 迁移个人资料失败 {profile[1]}: {e}")
        
        mysql_conn.commit()
        print("🎉 数据迁移完成！")
        
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        mysql_conn.rollback()
    finally:
        sqlite_conn.close()
        mysql_conn.close()

if __name__ == '__main__':
    migrate_sqlite_to_mysql()
