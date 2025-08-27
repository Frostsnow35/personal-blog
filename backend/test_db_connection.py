#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试数据库连接的简化脚本
"""

def test_mysql_connection():
    """测试MySQL连接"""
    try:
        import pymysql
        
        print("正在测试MySQL连接...")
        print("=" * 50)
        
        # 尝试不同的连接配置
        configs = [
            {
                'name': 'blog_user (默认配置)',
                'host': 'localhost',
                'port': 3306,
                'user': 'blog_user',
                'password': 'blog_password',
                'database': 'personal_blog'
            },
            {
                'name': 'root用户 (管理员)',
                'host': 'localhost',
                'port': 3306,
                'user': 'root',
                'password': '',  # 需要你输入实际的root密码
                'database': 'personal_blog'
            }
        ]
        
        for config in configs:
            print(f"\n测试配置: {config['name']}")
            print(f"  主机: {config['host']}:{config['port']}")
            print(f"  用户: {config['user']}")
            print(f"  数据库: {config['database']}")
            
            try:
                connection = pymysql.connect(
                    host=config['host'],
                    port=config['port'],
                    user=config['user'],
                    password=config['password'],
                    database=config['database'],
                    charset='utf8mb4'
                )
                
                print("  ✅ 连接成功!")
                
                # 测试查询
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                
                print(f"  数据库中的表: {len(tables)} 个")
                for table in tables:
                    print(f"    - {table[0]}")
                
                # 检查posts表
                if any('posts' in table for table in tables):
                    cursor.execute("SELECT COUNT(*) FROM posts")
                    count = cursor.fetchone()[0]
                    print(f"  posts表记录数: {count}")
                    
                    if count > 0:
                        cursor.execute("SELECT id, title, LEFT(content, 30) FROM posts LIMIT 3")
                        posts = cursor.fetchall()
                        print("  文章预览:")
                        for post in posts:
                            print(f"    ID {post[0]}: {post[1]} - {post[2]}...")
                
                cursor.close()
                connection.close()
                
            except Exception as e:
                print(f"  ❌ 连接失败: {e}")
        
        print("\n" + "=" * 50)
        print("连接测试完成!")
        
    except ImportError:
        print("错误: 请先安装 pymysql")
        print("运行: pip install pymysql")
    except Exception as e:
        print(f"错误: {e}")

def test_sqlite_fallback():
    """测试SQLite备用方案"""
    try:
        import sqlite3
        import os
        
        print("\n正在测试SQLite备用方案...")
        print("=" * 50)
        
        db_path = "personal_blog.db"
        if os.path.exists(db_path):
            print(f"SQLite数据库文件存在: {db_path}")
            
            connection = sqlite3.connect(db_path)
            cursor = connection.cursor()
            
            # 检查表
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            print(f"数据库中的表: {len(tables)} 个")
            for table in tables:
                print(f"  - {table[0]}")
            
            # 检查posts表
            if any('posts' in table for table in tables):
                cursor.execute("SELECT COUNT(*) FROM posts")
                count = cursor.fetchone()[0]
                print(f"posts表记录数: {count}")
                
                if count > 0:
                    cursor.execute("SELECT id, title, substr(content, 1, 30) FROM posts LIMIT 3")
                    posts = cursor.fetchall()
                    print("文章预览:")
                    for post in posts:
                        print(f"  ID {post[0]}: {post[1]} - {post[2]}...")
            
            cursor.close()
            connection.close()
        else:
            print(f"SQLite数据库文件不存在: {db_path}")
            print("建议: 使用SQLite作为开发环境的备用方案")
        
    except Exception as e:
        print(f"SQLite测试错误: {e}")

if __name__ == "__main__":
    print("数据库连接测试工具")
    print("=" * 50)
    
    test_mysql_connection()
    test_sqlite_fallback()
    
    print("\n建议:")
    print("1. 如果MySQL连接失败，请检查:")
    print("   - MySQL服务是否运行")
    print("   - 用户名密码是否正确")
    print("   - 数据库是否存在")
    print("2. 可以暂时使用SQLite进行开发测试")
    print("3. 修改 backend/app.py 中的数据库配置")
