#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查数据库字符集设置的脚本
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def check_database_charset():
    """检查数据库字符集设置"""
    try:
        import pymysql
        
        # 获取数据库连接信息
        database_url = os.getenv('DATABASE_URL', 'mysql+pymysql://blog_user:blog_password@localhost:3306/personal_blog')
        
        # 解析连接字符串
        if 'mysql+pymysql://' in database_url:
            connection_string = database_url.replace('mysql+pymysql://', '')
            if '?' in connection_string:
                connection_string = connection_string.split('?')[0]
            
            if '@' in connection_string:
                credentials, host_db = connection_string.split('@')
                if ':' in credentials:
                    username, password = credentials.split(':')
                else:
                    username = credentials
                    password = ''
                
                if ':' in host_db:
                    host, port_db = host_db.split(':')
                    if '/' in port_db:
                        port, database = port_db.split('/')
                    else:
                        port = '3306'
                        database = port_db
                else:
                    host = host_db.split('/')[0]
                    port = '3306'
                    database = host_db.split('/')[1]
            else:
                print("无法解析数据库连接字符串")
                return
        
        print(f"连接信息:")
        print(f"  主机: {host}")
        print(f"  端口: {port}")
        print(f"  数据库: {database}")
        print(f"  用户名: {username}")
        print()
        
        # 连接数据库
        connection = pymysql.connect(
            host=host,
            port=int(port),
            user=username,
            password=password,
            database=database,
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        # 检查数据库字符集
        cursor.execute("SHOW CREATE DATABASE " + database)
        db_info = cursor.fetchone()
        print("数据库字符集信息:")
        print(f"  {db_info[1]}")
        print()
        
        # 检查表字符集
        cursor.execute("SHOW TABLE STATUS")
        tables = cursor.fetchall()
        
        print("表字符集信息:")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SHOW CREATE TABLE {table_name}")
            table_info = cursor.fetchone()
            print(f"  {table_name}: {table_info[1]}")
        
        # 检查posts表的内容
        print("\n检查posts表内容:")
        cursor.execute("SELECT id, title, LEFT(content, 50) as content_preview FROM posts LIMIT 3")
        posts = cursor.fetchall()
        
        for post in posts:
            print(f"  ID: {post[0]}")
            print(f"  标题: {post[1]}")
            print(f"  内容预览: {post[2]}")
            print()
        
        cursor.close()
        connection.close()
        
    except ImportError:
        print("错误: 请先安装 pymysql")
        print("运行: pip install pymysql")
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    check_database_charset()
