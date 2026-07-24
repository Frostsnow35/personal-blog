// BUILD_HASH 会在每次构建时由 Vite 插件替换为唯一哈希，确保浏览器自动更新 SW
const CACHE_NAME = 'blog-cache-__BUILD_HASH__'

// 不缓存 HTML（index.html），避免旧 HTML 引用已不存在的 JS/CSS 文件
// 只预缓存少数关键静态资源
const ASSETS = [
  '/avatar.jpg',
  '/profile.jpg',
  '/audio/music/eikyuu%20hours.mp3'
]

const BYPASS_PATHS = ['/uptime']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await clients.claim()
      const keys = await caches.keys()
      // 删除所有非当前版本的缓存
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过 API、外部域名、以及独立页面路径
  if (url.pathname.startsWith('/api/') ||
      url.hostname !== self.location.hostname ||
      BYPASS_PATHS.some(function(p) { return url.pathname === p || url.pathname.startsWith(p) })) {
    return
  }

  // HTML 请求：永远走网络，不缓存
  // 避免旧 HTML 引用已不存在的 JS/CSS 文件
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  event.respondWith(
    fetch(request)
      .then((resp) => {
        if (resp.ok && resp.status !== 206) {
          const cloned = resp.clone()
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(request, cloned)
            } catch (e) {
              // 静默忽略缓存失败
            }
          })
        }
        return resp
      })
      .catch(() => caches.match(request))
  )
})
