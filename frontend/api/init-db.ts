export const config = {
  runtime: 'edge'
}

import { run, success, error } from './_db'

const initSql = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT DEFAULT '',
  status TEXT DEFAULT 'published',
  cover_url TEXT,
  category TEXT,
  tags TEXT,
  read_time INTEGER DEFAULT 3,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, ip_hash)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  email TEXT,
  location TEXT,
  website TEXT,
  github TEXT,
  twitter TEXT,
  skills TEXT,
  interests TEXT,
  education TEXT,
  occupation TEXT,
  featured_slugs TEXT,
  contact_markdown TEXT,
  cooperation_markdown TEXT,
  site_notice_markdown TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

export default async function handler(request: Request): Promise<Response> {
  try {
    const sqlStatements = initSql.split(';').filter(s => s.trim())
    for (const sql of sqlStatements) {
      await run(sql)
    }

    const adminExists = await run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES ('admin', 'pbkdf2:sha256:260000$hash$hash', 'admin')`)

    return success({ message: 'Database initialized successfully' })
  } catch (e) {
    const err = e as Error
    return error(`Init failed: ${err.message}`, 500)
  }
}