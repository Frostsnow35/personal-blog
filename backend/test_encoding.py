#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试Flask应用的编码问题
"""

import requests
import json

def test_api_encoding():
    """测试API接口的编码"""
    base_url = "http://localhost:5000"
    
    print("正在测试Flask API的编码...")
    print("=" * 50)
    
    try:
        # 测试获取已发布文章
        print("1. 测试获取已发布文章...")
        response = requests.get(f"{base_url}/api/posts/published")
        
        if response.status_code == 200:
            print(f"  状态码: {response.status_code}")
            print(f"  响应头: {dict(response.headers)}")
            
            # 检查响应编码
            print(f"  响应编码: {response.encoding}")
            print(f"  Content-Type: {response.headers.get('Content-Type', 'N/A')}")
            
            # 解析JSON
            try:
                data = response.json()
                print(f"  响应成功: {data.get('success', False)}")
                
                if data.get('success') and 'data' in data:
                    posts = data['data'].get('items', [])
                    print(f"  文章数量: {len(posts)}")
                    
                    if posts:
                        post = posts[0]
                        print(f"\n  第一篇文章:")
                        print(f"    标题: {post.get('title', 'N/A')}")
                        print(f"    摘要: {post.get('excerpt', 'N/A')}")
                        print(f"    分类: {post.get('category', 'N/A')}")
                        
                        # 检查是否有问号
                        title = post.get('title', '')
                        excerpt = post.get('excerpt', '')
                        category = post.get('category', '')
                        
                        if '?' in title or '?' in excerpt or '?' in category:
                            print("  ❌ 发现问号，编码问题仍然存在")
                        else:
                            print("  ✅ 中文显示正常")
                
            except json.JSONDecodeError as e:
                print(f"  ❌ JSON解析失败: {e}")
                print(f"  响应内容: {response.text[:200]}...")
        else:
            print(f"  ❌ 请求失败: {response.status_code}")
            print(f"  响应内容: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("  ❌ 无法连接到Flask应用，请确保应用正在运行")
    except Exception as e:
        print(f"  ❌ 测试失败: {e}")

def test_database_content():
    """测试数据库中的内容"""
    print("\n2. 测试数据库内容...")
    print("=" * 50)
    
    try:
        import sqlite3
        
        conn = sqlite3.connect('personal_blog.db')
        cursor = conn.cursor()
        
        # 获取文章内容
        cursor.execute("SELECT title, excerpt, category FROM posts LIMIT 3")
        posts = cursor.fetchall()
        
        print(f"  数据库中的文章: {len(posts)} 篇")
        
        for i, post in enumerate(posts, 1):
            title, excerpt, category = post
            print(f"\n  文章 {i}:")
            print(f"    标题: {title}")
            print(f"    摘要: {excerpt[:50]}...")
            print(f"    分类: {category}")
            
            # 检查是否有问号
            if '?' in title or '?' in excerpt or '?' in category:
                print("    ❌ 数据库中存在问号")
            else:
                print("    ✅ 数据库内容正常")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"  ❌ 数据库测试失败: {e}")

def test_flask_config():
    """测试Flask配置"""
    print("\n3. 测试Flask配置...")
    print("=" * 50)
    
    try:
        from app import app
        
        print(f"  JSON_AS_ASCII: {app.config.get('JSON_AS_ASCII')}")
        print(f"  JSONIFY_MIMETYPE: {app.config.get('JSONIFY_MIMETYPE')}")
        
        # 检查数据库配置
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        print(f"  数据库URI: {db_uri}")
        
        if 'sqlite' in db_uri:
            print("  ✅ 使用SQLite数据库")
        else:
            print("  ⚠️  使用其他数据库")
            
    except Exception as e:
        print(f"  ❌ Flask配置测试失败: {e}")

if __name__ == "__main__":
    print("Flask应用编码测试工具")
    print("=" * 50)
    
    test_api_encoding()
    test_database_content()
    test_flask_config()
    
    print("\n" + "=" * 50)
    print("测试完成！")
    print("\n如果仍然显示问号，可能的原因:")
    print("1. Flask应用需要重启")
    print("2. 浏览器缓存问题")
    print("3. 前端编码处理问题")
    print("4. 数据库连接编码问题")
