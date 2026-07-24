// 仅用于注销旧版 Service Worker，安装后立即卸载自身
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  // 注销所有旧的 SW 注册，包括自身
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then(clients => {
      clients.forEach(client => {
        // 通知页面 SW 已注销
        ;(client as any).postMessage?.({ type: 'SW_UNREGISTERED' })
      })
    })
})
