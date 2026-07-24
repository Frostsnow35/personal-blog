import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import lazyImg from './directives/lazyImg'

const app = createApp(App)

// 生产环境优化
if (import.meta.env.PROD) {
  // 禁用Vue开发工具
  app.config.performance = false
  // 禁用警告
  app.config.warnHandler = () => {}
}

app.use(createPinia())
app.use(router)
app.directive('lazy-img', lazyImg)

app.mount('#app')

// 注册自毁版 Service Worker：安装后立即注销所有 SW
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // 先尝试注销所有已存在的 SW
  navigator.serviceWorker.getRegistrations().then(regs => {
    if (regs.length > 0) {
      // 如果已有 SW 在运行（旧版缓存 SW），注册自毁 SW 覆盖
      navigator.serviceWorker.register('/sw.js').then(() => {
        // 自毁 SW 会自动 skipWaiting + unregister
        console.log('[sw] self-destruct SW registered to clean up old caches')
      }).catch(() => {})
    }
  })
}

// 预加载关键资源
if (import.meta.env.PROD) {
  // 预加载关键页面
  const preloadPages = ['/home', '/about']
  preloadPages.forEach(page => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = page
    document.head.appendChild(link)
  })
}
