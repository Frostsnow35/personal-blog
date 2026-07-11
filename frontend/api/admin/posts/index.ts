export const config = {
  runtime: 'edge'
}

import { query, parseJson, success, error, run } from '../../_db'

export default async function handler(request: Request): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !validateToken(token)) {
    return error('Unauthorized', 401)
  }

  if (request.method === 'GET') {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1') || 1
    const per_page = parseInt(url.searchParams.get('per_page') || '10') || 10
    const status = url.searchParams.get('status') || ''
    const q = url.searchParams.get('q') || ''

    let where = ''
    const params: any[] = []

    if (status) {
      where += (where ? ' AND ' : 'WHERE') + ' status = ?'
      params.push(status)
    }

    if (q) {
      const pattern = `%${q}%`
      where += (where ? ' AND ' : 'WHERE') + ' (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)'
      params.push(pattern, pattern, pattern)
    }

    const countResult = await query<{ count: number }>(`SELECT COUNT(*) as count FROM posts ${where}`, params)
    const total = countResult[0]?.count || 0
    const pages = Math.max(1, Math.ceil(total / per_page))

    const offset = (page - 1) * per_page
    const posts = await query<any>(
      `SELECT id, title, slug, status, category, tags, updated_at 
       FROM posts ${where} 
       ORDER BY updated_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, per_page, offset]
    )

    const items = posts.map(post => ({
      ...post,
      tags: parseJson<string[]>(post.tags) || []
    }))

    return success({ items, total, page, pages })
  }

  if (request.method === 'POST') {
    const body = await request.json()
    const title = (body.title || '').trim()

    if (!title) {
      return error('标题不能为空', 400)
    }

    if (title.length > 200) {
      return error('标题过长(<=200)', 400)
    }

    if (body.excerpt && body.excerpt.length > 500) {
      return error('摘要过长(<=500)', 400)
    }

    const slug = (body.slug || '').trim() || slugify(title)
    const existingSlug = await query<{ id: number }>(`SELECT id FROM posts WHERE slug = ?`, [slug])
    if (existingSlug.length > 0) {
      return error('slug 已存在', 400)
    }

    const now = new Date().toISOString()
    const status = body.status || 'draft'

    await run(
      `INSERT INTO posts (title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        body.content || '',
        body.excerpt || '',
        status,
        body.cover_url || null,
        body.category || null,
        JSON.stringify(body.tags || []),
        Math.max(1, Math.floor((body.content || '').length / 300)),
        status === 'published' ? now : null,
        now,
        now
      ]
    )

    const inserted = await query<{ id: number }>(`SELECT id FROM posts WHERE slug = ?`, [slug])
    return success({ id: inserted[0]?.id, message: '创建成功' })
  }

  return error('Method not allowed', 405)
}

function slugify(title: string): string {
  let base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
  return base || 'post'
}

function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' && payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}