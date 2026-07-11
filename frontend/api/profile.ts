export const config = {
  runtime: 'edge'
}

import { get, parseJson, success, error, run } from './_db'

interface Profile {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  email: string | null
  location: string | null
  website: string | null
  github: string | null
  twitter: string | null
  skills: string[]
  interests: string[]
  education: string | null
  occupation: string | null
  featured_slugs: string[]
  contact_markdown: string | null
  cooperation_markdown: string | null
  site_notice_markdown: string | null
  updated_at: string | null
}

function createDefaultProfile(): Profile {
  return {
    id: 1,
    name: '霜雪旧曾谙',
    avatar: '/avatar.jpg',
    bio: '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者',
    email: 'example@email.com',
    location: '中国',
    website: 'https://example.com',
    github: 'https://github.com/username',
    twitter: 'https://twitter.com/username',
    skills: ['Vue.js', 'Python', 'Flask', 'MySQL', 'TypeScript', 'Tailwind CSS'],
    interests: ['二次元', '海洋', '自然', '哲学', '技术分享'],
    education: '计算机科学与技术',
    occupation: '学生',
    featured_slugs: [],
    contact_markdown: '',
    cooperation_markdown: '',
    site_notice_markdown: '',
    updated_at: new Date().toISOString()
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    const profile = await get<Profile>(`SELECT * FROM profiles LIMIT 1`)

    if (!profile) {
      return success(createDefaultProfile())
    }

    return success({
      ...profile,
      skills: parseJson<string[]>(profile.skills) || [],
      interests: parseJson<string[]>(profile.interests) || [],
      featured_slugs: parseJson<string[]>(profile.featured_slugs) || []
    })
  }

  if (request.method === 'PUT') {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !validateToken(token)) {
      return error('Unauthorized', 401)
    }

    const body = await request.json()
    const profile = await get<Profile>(`SELECT * FROM profiles LIMIT 1`)

    const now = new Date().toISOString()

    if (!profile) {
      await run(
        `INSERT INTO profiles (name, avatar, bio, email, location, website, github, twitter, skills, interests, education, occupation, featured_slugs, contact_markdown, cooperation_markdown, site_notice_markdown, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.name || '',
          body.avatar || null,
          body.bio || null,
          body.email || null,
          body.location || null,
          body.website || null,
          body.github || null,
          body.twitter || null,
          JSON.stringify(body.skills || []),
          JSON.stringify(body.interests || []),
          body.education || null,
          body.occupation || null,
          JSON.stringify(body.featured_slugs || []),
          body.contact_markdown || '',
          body.cooperation_markdown || '',
          body.site_notice_markdown || '',
          now
        ]
      )
    } else {
      await run(
        `UPDATE profiles SET name=?, avatar=?, bio=?, email=?, location=?, website=?, github=?, twitter=?, skills=?, interests=?, education=?, occupation=?, featured_slugs=?, contact_markdown=?, cooperation_markdown=?, site_notice_markdown=?, updated_at=? WHERE id=?`,
        [
          body.name !== undefined ? body.name : profile.name,
          body.avatar !== undefined ? body.avatar : profile.avatar,
          body.bio !== undefined ? body.bio : profile.bio,
          body.email !== undefined ? body.email : profile.email,
          body.location !== undefined ? body.location : profile.location,
          body.website !== undefined ? body.website : profile.website,
          body.github !== undefined ? body.github : profile.github,
          body.twitter !== undefined ? body.twitter : profile.twitter,
          body.skills !== undefined ? JSON.stringify(body.skills) : profile.skills,
          body.interests !== undefined ? JSON.stringify(body.interests) : profile.interests,
          body.education !== undefined ? body.education : profile.education,
          body.occupation !== undefined ? body.occupation : profile.occupation,
          body.featured_slugs !== undefined ? JSON.stringify(body.featured_slugs) : profile.featured_slugs,
          body.contact_markdown !== undefined ? body.contact_markdown : profile.contact_markdown,
          body.cooperation_markdown !== undefined ? body.cooperation_markdown : profile.cooperation_markdown,
          body.site_notice_markdown !== undefined ? body.site_notice_markdown : profile.site_notice_markdown,
          now,
          profile.id
        ]
      )
    }

    return success({ message: '个人资料更新成功' })
  }

  return error('Method not allowed', 405)
}

function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' && payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}