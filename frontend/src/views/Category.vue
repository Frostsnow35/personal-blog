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
            <router-link to="/category" class="text-ocean-600 dark:text-ocean-400 font-medium">分类</router-link>
            <router-link to="/tag" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">标签</router-link>
            <router-link to="/about" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">关于</router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">文章分类</h1>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">正在加载分类...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">加载失败</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <button 
          @click="fetchPublishedCategories"
          class="px-6 py-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
        >
          重试
        </button>
      </div>

      <!-- 分类网格 -->
      <div v-else-if="categories.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="category in categories" 
          :key="category.name"
          class="card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          @click="selectCategory(category.name)"
        >
          <!-- 可选封面（若后续为分类提供封面），16:9 比例占位 -->
          <div v-if="(category as any).cover_url" class="w-full overflow-hidden rounded-t-xl">
            <div class="relative w-full" style="aspect-ratio: 16/9;">
              <img
                v-lazy-img="getCoverSrc((category as any).cover_url)"
                :alt="category.name"
                class="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105 bg-gray-200 dark:bg-gray-700"
                @error="onCoverError($event)"
              />
            </div>
          </div>
          <div class="p-6 text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-ocean-500 to-sea-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ category.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">{{ category.description }}</p>
            <div class="flex items-center justify-center">
              <span class="px-4 py-2 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-sm font-medium">
                {{ category.count }} 篇文章
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无分类提示 -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">暂无分类</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">还没有创建任何分类</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Category {
  name: string
  description: string
  count: number
}

const router = useRouter()
const categories = ref<Category[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const selectCategory = (categoryName: string) => {
  router.push({
    path: '/home',
    query: { category: categoryName }
  })
}

const fetchPublishedCategories = async () => {
  try {
    loading.value = true
    error.value = null
    
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/categories/published')
    
    if (result.success) {
      // 为每个分类添加描述
      categories.value = result.data.map((cat: any) => ({
        name: cat.name,
        description: getCategoryDescription(cat.name),
        count: cat.count
      }))
    } else {
      error.value = result.message || '获取分类失败'
    }
  } catch (err) {
    console.error('获取分类失败:', err)
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

const getCategoryDescription = (categoryName: string): string => {
  const descriptions: Record<string, string> = {
    '技术分享': '分享技术心得和开发经验',
    '个人感悟': '记录生活中的思考和感悟',
    '二次元': '动漫、游戏相关的内容',
    '海洋探索': '关于海洋和自然的探索',
    '哲学思考': '深度思考和哲学探讨',
    '计算机科学': '计算机科学相关技术分享',
    '前端开发': '前端开发技术和经验',
    '后端开发': '后端开发技术和经验',
    '数据库': '数据库相关技术分享',
    '算法': '算法和数据结构',
    '机器学习': '机器学习和人工智能',
    '网络安全': '网络安全相关知识',
    '软件工程': '软件工程最佳实践',
    '项目管理': '项目管理和团队协作',
    '学习笔记': '学习过程中的笔记和总结',
    '工具推荐': '好用的开发工具推荐',
    '经验分享': '工作中的经验和教训',
    '生活随笔': '生活中的感悟和思考',
    '读书笔记': '读书心得和感悟',
    '旅行记录': '旅行中的见闻和感受'
  }
  
  return descriptions[categoryName] || '分享相关主题的内容'
}

onMounted(async () => {
  await fetchPublishedCategories()
})

// 可选封面地址转换（当前无后端封面时不影响）
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

