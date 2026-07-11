export const config = {
  runtime: 'edge'
}

import { query, parseJson, success } from '../_db'

export default async function handler(): Promise<Response> {
  const posts = await query<{ tags: string }>(
    `SELECT tags FROM posts WHERE status = 'published' AND tags IS NOT NULL AND tags != ''`
  )

  const tagCounts: Record<string, number> = {}
  for (const post of posts) {
    const tags = parseJson<string[]>(post.tags) || []
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }

  const tagsWithCount = Object.entries(tagCounts).map(([name, count]) => ({ name, count }))
  tagsWithCount.sort((a, b) => b.count - a.count)

  return success({
    items: tagsWithCount,
    total: tagsWithCount.length
  })
}