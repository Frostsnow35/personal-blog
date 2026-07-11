export const config = {
  runtime: 'edge'
}

import { get, parseJson, success, error } from '../../_db'

interface PostDetail {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  cover_url: string | null
  category: string | null
  tags: string[]
  read_time: number
  views: number
  likes: number
  published_at: string | null
  created_at: string | null
  updated_at: string | null
}

export default async function handler(request: Request, context: { params: { slug: string } }): Promise<Response> {
  const slug = context.params.slug

  const post = await get<PostDetail>(
    `SELECT id, title, slug, content, excerpt, status, cover_url, category, tags, read_time, views, likes, published_at, created_at, updated_at 
     FROM posts WHERE slug = ? AND status = 'published'`,
    [slug]
  )

  if (!post) {
    return error('文章不存在或未发布', 404)
  }

  return success({
    ...post,
    tags: parseJson<string[]>(post.tags) || []
  })
}