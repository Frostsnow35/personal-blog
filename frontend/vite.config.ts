import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
    allowedHosts: [
      'frostsnow35.dpdns.org',
      'www.frostsnow35.dpdns.org',
      'localhost',
      '127.0.0.1'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap
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
        // 代码分割策略
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'vendor': ['vue', 'vue-router', 'pinia']
        },
        // 资源文件名优化
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 开启 brotli 大小报告（提示构建体积）
    reportCompressedSize: true,
    // 小图片内联，减少请求
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'three', 'gsap']
  },
  // 预构建优化
  esbuild: {
    target: 'es2020',
    supported: {
      'bigint': true
    }
  }
})
