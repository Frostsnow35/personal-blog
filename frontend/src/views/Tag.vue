<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 导航栏 -->
    <nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gradient">个人博客</h1>
          </div>
          <div class="hidden md:flex items-center space-x-8">
            <router-link to="/home" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">首页</router-link>
            <router-link to="/archive" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">归档</router-link>
            <router-link to="/category" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">分类</router-link>
            <router-link to="/tag" class="text-ocean-600 dark:text-ocean-400 font-medium">标签</router-link>
            <router-link to="/about" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">关于</router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">标签云</h1>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">正在加载标签...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">加载失败</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <button 
          @click="fetchPublishedTags"
          class="px-6 py-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
        >
          重试
        </button>
      </div>

      <!-- 标签云 -->
      <div v-else-if="tags.length > 0" class="card p-8 mb-8">
        <div class="flex flex-wrap gap-4 justify-center">
          <button
            v-for="tag in tags"
            :key="tag.name"
            @click="selectTag(tag.name)"
            class="px-6 py-3 bg-gradient-to-r from-ocean-500 to-sea-500 text-white rounded-full hover:from-ocean-600 hover:to-sea-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <span class="text-lg font-medium">{{ tag.name }}</span>
            <span class="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">{{ tag.count }}</span>
          </button>
        </div>
      </div>

      <!-- 标签统计 -->
      <div v-if="tags.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="tag in tags" 
          :key="tag.name"
          class="card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          @click="selectTag(tag.name)"
        >
          <div class="p-6 text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-ocean-500 to-sea-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ tag.name }}</h3>
            <div class="flex items-center justify-center">
              <span class="px-4 py-2 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-sm font-medium">
                {{ tag.count }} 篇文章
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无标签提示 -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">暂无标签</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">还没有创建任何标签</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Tag {
  name: string
  count: number
}

const router = useRouter()
const tags = ref<Tag[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const selectTag = (tagName: string) => {
  router.push({
    path: '/home',
    query: { tag: tagName }
  })
}

const fetchPublishedTags = async () => {
  try {
    loading.value = true
    error.value = null
    
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/tags/published')
    
    if (result.success) {
      tags.value = result.data
    } else {
      error.value = result.message || '获取标签失败'
    }
  } catch (err) {
    console.error('获取标签失败:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPublishedTags()
})

// 预留：若后端为标签提供封面/背景，可共用此函数
const getCoverSrc = (src?: string) => {
  if (!src) return ''
  try {
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src
    return `/${src.replace(/^\/+/, '')}`
  } catch {
    return src
  }
}

// 预留：封面加载失败占位（未来标签封面支持时复用）
const onCoverError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.objectFit = 'contain'
  target.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop stop-color='#e5e7eb' offset='0%'/>
          <stop stop-color='#d1d5db' offset='100%'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
    </svg>`
  )
}
</script>

