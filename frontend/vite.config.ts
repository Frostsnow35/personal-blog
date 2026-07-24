import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'

// 每次构建生成唯一哈希，注入 sw.js 保证浏览器检测到 SW 内容变更
function swVersionInjector(): import('vite').Plugin {
  return {
    name: 'sw-version-injector',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/sw.js')
      try {
        let content = readFileSync(swPath, 'utf-8')
        const hash = createHash('md5').update(String(Date.now())).digest('hex').slice(0, 12)
        content = content.replace(/__BUILD_HASH__/g, hash)
        writeFileSync(swPath, content, 'utf-8')
      } catch {
        // sw.js 不存在则静默忽略（开发模式）
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), swVersionInjector()],
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