// 自毁版 Service Worker：安装后立即注销所有 SW 注册（包括自身）
// 用于清除旧版缓存 SW 的残留
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  // 立刻抢占所有客户端
  self.clients.claim()
  // 注销所有 SW 注册
  self.registration.unregister()
})
