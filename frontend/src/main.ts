import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import lazyImg from './directives/lazyImg'

const app = createApp(App)

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
