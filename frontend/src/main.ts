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

// 注册自毁版 Service Worker：安装后立即注销所有 SW（包括自身）
// 仅在生产环境且 SW 未启用时执行一次清理
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    if (regs.length > 0) {
      // 有旧的缓存 SW 在运行 → 注册自毁 SW 覆盖并清除
      navigator.serviceWorker.register('/sw.js')
    }
    // 无论是否有旧 SW，确保自毁 SW 被注册（它会在 activate 中 unregister 一切）
  }).then(() => {
    // 二次确保：直接在页面注销所有 SW 注册
    navigator.serviceWorker.getRegistrations().then(all => {
      all.forEach(r => {
        // 只注销非自毁的 SW（自毁 SW 的文件名已经不是缓存版本）
        r.unregister()
      })
    })
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
