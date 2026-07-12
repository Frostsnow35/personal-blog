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
          'tiptap': [
            '@tiptap/core',
            '@tiptap/pm',
            '@tiptap/starter-kit',
            '@tiptap/vue-3',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-text-style',
            'tiptap-markdown',
            'dompurify',
            'markdown-it'
          ],
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