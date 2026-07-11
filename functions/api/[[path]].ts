import { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  SECRET_KEY: string
  JWT_SECRET: string
  ADMIN_USERNAME: string
  ADMIN_PASSWORD: string
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RouteHandler {
  method: HttpMethod
  path: string
  handler: (request: Request, env: Env, params: Record<string, string>) => Promise<Response>
}

function jsonResponse(data: Record<string, any>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

function notFound(): Response {
  return jsonResponse({ success: false, message: 'Not found' }, 404)
}

function unauthorized(message: string = 'Unauthorized'): Response {
  return jsonResponse({ success: false, message }, 401)
}

function forbidden(message: string = 'Forbidden'): Response {
  return jsonResponse({ success: false, message }, 403)
}

function badRequest(message: string): Response {
  return jsonResponse({ success: false, message }, 400)
}

function serverError(message: string = 'Server error'): Response {
  return jsonResponse({ success: false, message }, 500)
}

function hashIp(ip: string, secret: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + secret)
  return crypto.subtle.digest('SHA-256', data).then(d => {
    return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64)
  })
}

function getClientIp(request: Request): string {
  return request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
         request.headers.get('X-Real-IP')?.trim() ||
         ''
}

interface JwtPayload {
  sub: string
  role: string
  exp: number
  iat: number
}

function createJwt(username: string, role: string, secret: string, expiresMinutes: number = 120): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: JwtPayload = {
    sub: username,
    role,
    exp: now + expiresMinutes * 60,
    iat: now
  }
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '')
  const encoder = new TextEncoder()
  const signature = crypto.subtle.sign(
    'HMAC',
    crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    encoder.encode(`${header}.${payloadB64}`)
  ).then(d => {
    return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('')
  })
  return `${header}.${payloadB64}.${signature}`
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, signature] = parts
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(signature.match(/.{2}/g)?.map(h => parseInt(h, 16)) || []),
      encoder.encode(`${headerB64}.${payloadB64}`)
    )
    if (!isValid) return null
    const payload = JSON.parse(atob(payloadB64))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

async function requireAdmin(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return false
  const token = authHeader.split(' ', 1)[1].trim()
  const payload = await verifyJwt(token, env.JWT_SECRET)
  return payload !== null && payload.role === 'admin'
}

function slugify(title: string): string {
  let base = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  while (base.includes('--')) base = base.replace('--', '-')
  return base.replace(/^-|-$/g, '') || 'post'
}

async function ensureAdminUser(db: D1Database, env: Env): Promise<void> {
  const { results } = await db.prepare('SELECT id FROM users WHERE username = ?').bind(env.ADMIN_USERNAME).run()
  if (results.length > 0) return
  
  const salt = crypto.randomUUID().replace(/-/g, '')
  const password = env.ADMIN_PASSWORD || 'admin'
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const passwordHash = `pbkdf2:sha256:260000${salt}${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`
  
  await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .bind(env.ADMIN_USERNAME, passwordHash, 'admin')
    .run()
}

async function initDatabase(db: D1Database): Promise<void> {
  await db.prepare(`
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
    )
  `).run()
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      UNIQUE (post_id, ip_hash)
    )
  `).run()
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      category TEXT,
      tags TEXT,
      publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_time INTEGER DEFAULT 5,
      cover_image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  await db.prepare(`
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
      blog_content_markdown TEXT,
      philosophy_markdown TEXT,
      now_markdown TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  const tableInfo = await db.prepare('PRAGMA table_info(profiles)').run()
  const columns = tableInfo.results.map((col: any) => col.name)
  if (!columns.includes('blog_content_markdown')) {
    await db.prepare('ALTER TABLE profiles ADD COLUMN blog_content_markdown TEXT').run()
  }
  if (!columns.includes('philosophy_markdown')) {
    await db.prepare('ALTER TABLE profiles ADD COLUMN philosophy_markdown TEXT').run()
  }
  if (!columns.includes('now_markdown')) {
    await db.prepare('ALTER TABLE profiles ADD COLUMN now_markdown TEXT').run()
  }
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
}

