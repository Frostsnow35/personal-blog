export const config = {
  runtime: 'edge'
}

import { query, success, error } from './_db'

export default async function handler(): Promise<Response> {
  try {
    const posts = await query(`SELECT COUNT(*) as count FROM posts`)
    return success({ 
      status: 'ok', 
      database: 'connected',
      posts_count: posts[0]?.count || 0
    })
  } catch (e) {
    const err = e as Error
    return success({ 
      status: 'ok', 
      database: 'error',
      error: err.message 
    })
  }
}