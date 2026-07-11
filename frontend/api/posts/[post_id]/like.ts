export const config = {
  runtime: 'edge'
}

import { get, query, run, success, error } from '../../_db'

export default async function handler(request: Request, context: { params: { post_id: string } }): Promise<Response> {
  const postId = parseInt(context.params.post_id)
  if (isNaN(postId)) {
    return error('Invalid post ID', 400)
  }

  const ip = request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || request.ip || 'unknown'
  const ipHash = await hashIp(ip)

  const post = await get<{ likes: number }>(`SELECT likes FROM posts WHERE id = ?`, [postId])
  if (!post) {
    return error('文章不存在', 404)
  }

  if (request.method === 'GET') {
    const existing = await get<{ id: number }>(`SELECT id FROM likes WHERE post_id = ? AND ip_hash = ?`, [postId, ipHash])
    return success({
      liked: existing !== null,
      count: post.likes || 0
    })
  }

  if (request.method === 'POST') {
    const existing = await get<{ id: number }>(`SELECT id FROM likes WHERE post_id = ? AND ip_hash = ?`, [postId, ipHash])

    if (existing) {
      await run(`DELETE FROM likes WHERE id = ?`, [existing.id])
      await run(`UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?`, [postId])
      return success({
        liked: false,
        count: Math.max(0, (post.likes || 0) - 1)
      })
    } else {
      await run(`INSERT INTO likes (post_id, ip_hash) VALUES (?, ?)`, [postId, ipHash])
      await run(`UPDATE posts SET likes = likes + 1 WHERE id = ?`, [postId])
      return success({
        liked: true,
        count: (post.likes || 0) + 1
      })
    }
  }

  return error('Method not allowed', 405)
}

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode('secret-salt'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(ip))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}