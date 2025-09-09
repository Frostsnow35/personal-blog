// 本地缓存系统
import type { Profile } from '../types'

// 缓存项接口
export interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
  version: string
}

// 缓存配置
export interface CacheConfig {
  maxAge: number // 最大缓存时间（毫秒）
  version: string // 缓存版本号
  maxSize: number // 最大缓存大小（字节）
}

// 默认缓存配置
export const defaultCacheConfig: CacheConfig = {
  maxAge: 30 * 60 * 1000, // 30分钟
  version: '1.0.0',
  maxSize: 10 * 1024 * 1024 // 10MB
}

// 缓存键前缀
const CACHE_PREFIX = 'blog_cache_'
const CACHE_META_KEY = 'blog_cache_meta'

// 缓存元数据
interface CacheMeta {
  totalSize: number
  itemCount: number
  lastCleanup: number
}

// 获取缓存键
const getCacheKey = (key: string): string => `${CACHE_PREFIX}${key}`

// 获取缓存元数据
const getCacheMeta = (): CacheMeta => {
  try {
    const meta = localStorage.getItem(CACHE_META_KEY)
    return meta ? JSON.parse(meta) : {
      totalSize: 0,
      itemCount: 0,
      lastCleanup: Date.now()
    }
  } catch {
    return {
      totalSize: 0,
      itemCount: 0,
      lastCleanup: Date.now()
    }
  }
}

// 更新缓存元数据
const updateCacheMeta = (meta: Partial<CacheMeta>): void => {
  try {
    const currentMeta = getCacheMeta()
    const newMeta = { ...currentMeta, ...meta }
    localStorage.setItem(CACHE_META_KEY, JSON.stringify(newMeta))
  } catch (error) {
    // 静默处理错误
  }
}

// 计算数据大小（粗略估算）
const calculateDataSize = (data: any): number => {
  try {
    return new Blob([JSON.stringify(data)]).size
  } catch {
    return 0
  }
}

// 设置缓存
export const setCache = <T>(
  key: string,
  data: T,
  config: Partial<CacheConfig> = {}
): boolean => {
  try {
    const finalConfig = { ...defaultCacheConfig, ...config }
    const now = Date.now()
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + finalConfig.maxAge,
      version: finalConfig.version
    }
    
    const cacheKey = getCacheKey(key)
    const serialized = JSON.stringify(cacheItem)
    const dataSize = calculateDataSize(cacheItem)
    
    // 检查缓存大小限制
    const meta = getCacheMeta()
    if (meta.totalSize + dataSize > finalConfig.maxSize) {
      // 清理过期和旧的缓存项
      cleanupCache(finalConfig)
      
      // 再次检查大小
      const newMeta = getCacheMeta()
      if (newMeta.totalSize + dataSize > finalConfig.maxSize) {
        return false
      }
    }
    
    localStorage.setItem(cacheKey, serialized)
    
    // 更新元数据
    updateCacheMeta({
      totalSize: meta.totalSize + dataSize,
      itemCount: meta.itemCount + 1
    })
    
    return true
  } catch (error) {
    return false
  }
}

// 获取缓存
export const getCache = <T>(
  key: string,
  config: Partial<CacheConfig> = {}
): T | null => {
  try {
    const finalConfig = { ...defaultCacheConfig, ...config }
    const cacheKey = getCacheKey(key)
    const cached = localStorage.getItem(cacheKey)
    
    if (!cached) {
      return null
    }
    
    const cacheItem: CacheItem<T> = JSON.parse(cached)
    const now = Date.now()
    
    // 检查是否过期
    if (now > cacheItem.expiresAt) {
      removeCache(key)
      return null
    }
    
    // 检查版本是否匹配
    if (cacheItem.version !== finalConfig.version) {
      removeCache(key)
      return null
    }
    
    return cacheItem.data
  } catch (error) {
    removeCache(key)
    return null
  }
}

