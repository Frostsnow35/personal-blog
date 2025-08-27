#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接SQL查询测试脚本
"""

import sqlite3
import json

def test_direct_sql():
    """直接使用SQL查询测试"""
    print("直接SQL查询测试...")
    
    try:
        conn = sqlite3.connect('personal_blog.db')
        cursor = conn.cursor()
        
        # 直接SQL查询
        cursor.execute("SELECT id, title, excerpt, category FROM posts WHERE status = 'published' LIMIT 3")
        posts = cursor.fetchall()
        
        print(f"查询到 {len(posts)} 篇文章")
        
        for i, post in enumerate(posts, 1):
            post_id, title, excerpt, category = post
            print(f"\n文章 {i} (ID: {post_id}):")
            print(f"  标题: {title}")
            print(f"  摘要: {excerpt[:50]}...")
            print(f"  分类: {category}")
            
            # 检查编码
            print(f"  标题类型: {type(title)}")
            print(f"  标题编码: {title.encode('utf-8') if isinstance(title, str) else 'N/A'}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"直接SQL测试失败: {e}")

def test_json_serialization():
    """测试JSON序列化"""
    print("\nJSON序列化测试...")
    
    try:
        conn = sqlite3.connect('personal_blog.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT title, excerpt, category FROM posts WHERE status = 'published' LIMIT 1")
        post = cursor.fetchone()
        
        if post:
            title, excerpt, category = post
            
            # 创建数据
            data = {
                'title': title,
                'excerpt': excerpt,
                'category': category
            }
            
            print(f"原始数据: {data}")
            
            # 使用ensure_ascii=False
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            print(f"JSON (ensure_ascii=False): {json_str}")
            
            # 检查是否有问号
            if '?' in json_str:
                print("❌ JSON中仍然包含问号")
            else:
                print("✅ JSON编码正常")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"JSON序列化测试失败: {e}")

def test_flask_jsonify_simulation():
    """模拟Flask的jsonify行为"""
    print("\n模拟Flask jsonify测试...")
    
    try:
        import flask
        from flask import jsonify
        
        # 创建临时Flask应用
        app = flask.Flask(__name__)
        app.config['JSON_AS_ASCII'] = False
        
        with app.app_context():
            conn = sqlite3.connect('personal_blog.db')
            cursor = conn.cursor()
            
            cursor.execute("SELECT title, excerpt, category FROM posts WHERE status = 'published' LIMIT 1")
            post = cursor.fetchone()
            
            if post:
                title, excerpt, category = post
                
                data = {
                    'title': title,
                    'excerpt': excerpt,
                    'category': category
                }
                
                print(f"原始数据: {data}")
                
                # 模拟Flask的jsonify
                response = jsonify(data)
                print(f"Flask响应头: {dict(response.headers)}")
                print(f"Flask响应编码: {getattr(response, 'charset', 'N/A')}")
                
                # 获取响应内容
                response_data = response.get_data(as_text=True)
                print(f"Flask响应内容: {response_data}")
                
                # 检查是否有问号
                if '?' in response_data:
                    print("❌ Flask响应中仍然包含问号")
                else:
                    print("✅ Flask响应编码正常")
            
            cursor.close()
            conn.close()
        
    except Exception as e:
        print(f"Flask jsonify模拟测试失败: {e}")

if __name__ == "__main__":
    print("编码问题诊断工具")
    print("=" * 50)
    
    test_direct_sql()
    test_json_serialization()
    test_flask_jsonify_simulation()
    
    print("\n" + "=" * 50)
    print("诊断完成！")
