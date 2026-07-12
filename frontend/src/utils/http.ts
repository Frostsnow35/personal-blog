const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
const envBase = viteEnv.VITE_API_BASE_URL || ''
const normalizedEnvBase = envBase ? String(envBase).replace(/\/$/, '') : ''

const BASE_URL =
  normalizedEnvBase ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : '')

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestCacheConfig {
  enabled?: boolean
  maxAge?: number
}

const defaultCacheConfig: RequestCacheConfig = {
  enabled: true,
  maxAge: 30 * 60 * 1000
}

function buildCacheKey(path: string): string {
  const url = new URL(path, BASE_URL)
  const params = Array.from(url.searchParams.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  const pathname = url.pathname
  return params ? `${pathname}?${params}` : pathname
}

import { setCache, getCache } from './cache'

// 顶层 HTTP 加载追踪：用于顶部进度条
let _active = 0
let _showTimer: number | null = null
let _hideTimer: number | null = null
const LOADING_KEY = '__http__'

function _bumpLoading(delta: number) {
  _active = Math.max(0, _active + delta)
  if (_active > 0) {
    if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null }
    if (_showTimer == null) {
      // 100ms 后再显示，避免快速请求引起的闪烁
      _showTimer = window.setTimeout(() => {
        _showTimer = null
        if (_active > 0) {
          import('./loadingManager').then(m => m.setLoading(LOADING_KEY, true))
        }
      }, 100)
    }
  } else {
    if (_showTimer) { clearTimeout(_showTimer); _showTimer = null }
    // 250ms 延迟再隐藏，让 100% 状态可见
    if (_hideTimer) clearTimeout(_hideTimer)
    _hideTimer = window.setTimeout(() => {
      _hideTimer = null
      import('./loadingManager').then(m => m.setLoading(LOADING_KEY, false))
    }, 250)
  }
}

function withAuth(headers: HeadersInit = {}) {
  const token = localStorage.getItem('access_token')
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
}

async function request<T>(path: string, method: HttpMethod, body?: any, signal?: AbortSignal, cacheConfig?: RequestCacheConfig): Promise<T> {
  const finalCacheConfig = { ...defaultCacheConfig, ...cacheConfig }

  if (method === 'GET' && finalCacheConfig.enabled) {
    const cacheKey = buildCacheKey(path)
    const cached = getCache<T>(cacheKey, { maxAge: finalCacheConfig.maxAge })
    if (cached !== null) {
      return cached
    }
  }

  _bumpLoading(1)
  try {
    const isForm = body instanceof FormData
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: withAuth(isForm ? {} : { 'Content-Type': 'application/json' }),
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      signal,
      cache: method === 'GET' ? 'default' : 'no-cache'
    })

    const text = await res.text()
    let data: any = {}
    try { data = text ? JSON.parse(text) : {} } catch { data = {} }

    if (res.status === 401 || res.status === 403) {
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth_user')
      } catch {}
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin-login')) {
        window.location.href = '/admin-login'
      }
      throw new Error(data?.message || `HTTP ${res.status}`)
    }

    if (!res.ok || (data && data.success === false)) {
      throw new Error(data?.message || `HTTP ${res.status}`)
    }

    if (method === 'GET' && finalCacheConfig.enabled) {
      const cacheKey = buildCacheKey(path)
      setCache(cacheKey, data, { maxAge: finalCacheConfig.maxAge })
    }

    return data as T
  } finally {
    _bumpLoading(-1)
  }
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal, cacheConfig?: RequestCacheConfig) => request<T>(path, 'GET', undefined, signal, cacheConfig),
  post: <T>(path: string, body?: any, signal?: AbortSignal) => request<T>(path, 'POST', body, signal),
  put: <T>(path: string, body?: any, signal?: AbortSignal) => request<T>(path, 'PUT', body, signal),
  delete: <T>(path: string, body?: any, signal?: AbortSignal) => request<T>(path, 'DELETE', body, signal),
  upload: <T>(path: string, form: FormData, signal?: AbortSignal) => request<T>(path, 'POST', form, signal)
}


