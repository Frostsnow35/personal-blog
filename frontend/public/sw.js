const CACHE_NAME = 'blog-cache-v2'
const ASSETS = [
  '/',
  '/index.html',
  '/avatar.jpg',
  '/profile.jpg',
  '/audio/music/eikyuu%20hours.mp3'
]

// 不走 SW 缓存的路径 —— 独立页面或 Vercel 直接托管的资源
const BYPASS_PATHS = ['/uptime']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  )
})

// 网络优先，失败使用缓存（API除外）
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 跳过 API、外部域名、以及独立页面路径
  if (url.pathname.startsWith('/api/') || 
      url.hostname !== self.location.hostname ||
      BYPASS_PATHS.some(function(p) { return url.pathname === p || url.pathname.startsWith(p) })) {
    return
  }
  
  event.respondWith(
    fetch(request)
      .then((resp) => {
        // 只缓存成功的完整响应
        if (resp.ok && resp.status !== 206) {
          const cloned = resp.clone()
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(request, cloned)
            } catch (e) {
              console.warn('Cache put failed:', e)
            }
          })
        }
        return resp
      })
      .catch(() => caches.match(request))
  )
})


