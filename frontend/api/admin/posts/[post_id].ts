export const config = {
  runtime: 'edge'
}

import { get, parseJson, success, error, run } from '../../_db'

export default async function handler(request: Request, context: { params: { post_id: string } }): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !validateToken(token)) {
    return error('Unauthorized', 401)
  }

  const postId = parseInt(context.params.post_id)
  if (isNaN(postId)) {
    return error('Invalid post ID', 400)
  }

  if (request.method === 'GET') {
    const post = await get<any>(
      `SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, published_at, created_at, updated_at 
       FROM posts WHERE id = ?`,
      [postId]
    )

    if (!post) {
      return error('文章不存在', 404)
    }

    return success({
      ...post,
      tags: parseJson<string[]>(post.tags) || []
    })
  }

  if (request.method === 'PUT') {
    const body = await request.json()
    const post = await get<any>(`SELECT * FROM posts WHERE id = ?`, [postId])

    if (!post) {
      return error('文章不存在', 404)
    }

    const now = new Date().toISOString()

    if ('title' in body) {
      const title = (body.title || '').trim()
      if (!title) return error('标题不能为空', 400)
      if (title.length > 200) return error('标题过长(<=200)', 400)
      await run(`UPDATE posts SET title = ? WHERE id = ?`, [title, postId])
    }

    if ('slug' in body) {
      const newSlug = (body.slug || '').trim() || slugify(post.title)
      const existing = await get<{ id: number }>(`SELECT id FROM posts WHERE slug = ? AND id != ?`, [newSlug, postId])
      if (existing) return error('slug 已存在', 400)
      await run(`UPDATE posts SET slug = ? WHERE id = ?`, [newSlug, postId])
    }

    for (const field of ['content', 'excerpt', 'cover_url', 'category']) {
      if (field in body) {
        if (field === 'excerpt' && body.excerpt && body.excerpt.length > 500) {
          return error('摘要过长(<=500)', 400)
        }
        await run(`UPDATE posts SET ${field} = ? WHERE id = ?`, [body[field], postId])
      }
    }

    if ('tags' in body) {
      await run(`UPDATE posts SET tags = ? WHERE id = ?`, [JSON.stringify(body.tags || []), postId])
    }

    if ('status' in body) {
      const st = body.status || 'draft'
      if (st !== 'draft' && st !== 'published') {
        return error('非法状态', 400)
      }
      await run(`UPDATE posts SET status = ? WHERE id = ?`, [st, postId])
      if (st === 'published' && !post.published_at) {
        await run(`UPDATE posts SET published_at = ? WHERE id = ?`, [now, postId])
      }
    }

    await run(`UPDATE posts SET updated_at = ? WHERE id = ?`, [now, postId])
    return success({ message: '更新成功' })
  }

  if (request.method === 'DELETE') {
    const post = await get<{ id: number }>(`SELECT id FROM posts WHERE id = ?`, [postId])
    if (!post) {
      return error('文章不存在', 404)
    }

    await run(`DELETE FROM likes WHERE post_id = ?`, [postId])
    await run(`DELETE FROM posts WHERE id = ?`, [postId])
    return success({ message: '已删除' })
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