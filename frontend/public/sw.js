const CACHE_NAME = 'blog-cache-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/avatar.jpg',
  '/profile.jpg',
  '/audio/music/eikyuu%20hours.mp3'
]

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
  
  // 跳过 API 和外部域名
  if (url.pathname.startsWith('/api/') || 
      url.hostname !== self.location.hostname) {
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


