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

// 注册 Service Worker（仅在生产环境且支持时）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 忽略注册失败
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
