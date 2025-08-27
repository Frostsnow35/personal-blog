#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的编码测试脚本
"""

import sqlite3
import json

def test_database_encoding():
    """测试数据库编码"""
    print("测试数据库编码...")
    
    try:
        conn = sqlite3.connect('personal_blog.db')
        cursor = conn.cursor()
        
        # 获取文章内容
        cursor.execute("SELECT title, excerpt, category FROM posts LIMIT 3")
        posts = cursor.fetchall()
        
        print(f"数据库中的文章: {len(posts)} 篇")
        
        for i, post in enumerate(posts, 1):
            title, excerpt, category = post
            print(f"\n文章 {i}:")
            print(f"  标题: {title}")
            print(f"  摘要: {excerpt[:50]}...")
            print(f"  分类: {category}")
            
            # 检查编码
            print(f"  标题编码: {title.encode('utf-8')}")
            print(f"  摘要编码: {excerpt[:50].encode('utf-8')}")
            print(f"  分类编码: {category.encode('utf-8')}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"数据库测试失败: {e}")

def test_json_encoding():
    """测试JSON编码"""
    print("\n测试JSON编码...")
    
    try:
        conn = sqlite3.connect('personal_blog.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT title, excerpt, category FROM posts LIMIT 1")
        post = cursor.fetchone()
        
        if post:
            title, excerpt, category = post
            
            # 创建数据字典
            data = {
                'title': title,
                'excerpt': excerpt,
                'category': category
            }
            
            print(f"原始数据: {data}")
            
            # JSON序列化
            json_str = json.dumps(data, ensure_ascii=False, indent=2)
            print(f"JSON序列化: {json_str}")
            
            # JSON反序列化
            parsed_data = json.loads(json_str)
            print(f"JSON反序列化: {parsed_data}")
            
            # 检查是否有问号
            if '?' in json_str:
                print("❌ JSON中仍然包含问号")
            else:
                print("✅ JSON编码正常")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"JSON测试失败: {e}")

if __name__ == "__main__":
    print("编码测试工具")
    print("=" * 50)
    
    test_database_encoding()
    test_json_encoding()
    
    print("\n" + "=" * 50)
    print("测试完成！")
