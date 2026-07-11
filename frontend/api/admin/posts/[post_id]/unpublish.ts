export const config = {
  runtime: 'edge'
}

import { get, run, success, error } from '../../../_db'

export default async function handler(request: Request, context: { params: { post_id: string } }): Promise<Response> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !validateToken(token)) {
    return error('Unauthorized', 401)
  }

  const postId = parseInt(context.params.post_id)
  if (isNaN(postId)) {
    return error('Invalid post ID', 400)
  }

  const post = await get<{ id: number }>(`SELECT id FROM posts WHERE id = ?`, [postId])
  if (!post) {
    return error('文章不存在', 404)
  }

  await run(`UPDATE posts SET status = 'draft' WHERE id = ?`, [postId])
  return success({ message: '已撤回为草稿' })
}

function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' && payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}