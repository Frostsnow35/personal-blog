export const config = {
  runtime: 'edge'
}

import { query, success } from '../_db'

export default async function handler(): Promise<Response> {
  const categories = await query<{ name: string; count: number }>(
    `SELECT category as name, COUNT(*) as count 
     FROM posts 
     WHERE status = 'published' AND category IS NOT NULL AND category != '' 
     GROUP BY category 
     ORDER BY count DESC`
  )

  return success({
    items: categories,
    total: categories.length
  })
}