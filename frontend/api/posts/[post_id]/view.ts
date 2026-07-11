export const config = {
  runtime: 'edge'
}

import { run, success, error } from '../../_db'

export default async function handler(request: Request, context: { params: { post_id: string } }): Promise<Response> {
  const postId = parseInt(context.params.post_id)
  if (isNaN(postId)) {
    return error('Invalid post ID', 400)
  }

  if (request.method === 'POST') {
    await run(`UPDATE posts SET views = views + 1 WHERE id = ?`, [postId])
    return success({ message: '浏览记录已更新' })
  }

  return error('Method not allowed', 405)
}