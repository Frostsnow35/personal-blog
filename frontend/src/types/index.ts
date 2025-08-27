// 博客相关类型定义
export interface BlogPost {
  id: number
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  publishDate: string
  readTime: number
  coverImage?: string
}

export interface Category {
  name: string
  count: number
  description?: string
}

export interface Tag {
  name: string
  count: number
}

export interface Song {
  id: number
  title: string
  artist: string
  url: string
  duration: number
}

// 社交媒体链接类型
export interface SocialLink {
  platform: 'github' | 'bilibili' | 'email' | 'website' | 'twitter' | 'qq' | 'wechat' | 'linkedin' | 'youtube'
  url: string
  displayName: string
  icon: string
  isPublic: boolean
}

// 头像信息类型
export interface AvatarInfo {
  current: string
  original: string
  thumbnail: string
  lastUpdated: string
}

// 个人资料类型
export interface Profile {
  id: number
  name: string
  avatar: string
  avatarInfo?: AvatarInfo
  bio: string
  email?: string
  location?: string
  website?: string
  socialLinks?: SocialLink[]
  skills: string[]
  interests: string[]
  education?: string
  occupation?: string
  updatedAt: string
}

// API响应类型
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
