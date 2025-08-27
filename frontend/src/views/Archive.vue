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
            <router-link to="/archive" class="text-ocean-600 dark:text-ocean-400 font-medium">归档</router-link>
            <router-link to="/category" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">分类</router-link>
            <router-link to="/tag" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">标签</router-link>
            <router-link to="/about" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">关于</router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">文章归档</h1>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">正在加载归档...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">加载失败</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <button 
          @click="fetchPublishedPosts"
          class="px-6 py-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
        >
          重试
        </button>
      </div>

      <!-- 归档列表 -->
      <div v-else-if="posts.length > 0" class="space-y-8">
        <div v-for="(group, year) in groupedPosts" :key="year" class="card">
          <div class="p-6">
            <h2 class="text-2xl font-bold text-ocean-600 dark:text-ocean-400 mb-4">{{ year }}年</h2>
            <div class="space-y-4">
              <div v-for="post in group" :key="post.id" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <!-- 封面（小图） -->
                <div v-if="post.cover_url" class="mr-4 w-28 h-16 rounded overflow-hidden flex-shrink-0">
                  <img
                    v-lazy-img="getCoverSrc(post.cover_url)"
                    :alt="post.title || '文章封面'"
                    class="w-full h-full object-cover bg-gray-200 dark:bg-gray-700"
                    @error="onCoverError($event)"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    <router-link :to="`/post/${post.slug}`" class="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                      {{ post.title }}
                    </router-link>
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ post.excerpt }}</p>
                  <div class="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ formatDate(post.published_at || post.created_at) }}</span>
                    <span>{{ post.category || '未分类' }}</span>
                    <span>{{ post.read_time }} 分钟阅读</span>
                  </div>
                </div>
                <div class="ml-4">
                  <span class="px-3 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-xs font-medium">
                    {{ post.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无文章提示 -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">暂无文章</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">还没有发布任何文章</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string
  category?: string
  published_at?: string
  created_at: string
  read_time: number
}

const posts = ref<Post[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const groupedPosts = computed(() => {
  const groups: Record<string, Post[]> = {}
  
  posts.value.forEach(post => {
    const year = new Date(post.published_at || post.created_at).getFullYear().toString()
    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(post)
  })
  
  // 按年份降序排列
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => parseInt(b) - parseInt(a))
  )
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

const fetchPublishedPosts = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await fetch('http://localhost:5000/api/posts/published')
    const result = await response.json()
    
    if (result.success) {
      posts.value = result.data.items
    } else {
      error.value = result.message || '获取文章失败'
    }
  } catch (err) {
    console.error('获取文章失败:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPublishedPosts()
})

// 封面地址转换
const getCoverSrc = (src?: string) => {
  if (!src) return ''
  try {
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src
    return `/${src.replace(/^\/+/, '')}`
  } catch {
    return src
  }
}

// 封面加载失败占位
const onCoverError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.objectFit = 'contain'
  target.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'>
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