async function getPosts(db: D1Database, page: number = 1, perPage: number = 10, category?: string, tag?: string, search?: string) {
  let query = 'SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, views, likes, published_at, created_at FROM posts WHERE status = ?'
  const params: any[] = ['published']
  
  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }
  
  if (tag) {
    query += ' AND tags LIKE ?'
    params.push(`%"${tag}"%`)
  }
  
  if (search) {
    query += ' AND (title LIKE ? OR category LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  
  query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?'
  params.push(perPage, (page - 1) * perPage)
  
  const countQuery = query.replace('SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, views, likes, published_at, created_at FROM', 'SELECT COUNT(*) FROM').replace(' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?', '')
  const countParams = params.slice(0, -2)
  
  const [countResult, postsResult] = await Promise.all([
    db.prepare(countQuery).bind(...countParams).run(),
    db.prepare(query).bind(...params).run()
  ])
  
  const total = countResult.results.length > 0 ? countResult.results[0]['COUNT(*)'] : 0
  const items = postsResult.results.map((post: any) => ({
    ...post,
    tags: parseJson(post.tags) || []
  }))
  
  return { items, total, pages: Math.ceil(total / perPage), current_page: page }
}

function parseJson(value: any): any {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

const routes: RouteHandler[] = [
  {
    method: 'GET',
    path: '/posts',
    async handler(request, env) {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const category = url.searchParams.get('category') || undefined
      const tag = url.searchParams.get('tag') || undefined
      const search = url.searchParams.get('search') || undefined
      
      const result = await getPosts(env.DB, page, per_page, category, tag, search)
      return jsonResponse({ success: true, data: result })
    }
  },
  
  {
    method: 'GET',
    path: '/posts/published',
    async handler(request, env) {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const category = url.searchParams.get('category') || undefined
      const tag = url.searchParams.get('tag') || undefined
      const search = url.searchParams.get('search') || undefined
      
      const result = await getPosts(env.DB, page, per_page, category, tag, search)
      return jsonResponse({ success: true, data: result })
    }
  },
  
  {
    method: 'GET',
    path: '/search',
    async handler(request, env) {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const category = url.searchParams.get('category') || undefined
      const tag = url.searchParams.get('tag') || undefined
      const search = url.searchParams.get('search') || undefined
      
      const result = await getPosts(env.DB, page, per_page, category, tag, search)
      return jsonResponse({ success: true, data: result })
    }
  },
  
  {
    method: 'GET',
    path: '/posts/:id',
    async handler(request, env, params) {
      const id = parseInt(params.id)
      const { results } = await env.DB.prepare(
        'SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, views, likes, published_at, created_at, updated_at FROM posts WHERE id = ? AND status = ?'
      ).bind(id, 'published').run()
      
      if (results.length === 0) return notFound()
      
      const post = results[0]
      return jsonResponse({ success: true, data: {
        ...post,
        tags: parseJson(post.tags) || []
      }})
    }
  },
  
  {
    method: 'GET',
    path: '/posts/slug/:slug',
    async handler(request, env, params) {
      const { results } = await env.DB.prepare(
        'SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, views, likes, published_at, created_at, updated_at FROM posts WHERE slug = ? AND status = ?'
      ).bind(params.slug, 'published').run()
      
      if (results.length === 0) return notFound()
      
      const post = results[0]
      return jsonResponse({ success: true, data: {
        ...post,
        tags: parseJson(post.tags) || []
      }})
    }
  },
  
  {
    method: 'POST',
    path: '/posts/:id/like',
    async handler(request, env, params) {
      const postId = parseInt(params.id)
      const ip = getClientIp(request)
      const ipHash = await hashIp(ip, env.SECRET_KEY)
      
      const { results: existing } = await env.DB.prepare('SELECT id FROM likes WHERE post_id = ? AND ip_hash = ?').bind(postId, ipHash).run()
      
      if (existing.length > 0) {
        await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND ip_hash = ?').bind(postId, ipHash).run()
        await env.DB.prepare('UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?').bind(postId).run()
        const { results: post } = await env.DB.prepare('SELECT likes FROM posts WHERE id = ?').bind(postId).run()
        return jsonResponse({ success: true, data: { liked: false, count: post[0]?.likes || 0 } })
      } else {
        await env.DB.prepare('INSERT INTO likes (post_id, ip_hash) VALUES (?, ?)').bind(postId, ipHash).run()
        await env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(postId).run()
        const { results: post } = await env.DB.prepare('SELECT likes FROM posts WHERE id = ?').bind(postId).run()
        return jsonResponse({ success: true, data: { liked: true, count: post[0]?.likes || 0 } })
      }
    }
  },
  
  {
    method: 'GET',
    path: '/posts/:id/like',
    async handler(request, env, params) {
      const postId = parseInt(params.id)
      const ip = getClientIp(request)
      const ipHash = await hashIp(ip, env.SECRET_KEY)
      
      const [{ results: existing }, { results: post }] = await Promise.all([
        env.DB.prepare('SELECT id FROM likes WHERE post_id = ? AND ip_hash = ?').bind(postId, ipHash).run(),
        env.DB.prepare('SELECT likes FROM posts WHERE id = ?').bind(postId).run()
      ])
      
      return jsonResponse({ success: true, data: {
        liked: existing.length > 0,
        count: post[0]?.likes || 0
      }})
    }
  },
  
  {
    method: 'POST',
    path: '/posts/:id/view',
    async handler(request, env, params) {
      const postId = parseInt(params.id)
      await env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(postId).run()
      const { results } = await env.DB.prepare('SELECT views FROM posts WHERE id = ?').bind(postId).run()
      return jsonResponse({ success: true, data: { views: results[0]?.views || 0 } })
    }
  },
  
  {
    method: 'GET',
    path: '/categories',
    async handler(request, env) {
      const { results } = await env.DB.prepare('SELECT id, name, description FROM categories ORDER BY name').run()
      return jsonResponse(results)
    }
  },
  
  {
    method: 'GET',
    path: '/categories/published',
    async handler(request, env) {
      const { results } = await env.DB.prepare(`
        SELECT category, COUNT(*) as count 
        FROM posts 
        WHERE status = 'published' AND category IS NOT NULL AND category != ''
        GROUP BY category 
        ORDER BY count DESC
      `).run()
      return jsonResponse({ success: true, data: results })
    }
  },
  
  {
    method: 'GET',
    path: '/tags',
    async handler(request, env) {
      const { results } = await env.DB.prepare('SELECT id, name FROM tags ORDER BY name').run()
      return jsonResponse(results)
    }
  },
  
  {
    method: 'GET',
    path: '/tags/published',
    async handler(request, env) {
      const { results: posts } = await env.DB.prepare('SELECT tags FROM posts WHERE status = "published" AND tags IS NOT NULL AND tags != ""').run()
      const tagCounts: Record<string, number> = {}
      
      for (const post of posts) {
        try {
          const tags = JSON.parse(post.tags) || []
          for (const tag of tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          }
        } catch {
          continue
        }
      }
      
      const tagsWithCount = Object.entries(tagCounts).map(([name, count]) => ({ name, count }))
      tagsWithCount.sort((a, b) => b.count - a.count)
      
      return jsonResponse({ success: true, data: tagsWithCount })
    }
  },
  
  {
    method: 'GET',
    path: '/stats',
    async handler(request, env) {
      const [{ results: posts }, { results: categories }, { results: tags }] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM posts').run(),
        env.DB.prepare('SELECT COUNT(*) as count FROM categories').run(),
        env.DB.prepare('SELECT COUNT(*) as count FROM tags').run()
      ])
      
      return jsonResponse({
        total_posts: posts[0]?.count || 0,
        total_categories: categories[0]?.count || 0,
        total_tags: tags[0]?.count || 0
      })
    }
  },
  
  {
    method: 'GET',
    path: '/profile',
    async handler(request, env) {
      const { results } = await env.DB.prepare('SELECT * FROM profiles LIMIT 1').run()
      
      if (results.length === 0) {
        return jsonResponse({
          id: 1,
          name: '霜雪旧曾谙',
          avatar: '/avatar.jpg',
          bio: '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者',
          email: 'example@email.com',
          location: '中国',
          website: 'https://example.com',
          github: 'https://github.com/username',
          twitter: 'https://twitter.com/username',
          skills: ['Vue.js', 'Python', 'Flask', 'MySQL', 'TypeScript', 'Tailwind CSS'],
          interests: ['二次元', '海洋', '自然', '哲学', '技术分享'],
          education: '计算机科学与技术',
          occupation: '学生',
          featured_slugs: [],
          contact_markdown: '欢迎通过以下方式联系我：\n\n- **邮箱**: example@email.com\n- **GitHub**: https://github.com/username\n- **Twitter**: https://twitter.com/username',
          cooperation_markdown: '',
          site_notice_markdown: '',
          blog_content_markdown: '这里主要记录我的技术学习笔记、项目实践经验和个人思考。涵盖前端开发、后端技术、系统设计等多个领域。',
          philosophy_markdown: '坚持持续学习，相信技术的力量可以改变世界。追求简洁优雅的解决方案，注重代码质量和用户体验。',
          now_markdown: '- 正在学习 Vue 3 和 TypeScript\n- 开发个人博客系统\n- 阅读技术书籍',
          updated_at: new Date().toISOString()
        })
      }
      
      const profile = results[0]
      return jsonResponse({
        ...profile,
        skills: parseJson(profile.skills) || [],
        interests: parseJson(profile.interests) || [],
        featured_slugs: parseJson(profile.featured_slugs) || [],
        blog_content_markdown: profile.blog_content_markdown || '',
        philosophy_markdown: profile.philosophy_markdown || '',
        now_markdown: profile.now_markdown || '',
        updated_at: profile.updated_at ? new Date(profile.updated_at).toISOString() : null
      })
    }
  },
  
  {
    method: 'PUT',
    path: '/profile',
    async handler(request, env) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const data = await request.json()
      const { results } = await env.DB.prepare('SELECT id FROM profiles LIMIT 1').run()
      
      if (results.length === 0) {
        await env.DB.prepare(`
          INSERT INTO profiles (name, avatar, bio, email, location, website, github, twitter, skills, interests, education, occupation, featured_slugs, contact_markdown, cooperation_markdown, site_notice_markdown, blog_content_markdown, philosophy_markdown, now_markdown)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.name || '',
          data.avatar || '',
          data.bio || '',
          data.email || '',
          data.location || '',
          data.website || '',
          data.github || '',
          data.twitter || '',
          JSON.stringify(data.skills || []),
          JSON.stringify(data.interests || []),
          data.education || '',
          data.occupation || '',
          JSON.stringify(data.featured_slugs || []),
          data.contact_markdown || '',
          data.cooperation_markdown || '',
          data.site_notice_markdown || '',
          data.blog_content_markdown || '',
          data.philosophy_markdown || '',
          data.now_markdown || ''
        ).run()
      } else {
        const profileId = results[0].id
        await env.DB.prepare(`
          UPDATE profiles SET name = ?, avatar = ?, bio = ?, email = ?, location = ?, website = ?, github = ?, twitter = ?, skills = ?, interests = ?, education = ?, occupation = ?, featured_slugs = ?, contact_markdown = ?, cooperation_markdown = ?, site_notice_markdown = ?, blog_content_markdown = ?, philosophy_markdown = ?, now_markdown = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(
          data.name || '',
          data.avatar || '',
          data.bio || '',
          data.email || '',
          data.location || '',
          data.website || '',
          data.github || '',
          data.twitter || '',
          JSON.stringify(data.skills || []),
          JSON.stringify(data.interests || []),
          data.education || '',
          data.occupation || '',
          JSON.stringify(data.featured_slugs || []),
          data.contact_markdown || '',
          data.cooperation_markdown || '',
          data.site_notice_markdown || '',
          data.blog_content_markdown || '',
          data.philosophy_markdown || '',
          data.now_markdown || '',
          profileId
        ).run()
      }
      
      return jsonResponse({ success: true, message: '个人资料更新成功' })
    }
  },
  
  {
    method: 'POST',
    path: '/auth/login',
    async handler(request, env) {
      const data = await request.json()
      const username = (data.username || '').trim()
      const password = data.password || ''
      
      if (!username || !password) return badRequest('用户名或密码不能为空')
      
      const { results } = await env.DB.prepare('SELECT username, password_hash, role FROM users WHERE username = ?').bind(username).run()
      
      if (results.length === 0) return unauthorized('用户名或密码错误')
      
      const user = results[0]
      const token = createJwt(user.username, user.role, env.JWT_SECRET)
      
      return jsonResponse({ success: true, access_token: token, user: { username: user.username, role: user.role } })
    }
  },
  
  {
    method: 'GET',
    path: '/admin/posts',
    async handler(request, env) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const status = url.searchParams.get('status') || undefined
      const category = url.searchParams.get('category') || undefined
      
      let query = 'SELECT id, title, slug, status, category, tags, updated_at FROM posts'
      const params: any[] = []
      
      if (status) {
        query += ' WHERE status = ?'
        params.push(status)
      }
      if (category && !status) {
        query += ' WHERE category = ?'
        params.push(category)
      } else if (category) {
        query += ' AND category = ?'
        params.push(category)
      }
      
      query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      params.push(per_page, (page - 1) * per_page)
      
      const countQuery = query.replace('SELECT id, title, slug, status, category, tags, updated_at FROM', 'SELECT COUNT(*) FROM').replace(' ORDER BY updated_at DESC LIMIT ? OFFSET ?', '')
      const countParams = params.slice(0, -2)
      
      const [countResult, postsResult] = await Promise.all([
        env.DB.prepare(countQuery).bind(...countParams).run(),
        env.DB.prepare(query).bind(...params).run()
      ])
      
      const total = countResult.results.length > 0 ? countResult.results[0]['COUNT(*)'] : 0
      const items = postsResult.results.map((post: any) => ({
        ...post,
        tags: parseJson(post.tags) || [],
        updated_at: post.updated_at ? new Date(post.updated_at).toISOString() : null
      }))
      
      return jsonResponse({ success: true, data: { items, total, page, pages: Math.ceil(total / per_page) } })
    }
  },
  
  {
    method: 'GET',
    path: '/admin/posts/:id',
    async handler(request, env, params) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const id = parseInt(params.id)
      const { results } = await env.DB.prepare(`
        SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at, created_at, updated_at 
        FROM posts WHERE id = ?
      `).bind(id).run()
      
      if (results.length === 0) return notFound()
      
      const post = results[0]
      return jsonResponse({ success: true, data: {
        ...post,
        tags: parseJson(post.tags) || [],
        published_at: post.published_at ? new Date(post.published_at).toISOString() : null,
        created_at: post.created_at ? new Date(post.created_at).toISOString() : null,
        updated_at: post.updated_at ? new Date(post.updated_at).toISOString() : null
      }})
    }
  },
  
  {
    method: 'POST',
    path: '/admin/posts',
    async handler(request, env) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const data = await request.json()
      const title = (data.title || '').trim()
      
      if (!title) return badRequest('标题不能为空')
      if (title.length > 200) return badRequest('标题过长(<=200)')
      
      let slug = (data.slug || '').trim() || slugify(title)
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(slug)) return badRequest('slug 格式仅允许小写字母、数字及中划线')
      
      const { results: existing } = await env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).run()
      if (existing.length > 0) return badRequest('slug 已存在')
      
      const excerpt = (data.excerpt || '').trim()
      if (excerpt.length > 500) return badRequest('摘要过长(<=500)')
      
      const status = data.status || 'draft'
      const words = (data.content || '').replace(/\n/g, '').length
      const read_time = Math.max(1, Math.floor(words / 300))
      
      const { results } = await env.DB.prepare(`
        INSERT INTO posts (title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        title,
        slug,
        data.content || '',
        excerpt,
        status,
        data.cover_url || null,
        data.category || null,
        JSON.stringify(data.tags || []),
        read_time,
        status === 'published' ? new Date().toISOString() : null
      ).run()
      
      return jsonResponse({ success: true, data: { id: results.lastRowId }, message: '创建成功' })
    }
  },
  
  {
    method: 'PUT',
    path: '/admin/posts/:id',
    async handler(request, env, params) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const id = parseInt(params.id)
      const data = await request.json()
      
      const { results: existingPost } = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).run()
      if (existingPost.length === 0) return notFound()
      
      const post = existingPost[0]
      const updates: string[] = []
      const updateParams: any[] = []
      
      if ('title' in data) {
        const title = (data.title || '').trim()
        if (!title) return badRequest('标题不能为空')
        if (title.length > 200) return badRequest('标题过长(<=200)')
        updates.push('title = ?')
        updateParams.push(title)
      }
      
      if ('slug' in data) {
        let slug = (data.slug || '').trim() || slugify(post.title)
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        if (!slugRegex.test(slug)) return badRequest('slug 格式仅允许小写字母、数字及中划线')
        
        if (slug !== post.slug) {
          const { results: slugExists } = await env.DB.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').bind(slug, id).run()
          if (slugExists.length > 0) return badRequest('slug 已存在')
        }
        updates.push('slug = ?')
        updateParams.push(slug)
      }
      
      if ('content' in data) {
        updates.push('content = ?')
        updateParams.push(data.content || '')
      }
      
      if ('excerpt' in data) {
        const excerpt = (data.excerpt || '').trim()
        if (excerpt.length > 500) return badRequest('摘要过长(<=500)')
        updates.push('excerpt = ?')
        updateParams.push(excerpt)
      }
      
      if ('cover_url' in data) {
        updates.push('cover_url = ?')
        updateParams.push(data.cover_url || null)
      }
      
      if ('category' in data) {
        updates.push('category = ?')
        updateParams.push(data.category || null)
      }
      
      if ('tags' in data) {
        updates.push('tags = ?')
        updateParams.push(JSON.stringify(data.tags || []))
      }
      
      if ('status' in data) {
        const status = data.status || 'draft'
        if (!['draft', 'published'].includes(status)) return badRequest('非法状态')
        updates.push('status = ?')
        updateParams.push(status)
        
        if (status === 'published' && !post.published_at) {
          updates.push('published_at = ?')
          updateParams.push(new Date().toISOString())
        }
      }
      
      if (updates.length > 0) {
        const words = (data.content || post.content || '').replace(/\n/g, '').length
        updates.push('read_time = ?')
        updateParams.push(Math.max(1, Math.floor(words / 300)))
        
        updates.push('updated_at = CURRENT_TIMESTAMP')
        updateParams.push(id)
        
        await env.DB.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).bind(...updateParams).run()
      }
      
      return jsonResponse({ success: true, message: '更新成功' })
    }
  },
  
  {
    method: 'DELETE',
    path: '/admin/posts/:id',
    async handler(request, env, params) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const id = parseInt(params.id)
      await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()
      return jsonResponse({ success: true, message: '已删除' })
    }
  },
  
  {
    method: 'POST',
    path: '/admin/posts/:id/publish',
    async handler(request, env, params) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const id = parseInt(params.id)
      await env.DB.prepare('UPDATE posts SET status = "published", published_at = COALESCE(published_at, CURRENT_TIMESTAMP) WHERE id = ?').bind(id).run()
      return jsonResponse({ success: true, message: '已发布' })
    }
  },
  
  {
    method: 'POST',
    path: '/admin/posts/:id/unpublish',
    async handler(request, env, params) {
      if (!(await requireAdmin(request, env))) return unauthorized()
      
      const id = parseInt(params.id)
      await env.DB.prepare('UPDATE posts SET status = "draft" WHERE id = ?').bind(id).run()
      return jsonResponse({ success: true, message: '已撤回为草稿' })
    }
  },
  
  {
    method: 'GET',
    path: '/health',
    async handler(request, env) {
      return jsonResponse({ status: 'healthy', timestamp: new Date().toISOString() })
    }
  }
]

function matchRoute(method: HttpMethod, path: string): { handler: RouteHandler['handler']; params: Record<string, string> } | null {
  const normalizedPath = path.startsWith('/api/') ? path.slice(5) : path
  for (const route of routes) {
    if (route.method !== method) continue
    
    const routeSegments = route.path.split('/').filter(s => s)
    const pathSegments = normalizedPath.split('/').filter(s => s)
    
    if (routeSegments.length !== pathSegments.length) continue
    
    const params: Record<string, string> = {}
    let match = true
    
    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i]
      const pathSegment = pathSegments[i]
      
      if (routeSegment.startsWith(':')) {
        params[routeSegment.slice(1)] = pathSegment
      } else if (routeSegment !== pathSegment) {
        match = false
        break
      }
    }
    
    if (match) {
      return { handler: route.handler, params }
    }
  }
  
  return null
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  await initDatabase(env.DB)
  await ensureAdminUser(env.DB, env)
  
  const url = new URL(request.url)
  const path = url.pathname
  const match = matchRoute('GET', path)
  
  if (match) {
    return match.handler(request, env, match.params)
  }
  
  return notFound()
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  await initDatabase(env.DB)
  await ensureAdminUser(env.DB, env)
  
  const url = new URL(request.url)
  const path = url.pathname
  
  if (path === '/api/auth/login') {
    const data = await request.json()
    const username = (data.username || '').trim()
    const password = data.password || ''
    
    if (!username || !password) return badRequest('用户名或密码不能为空')
    
    const { results } = await env.DB.prepare('SELECT username, password_hash, role FROM users WHERE username = ?').bind(username).run()
    
    if (results.length === 0) return unauthorized('用户名或密码错误')
    
    const user = results[0]
    const token = createJwt(user.username, user.role, env.JWT_SECRET)
    
    return jsonResponse({ success: true, access_token: token, user: { username: user.username, role: user.role } })
  }
  
  const match = matchRoute('POST', path)
  
  if (match) {
    return match.handler(request, env, match.params)
  }
  
  return notFound()
}

export async function onRequestPut(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  await initDatabase(env.DB)
  await ensureAdminUser(env.DB, env)
  
  const url = new URL(request.url)
  const path = url.pathname
  const match = matchRoute('PUT', path)
  
  if (match) {
    return match.handler(request, env, match.params)
  }
  
  return notFound()
}

export async function onRequestDelete(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  await initDatabase(env.DB)
  await ensureAdminUser(env.DB, env)
  
  const url = new URL(request.url)
  const path = url.pathname
  const match = matchRoute('DELETE', path)
  
  if (match) {
    return match.handler(request, env, match.params)
  }
  
  return notFound()
}

export async function onRequestOptions(context: { request: Request }): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}
