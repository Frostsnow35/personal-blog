// Prefer environment variable in production builds (Netlify). If missing, fallback to relative /api
// so Netlify can proxy via redirects, and finally to localhost in dev.
const envBase = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
  || (typeof process !== 'undefined' && (process as any).env?.VITE_API_BASE_URL)
  || ''

const normalizedEnvBase = envBase ? String(envBase).replace(/\/$/, '') : ''

const BASE_URL = normalizedEnvBase
  || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '')
  || 'http://localhost:5000/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

function withAuth(headers: HeadersInit = {}) {
  const token = localStorage.getItem('access_token')
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
}

async function request<T>(path: string, method: HttpMethod, body?: any, signal?: AbortSignal): Promise<T> {
  const isForm = body instanceof FormData
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: withAuth(isForm ? {} : { 'Content-Type': 'application/json' }),
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    signal,
    // 添加缓存策略
    cache: method === 'GET' ? 'default' : 'no-cache'
  })

  const text = await res.text()
  let data: any = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = {} }

  // 统一处理 401/403：清理登录态并跳转登录页
  if (res.status === 401 || res.status === 403) {
    try {
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
    } catch {}
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin-login')) {
      // 保留原目标地址，登录成功后可返回（可选：加入 redirect 参数）
      window.location.href = '/admin-login'
    }
    throw new Error(data?.message || `HTTP ${res.status}`)
  }

  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.message || `HTTP ${res.status}`)
  }
  return data as T
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, 'GET', undefined, signal),
  post: <T>(path: string, body?: any, signal?: AbortSignal) => request<T>(path, 'POST', body, signal),
  put: <T>(path: string, body?: any, signal?: AbortSignal) => request<T>(path, 'PUT', body, signal),
  delete: <T>(path: string, body?: any, signal?: AbortSignal) => request<T>(path, 'DELETE', body, signal),
  upload: <T>(path: string, form: FormData, signal?: AbortSignal) => request<T>(path, 'POST', form, signal)
}


