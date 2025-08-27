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
  if (url.pathname.startsWith('/api/')) {
    return // 跳过 API
  }
  event.respondWith(
    fetch(request)
      .then((resp) => {
        const cloned = resp.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        return resp
      })
      .catch(() => caches.match(request))
  )
})


