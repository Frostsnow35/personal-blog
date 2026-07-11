export const config = {
  runtime: 'edge'
}

import { query, parseJson, success } from '../_db'

interface PostSummary {
  id: number
  title: string
  slug: string
  excerpt: string
  category: string | null
  tags: string[]
  cover_url: string | null
  read_time: number
  views: number
  likes: number
  published_at: string | null
  created_at: string | null
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1') || 1
  const per_page = parseInt(url.searchParams.get('per_page') || '10') || 10
  const category = url.searchParams.get('category') || ''
  const tag = url.searchParams.get('tag') || ''

  let where = "WHERE status = 'published'"
  const params: any[] = []

  if (category) {
    where += " AND category = ?"
    params.push(category)
  }

  if (tag) {
    where += " AND tags LIKE ?"
    params.push(`%"${tag}"%`)
  }

  const countResult = await query<{ count: number }>(`SELECT COUNT(*) as count FROM posts ${where}`, params)
  const total = countResult[0]?.count || 0
  const pages = Math.max(1, Math.ceil(total / per_page))

  const offset = (page - 1) * per_page
  const posts = await query<PostSummary>(
    `SELECT id, title, slug, excerpt, category, tags, cover_url, read_time, views, likes, published_at, created_at 
     FROM posts ${where} 
     ORDER BY published_at DESC, created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, per_page, offset]
  )

  const items = posts.map(post => ({
    ...post,
    tags: parseJson<string[]>(post.tags) || []
  }))

  return success({
    items,
    total,
    pages,
    current_page: page
  })
}