// 移除缓存
export const removeCache = (key: string): boolean => {
  try {
    const cacheKey = getCacheKey(key)
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      const dataSize = calculateDataSize(JSON.parse(cached))
      localStorage.removeItem(cacheKey)
      
      // 更新元数据
      const meta = getCacheMeta()
      updateCacheMeta({
        totalSize: Math.max(0, meta.totalSize - dataSize),
        itemCount: Math.max(0, meta.itemCount - 1)
      })
    }
    
    return true
  } catch (error) {
    return false
  }
}

// 清理过期缓存
export const cleanupCache = (config: Partial<CacheConfig> = {}): void => {
  try {
    const finalConfig = { ...defaultCacheConfig, ...config }
    const now = Date.now()
    const meta = getCacheMeta()
    
    let totalSize = meta.totalSize
    let itemCount = meta.itemCount
    
    // 遍历所有缓存项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(CACHE_PREFIX)) continue
      
      let cached: string | null = null
      try {
        cached = localStorage.getItem(key)
        if (!cached) continue
        
        const cacheItem = JSON.parse(cached)
        
        // 检查是否过期或版本不匹配
        if (now > cacheItem.expiresAt || cacheItem.version !== finalConfig.version) {
          const dataSize = calculateDataSize(cacheItem)
          localStorage.removeItem(key)
          
          totalSize = Math.max(0, totalSize - dataSize)
          itemCount = Math.max(0, itemCount - 1)
        }
      } catch (error) {
        // 损坏的缓存项，直接移除
        const dataSize = calculateDataSize(cached || '')
        localStorage.removeItem(key)
        
        totalSize = Math.max(0, totalSize - dataSize)
        itemCount = Math.max(0, itemCount - 1)
      }
    }
    
    // 更新元数据
    updateCacheMeta({
      totalSize,
      itemCount,
      lastCleanup: now
    })
  } catch (error) {
    // 静默处理错误
  }
}

// 清空所有缓存
export const clearAllCache = (): void => {
  try {
    const keysToRemove: string[] = []
    
    // 收集所有缓存键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    
    // 移除所有缓存项
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // 重置元数据
    updateCacheMeta({
      totalSize: 0,
      itemCount: 0,
      lastCleanup: Date.now()
    })
  } catch (error) {
    // 静默处理错误
  }
}

// 获取缓存统计信息
export const getCacheStats = (): CacheMeta => {
  return getCacheMeta()
}

// 个人资料专用缓存函数
export const profileCache = {
  // 缓存个人资料
  set: (profile: Profile): boolean => {
    return setCache('profile', profile, { maxAge: 60 * 60 * 1000 }) // 1小时
  },
  
  // 获取缓存的个人资料
  get: (): Profile | null => {
    return getCache<Profile>('profile')
  },
  
  // 移除个人资料缓存
  remove: (): boolean => {
    return removeCache('profile')
  },
  
  // 检查个人资料缓存是否有效
  isValid: (): boolean => {
    const profile = getCache<Profile>('profile')
    return profile !== null
  }
}

// 博客数据专用缓存函数
export const blogCache = {
  // 缓存博客文章
  setPosts: (posts: any[]): boolean => {
    return setCache('blog_posts', posts, { maxAge: 15 * 60 * 1000 }) // 15分钟
  },
  
  // 获取缓存的博客文章
  getPosts: (): any[] | null => {
    return getCache<any[]>('blog_posts')
  },
  
  // 缓存分类数据
  setCategories: (categories: any[]): boolean => {
    return setCache('blog_categories', categories, { maxAge: 60 * 60 * 1000 }) // 1小时
  },
  
  // 获取缓存的分类数据
  getCategories: (): any[] | null => {
    return getCache<any[]>('blog_categories')
  },
  
  // 缓存标签数据
  setTags: (tags: any[]): boolean => {
    return setCache('blog_tags', tags, { maxAge: 60 * 60 * 1000 }) // 1小时
  },
  
  // 获取缓存的标签数据
  getTags: (): any[] | null => {
    return getCache<any[]>('blog_tags')
  }
}

// 初始化缓存系统
export const initCache = (): void => {
  try {
    // 清理过期缓存
    cleanupCache()
    
    // 设置定期清理任务（每小时清理一次）
    setInterval(() => {
      cleanupCache()
    }, 60 * 60 * 1000)
  } catch (error) {
    // 静默处理错误
  }
}
