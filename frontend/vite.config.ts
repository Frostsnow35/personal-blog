import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // 在 index.html 中注入 SW 清除脚本，运行在所有模块之前
    // 浏览器加载 HTML 后立即注销所有旧 Service Worker
    {
      name: 'inject-sw-cleanup',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>
  <script>
    (function(){if('serviceWorker' in navigator&&!sessionStorage.getItem('__sw_ok')){console.log('[SW Cleanup] 发现 sessionStorage 中无 __sw_ok 标记，开始清理 Service Worker');navigator.serviceWorker.getRegistrations().then(function(r){console.log('[SW Cleanup] 找到 '+r.length+' 个 Service Worker 注册');if(r.length>0){return Promise.all(r.map(function(s){return s.unregister().then(function(){console.log('[SW Cleanup] 已注销 SW: '+s.scope)})}))}}).then(function(){sessionStorage.setItem('__sw_ok','1');console.log('[SW Cleanup] 清理完成，100ms 后重载页面');setTimeout(function(){location.reload()},100)}).catch(function(e){sessionStorage.setItem('__sw_ok','1');console.warn('[SW Cleanup] 清理异常: '+e+', 100ms 后重载页面');setTimeout(function(){location.reload()},100)})}else{sessionStorage.setItem('__sw_ok','1');console.log('[SW Cleanup] __sw_ok 已标记或 SW 不可用，跳过清理')}})()
  </script>`
        )
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001,
    open: true,
    host: '0.0.0.0',
    allowedHosts: [
      'frostsnow35.dpdns.org',
      'www.frostsnow35.dpdns.org',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'vendor': ['vue', 'vue-router', 'pinia']
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    reportCompressedSize: true,
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'three', 'gsap']
  },
  esbuild: {
    target: 'es2020',
    supported: {
      'bigint': true
    }
  }
})