export const config = {
  runtime: 'edge',
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RouteHandler {
  method: HttpMethod
  pattern: RegExp
  handler: (request: Request, params: Record<string, string>, db: any) => Promise<Response>
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

function badRequest(message: string): Response {
  return jsonResponse({ success: false, message }, 400)
}

function serverError(message: string = 'Server error'): Response {
  return jsonResponse({ success: false, message }, 500)
}

async function hashIp(ip: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + secret)
  const d = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64)
}

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip')?.trim() ||
         ''
}

interface JwtPayload {
  sub: string
  role: string
  exp: number
  iat: number
}

async function createJwt(username: string, role: string, secret: string, expiresMinutes: number = 120): Promise<string> {
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
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payloadB64}`))
  const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${header}.${payloadB64}.${signature}`
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, signature] = parts
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBytes = new Uint8Array(signature.match(/.{2}/g)?.map(h => parseInt(h, 16)) || [])
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`${headerB64}.${payloadB64}`))
    if (!isValid) return null
    const payload = JSON.parse(atob(payloadB64))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

async function requireAdmin(request: Request): Promise<boolean> {
  const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret'
  const authHeader = request.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return false
  const token = authHeader.split(' ', 1)[1].trim()
  const payload = await verifyJwt(token, JWT_SECRET)
  return payload !== null && payload.role === 'admin'
}

function slugify(title: string): string {
  let base = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  while (base.includes('--')) base = base.replace('--', '-')
  return base.replace(/^-|-$/g, '') || 'post'
}

function parseJson(value: any): any {
  if (!value) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return null }
  }
  return value
}

class TursoClient {
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '')
    this.token = token
  }

  async execute(sql: string, params: any[] = []): Promise<{ results: any[]; lastRowId?: number; rowsAffected: number }> {
    const body = {
      requests: [
        { type: 'execute', stmt: { sql, params: params.map(p => ({ type: typeof p === 'number' ? (Number.isInteger(p) ? 'integer' : 'float') : 'text'), value: p })) } },
        { type: 'close' }
      ]
    }

    const res = await fetch(`${this.url}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error.message || 'Turso API error')

    const result = data.results?.[0]?.response?.result
    if (!result) return { results: [], rowsAffected: 0 }

    const columns = result.cols?.map((c: any) => c.name) || []
    const rows = result.rows || []
    const results = rows.map((row: any[]) => {
      const obj: Record<string, any> = {}
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i]?.value ?? null
      })
      return obj
    })

    return {
      results,
      lastRowId: result.last_insert_rowid,
      rowsAffected: result.affected_row_count || 0
    }
  }

  async batch(statements: { sql: string; params?: any[] }[]): Promise<void> {
    const body = {
      requests: [
        ...statements.map(s => ({
          type: 'execute' as const,
          stmt: {
            sql: s.sql,
            params: (s.params || []).map(p => ({ type: typeof p === 'number' ? (Number.isInteger(p) ? 'integer' : 'float') : 'text'), value: p }))
          }
        })),
        { type: 'close' as const }
      ]
    }

    const res = await fetch(`${this.url}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error.message || 'Turso API error')
  }
}

function getDb(): TursoClient {
  const url = process.env.TURSO_DATABASE_URL || ''
  const token = process.env.TURSO_AUTH_TOKEN || ''
  return new TursoClient(url, token)
}

async function initDatabase(db: TursoClient): Promise<void> {
  await db.batch([
    { sql: `CREATE TABLE IF NOT EXISTS posts (
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
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (post_id, ip_hash)
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS blog_posts (
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
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS profiles (
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
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` }
  ])
}

async function ensureAdminUser(db: TursoClient): Promise<void> {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

  const { results } = await db.execute('SELECT id FROM users WHERE username = ?', [ADMIN_USERNAME])
  if (results.length > 0) return

  const salt = crypto.randomUUID().replace(/-/g, '')
  const encoder = new TextEncoder()
  const data = encoder.encode(ADMIN_PASSWORD + salt)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const passwordHash = `pbkdf2:sha256:260000${salt}${Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')}`

  await db.execute('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [ADMIN_USERNAME, passwordHash, 'admin'])
}

async function getPosts(db: TursoClient, page: number = 1, perPage: number = 10, category?: string, tag?: string, search?: string) {
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

  const countQuery = query.replace('SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, views, likes, published_at, created_at FROM', 'SELECT COUNT(*) as count FROM').replace(' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?', '')
  query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?'
  params.push(perPage, (page - 1) * perPage)

  const [countResult, postsResult] = await Promise.all([
    db.execute(countQuery, params.slice(0, -2)),
    db.execute(query, params)
  ])

  const total = countResult.results.length > 0 ? Number(countResult.results[0].count) : 0
  const items = postsResult.results.map((post: any) => ({
    ...post,
    tags: parseJson(post.tags) || [],
    views: Number(post.views || 0),
    likes: Number(post.likes || 0),
    read_time: Number(post.read_time || 3)
  }))

  return { items, total, pages: Math.ceil(total / perPage), current_page: page }
}

const routes: RouteHandler[] = [
  {
    method: 'GET',
    pattern: /^\/api\/health$/,
    async handler() {
      return jsonResponse({ status: 'healthy', timestamp: new Date().toISOString() })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/posts(\/published)?$/,
    async handler(request, _params, db) {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const category = url.searchParams.get('category') || undefined
      const tag = url.searchParams.get('tag') || undefined
      const search = url.searchParams.get('search') || undefined

      const result = await getPosts(db, page, per_page, category, tag, search)
      return jsonResponse({ success: true, data: result })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/search$/,
    async handler(request, _params, db) {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const category = url.searchParams.get('category') || undefined
      const tag = url.searchParams.get('tag') || undefined
      const search = url.searchParams.get('search') || undefined

      const result = await getPosts(db, page, per_page, category, tag, search)
      return jsonResponse({ success: true, data: result })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/posts\/(\d+)$/,
    async handler(_request, params, db) {
      const id = parseInt(params['0'])
      const { results } = await db.execute(
        'SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, views, likes, published_at, created_at, updated_at FROM posts WHERE id = ? AND status = ?',
        [id, 'published']
      )

      if (results.length === 0) return notFound()

      const post = results[0]
      return jsonResponse({
        success: true,
        data: {
          ...post,
          tags: parseJson(post.tags) || [],
          views: Number(post.views || 0),
          likes: Number(post.likes || 0),
          read_time: Number(post.read_time || 3)
        }
      })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/posts\/slug\/([^/]+)$/,
    async handler(_request, params, db) {
      const slug = decodeURIComponent(params['0'])
      const { results } = await db.execute(
        'SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, views, likes, published_at, created_at, updated_at FROM posts WHERE slug = ? AND status = ?',
        [slug, 'published']
      )

      if (results.length === 0) return notFound()

      const post = results[0]
      return jsonResponse({
        success: true,
        data: {
          ...post,
          tags: parseJson(post.tags) || [],
          views: Number(post.views || 0),
          likes: Number(post.likes || 0),
          read_time: Number(post.read_time || 3)
        }
      })
    }
  },

  {
    method: 'POST',
    pattern: /^\/api\/posts\/(\d+)\/like$/,
    async handler(request, params, db) {
      const postId = parseInt(params['0'])
      const SECRET_KEY = process.env.SECRET_KEY || 'default-secret'
      const ip = getClientIp(request)
      const ipHash = await hashIp(ip, SECRET_KEY)

      const { results: existing } = await db.execute('SELECT id FROM likes WHERE post_id = ? AND ip_hash = ?', [postId, ipHash])

      if (existing.length > 0) {
        await db.execute('DELETE FROM likes WHERE post_id = ? AND ip_hash = ?', [postId, ipHash])
        await db.execute('UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?', [postId])
        const { results: post } = await db.execute('SELECT likes FROM posts WHERE id = ?', [postId])
        return jsonResponse({ success: true, data: { liked: false, count: Number(post[0]?.likes || 0) } })
      } else {
        await db.execute('INSERT INTO likes (post_id, ip_hash) VALUES (?, ?)', [postId, ipHash])
        await db.execute('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId])
        const { results: post } = await db.execute('SELECT likes FROM posts WHERE id = ?', [postId])
        return jsonResponse({ success: true, data: { liked: true, count: Number(post[0]?.likes || 0) } })
      }
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/posts\/(\d+)\/like$/,
    async handler(request, params, db) {
      const postId = parseInt(params['0'])
      const SECRET_KEY = process.env.SECRET_KEY || 'default-secret'
      const ip = getClientIp(request)
      const ipHash = await hashIp(ip, SECRET_KEY)

      const [{ results: existing }, { results: post }] = await Promise.all([
        db.execute('SELECT id FROM likes WHERE post_id = ? AND ip_hash = ?', [postId, ipHash]),
        db.execute('SELECT likes FROM posts WHERE id = ?', [postId])
      ])

      return jsonResponse({
        success: true,
        data: {
          liked: existing.length > 0,
          count: Number(post[0]?.likes || 0)
        }
      })
    }
  },

  {
    method: 'POST',
    pattern: /^\/api\/posts\/(\d+)\/view$/,
    async handler(_request, params, db) {
      const postId = parseInt(params['0'])
      await db.execute('UPDATE posts SET views = views + 1 WHERE id = ?', [postId])
      const { results } = await db.execute('SELECT views FROM posts WHERE id = ?', [postId])
      return jsonResponse({ success: true, data: { views: Number(results[0]?.views || 0) } })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/categories$/,
    async handler(_request, _params, db) {
      const { results } = await db.execute('SELECT id, name, description FROM categories ORDER BY name')
      return jsonResponse(results)
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/categories\/published$/,
    async handler(_request, _params, db) {
      const { results } = await db.execute(`
        SELECT category, COUNT(*) as count 
        FROM posts 
        WHERE status = 'published' AND category IS NOT NULL AND category != ''
        GROUP BY category 
        ORDER BY count DESC
      `)
      return jsonResponse({ success: true, data: results.map(r => ({ ...r, count: Number(r.count) })) })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/tags$/,
    async handler(_request, _params, db) {
      const { results } = await db.execute('SELECT id, name FROM tags ORDER BY name')
      return jsonResponse(results)
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/tags\/published$/,
    async handler(_request, _params, db) {
      const { results: posts } = await db.execute(`SELECT tags FROM posts WHERE status = 'published' AND tags IS NOT NULL AND tags != ''`)
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
    pattern: /^\/api\/stats$/,
    async handler(_request, _params, db) {
      const [{ results: posts }, { results: categories }, { results: tags }] = await Promise.all([
        db.execute('SELECT COUNT(*) as count FROM posts'),
        db.execute('SELECT COUNT(*) as count FROM categories'),
        db.execute('SELECT COUNT(*) as count FROM tags')
      ])

      return jsonResponse({
        total_posts: Number(posts[0]?.count || 0),
        total_categories: Number(categories[0]?.count || 0),
        total_tags: Number(tags[0]?.count || 0)
      })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/profile$/,
    async handler(_request, _params, db) {
      const { results } = await db.execute('SELECT * FROM profiles LIMIT 1')

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
          contact_markdown: '',
          cooperation_markdown: '',
          site_notice_markdown: '',
          updated_at: new Date().toISOString()
        })
      }

      const profile = results[0]
      return jsonResponse({
        ...profile,
        skills: parseJson(profile.skills) || [],
        interests: parseJson(profile.interests) || [],
        featured_slugs: parseJson(profile.featured_slugs) || [],
        updated_at: profile.updated_at ? new Date(profile.updated_at).toISOString() : null
      })
    }
  },

  {
    method: 'PUT',
    pattern: /^\/api\/profile$/,
    async handler(request, _params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const data = await request.json()
      const { results } = await db.execute('SELECT id FROM profiles LIMIT 1')

      if (results.length === 0) {
        await db.execute(`
          INSERT INTO profiles (name, avatar, bio, email, location, website, github, twitter, skills, interests, education, occupation, featured_slugs, contact_markdown, cooperation_markdown, site_notice_markdown)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
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
          data.site_notice_markdown || ''
        ])
      } else {
        const profileId = results[0].id
        await db.execute(`
          UPDATE profiles SET name = ?, avatar = ?, bio = ?, email = ?, location = ?, website = ?, github = ?, twitter = ?, skills = ?, interests = ?, education = ?, occupation = ?, featured_slugs = ?, contact_markdown = ?, cooperation_markdown = ?, site_notice_markdown = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [
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
          profileId
        ])
      }

      return jsonResponse({ success: true, message: '个人资料更新成功' })
    }
  },

  {
    method: 'POST',
    pattern: /^\/api\/auth\/login$/,
    async handler(request, _params, db) {
      const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret'
      const data = await request.json()
      const username = (data.username || '').trim()
      const password = data.password || ''

      if (!username || !password) return badRequest('用户名或密码不能为空')

      const { results } = await db.execute('SELECT username, password_hash, role FROM users WHERE username = ?', [username])

      if (results.length === 0) return unauthorized('用户名或密码错误')

      const user = results[0]
      const token = await createJwt(user.username, user.role, JWT_SECRET)

      return jsonResponse({ success: true, access_token: token, user: { username: user.username, role: user.role } })
    }
  },

  {
    method: 'GET',
    pattern: /^\/api\/admin\/posts$/,
    async handler(request, _params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const per_page = parseInt(url.searchParams.get('per_page') || '10')
      const status = url.searchParams.get('status') || undefined
      const category = url.searchParams.get('category') || undefined

      let query = 'SELECT id, title, slug, status, category, tags, updated_at FROM posts'
      const params: any[] = []
      const conditions: string[] = []

      if (status) {
        conditions.push('status = ?')
        params.push(status)
      }
      if (category) {
        conditions.push('category = ?')
        params.push(category)
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      const countQuery = query.replace('SELECT id, title, slug, status, category, tags, updated_at FROM', 'SELECT COUNT(*) as count FROM').replace(' ORDER BY updated_at DESC LIMIT ? OFFSET ?', '')
      query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      params.push(per_page, (page - 1) * per_page)

      const [countResult, postsResult] = await Promise.all([
        db.execute(countQuery, params.slice(0, -2)),
        db.execute(query, params)
      ])

      const total = countResult.results.length > 0 ? Number(countResult.results[0].count) : 0
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
    pattern: /^\/api\/admin\/posts\/(\d+)$/,
    async handler(request, params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const id = parseInt(params['0'])
      const { results } = await db.execute(`
        SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at, created_at, updated_at 
        FROM posts WHERE id = ?
      `, [id])

      if (results.length === 0) return notFound()

      const post = results[0]
      return jsonResponse({
        success: true,
        data: {
          ...post,
          tags: parseJson(post.tags) || [],
          views: Number(post.views || 0),
          likes: Number(post.likes || 0),
          read_time: Number(post.read_time || 3),
          published_at: post.published_at ? new Date(post.published_at).toISOString() : null,
          created_at: post.created_at ? new Date(post.created_at).toISOString() : null,
          updated_at: post.updated_at ? new Date(post.updated_at).toISOString() : null
        }
      })
    }
  },

  {
    method: 'POST',
    pattern: /^\/api\/admin\/posts$/,
    async handler(request, _params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const data = await request.json()
      const title = (data.title || '').trim()

      if (!title) return badRequest('标题不能为空')
      if (title.length > 200) return badRequest('标题过长(<=200)')

      let slug = (data.slug || '').trim() || slugify(title)
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(slug)) return badRequest('slug 格式仅允许小写字母、数字及中划线')

      const { results: existing } = await db.execute('SELECT id FROM posts WHERE slug = ?', [slug])
      if (existing.length > 0) return badRequest('slug 已存在')

      const excerpt = (data.excerpt || '').trim()
      if (excerpt.length > 500) return badRequest('摘要过长(<=500)')

      const status = data.status || 'draft'
      const words = (data.content || '').replace(/\n/g, '').length
      const read_time = Math.max(1, Math.floor(words / 300))

      const result = await db.execute(`
        INSERT INTO posts (title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ])

      return jsonResponse({ success: true, data: { id: result.lastRowId }, message: '创建成功' })
    }
  },

  {
    method: 'PUT',
    pattern: /^\/api\/admin\/posts\/(\d+)$/,
    async handler(request, params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const id = parseInt(params['0'])
      const data = await request.json()

      const { results: existingPost } = await db.execute('SELECT * FROM posts WHERE id = ?', [id])
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
          const { results: slugExists } = await db.execute('SELECT id FROM posts WHERE slug = ? AND id != ?', [slug, id])
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
        const content = data.content !== undefined ? data.content : post.content
        const words = (content || '').replace(/\n/g, '').length
        updates.push('read_time = ?')
        updateParams.push(Math.max(1, Math.floor(words / 300)))

        updates.push('updated_at = CURRENT_TIMESTAMP')
        updateParams.push(id)

        await db.execute(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, updateParams)
      }

      return jsonResponse({ success: true, message: '更新成功' })
    }
  },

  {
    method: 'DELETE',
    pattern: /^\/api\/admin\/posts\/(\d+)$/,
    async handler(request, params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const id = parseInt(params['0'])
      await db.execute('DELETE FROM posts WHERE id = ?', [id])
      return jsonResponse({ success: true, message: '已删除' })
    }
  },

  {
    method: 'POST',
    pattern: /^\/api\/admin\/posts\/(\d+)\/publish$/,
    async handler(request, params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const id = parseInt(params['0'])
      await db.execute('UPDATE posts SET status = ?, published_at = COALESCE(published_at, CURRENT_TIMESTAMP) WHERE id = ?', ['published', id])
      return jsonResponse({ success: true, message: '已发布' })
    }
  },

  {
    method: 'POST',
    pattern: /^\/api\/admin\/posts\/(\d+)\/unpublish$/,
    async handler(request, params, db) {
      if (!(await requireAdmin(request))) return unauthorized()

      const id = parseInt(params['0'])
      await db.execute('UPDATE posts SET status = ? WHERE id = ?', ['draft', id])
      return jsonResponse({ success: true, message: '已撤回为草稿' })
    }
  }
]

function matchRoute(method: HttpMethod, path: string): { handler: RouteHandler['handler']; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue
    const match = path.match(route.pattern)
    if (match) {
      const params: Record<string, string> = {}
      for (let i = 1; i < match.length; i++) {
        params[String(i - 1)] = match[i]
      }
      return { handler: route.handler, params }
    }
  }
  return null
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  try {
    const db = getDb()
    await initDatabase(db)
    await ensureAdminUser(db)

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method as HttpMethod

    const match = matchRoute(method, path)
    if (match) {
      return match.handler(request, match.params, db)
    }

    return notFound()
  } catch (error: any) {
    console.error('API error:', error)
    return serverError(error.message || 'Server error')
  }
}
