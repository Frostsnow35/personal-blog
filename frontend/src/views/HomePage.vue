<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 导航栏 -->
    <nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo和博主信息 -->
          <div class="flex items-center space-x-4">
            <img 
              v-lazy-img="'/avatar.jpg'"
              alt="霜雪旧曾谙"
              class="w-10 h-10 rounded-full border-2 border-ocean-200 dark:border-ocean-700"
            />
            <div>
              <h1 class="text-xl font-bold text-gradient">霜雪旧曾谙</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">个人博客</p>
            </div>
          </div>
          
          <!-- 导航菜单 -->
          <div class="hidden md:flex items-center space-x-8">
            <router-link 
              to="/home" 
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              首页
            </router-link>
            <router-link 
              to="/archive" 
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              归档
            </router-link>
            <router-link 
              to="/category" 
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              分类
            </router-link>
            <router-link 
              to="/tag" 
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              标签
            </router-link>
            <router-link 
              to="/about" 
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              关于
            </router-link>
            <router-link 
              v-if="isAuthenticated"
              to="/audio-library" 
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              🎵 音频库
            </router-link>

          </div>

          <!-- 管理员欢迎与快捷入口 -->
          <div v-if="isAuthenticated" class="hidden md:flex items-center space-x-3">
            <span class="text-sm text-gray-600 dark:text-gray-300">欢迎，{{ adminName }}</span>
            <router-link
              to="/admin/posts/new"
              class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-ocean-600 text-white hover:bg-ocean-700"
              title="新建文章"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 左侧文章列表 -->
        <div class="lg:col-span-3">
          <!-- 搜索栏 -->
          <div class="mb-8">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索文章..."
                @input="onSearchInput"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
              />
              <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- 文章列表 -->
          <div class="space-y-6">
            <article 
              v-for="post in filteredPosts" 
              :key="post.id"
              class="card hover:shadow-xl transition-all duration-300 group"
            >
              <!-- 封面图（有则显示），懒加载，保持比例避免布局抖动 -->
              <div v-if="post.cover_url" class="w-full overflow-hidden rounded-t-xl">
                <div class="relative w-full" style="aspect-ratio: 16/9;">
                  <img
                    v-lazy-img="getCoverSrc(post.cover_url)"
                    :alt="post.title || '文章封面'"
                    class="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105 bg-gray-200 dark:bg-gray-700"
                    @error="onCoverError($event)"
                  />
                </div>
              </div>

              <div class="p-6">
                <!-- 文章标题 -->
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                  <router-link :to="`/post/${post.slug}`">
                    {{ post.title }}
                  </router-link>
                </h2>
                
                <!-- 文章摘要 -->
                <p class="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {{ post.excerpt }}
                </p>
                
                <!-- 文章元信息 -->
                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center space-x-4">
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ formatDate(post.published_at || post.created_at) }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ post.read_time }} 分钟阅读
                    </span>
                  </div>
                  
                  <!-- 分类标签 -->
                  <span class="px-3 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-xs font-medium">
                    {{ post.category }}
                  </span>
                </div>
                
                <!-- 标签 -->
                <div class="mt-4 flex flex-wrap gap-2">
                  <span 
                    v-for="tag in post.tags" 
                    :key="tag"
                    @click="setCurrentTag(tag)"
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs cursor-pointer hover:bg-ocean-100 dark:hover:bg-ocean-900/30 hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>
            </article>
            
            <!-- 无文章提示 -->
            <div v-if="filteredPosts.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">暂无文章</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">尝试调整搜索条件或分类筛选</p>
            </div>
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="lg:col-span-1">
          <!-- 分类 -->
          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">分类</h3>
              <div class="space-y-2">
                <button
                  v-for="category in categories"
                  :key="category.name"
                  @click="setCurrentCategory(category.name)"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    currentCategory === category.name
                      ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                >
                  <span class="flex justify-between items-center">
                    {{ category.name }}
                    <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                      {{ category.count }}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- 标签云 -->
          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">标签</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in tags"
                  :key="tag.name"
                  @click="setCurrentTag(tag.name)"
                  :class="[
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    currentTag === tag.name
                      ? 'bg-ocean-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-ocean-100 dark:hover:bg-ocean-900/30'
                  ]"
                >
                  {{ tag.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- 清除筛选 -->
          <div v-if="currentCategory || currentTag || searchQuery" class="card">
            <div class="p-6">
              <button
                @click="clearFilters()"
                class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                清除筛选
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface PublishedPost {
  id: number
  title: string
  slug: string
  excerpt: string
  category?: string
  tags: string[]
  cover_url?: string
  read_time: number
  published_at?: string
  created_at: string
}

interface Category {
  name: string
  count: number
}

interface Tag {
  name: string
  count: number
}

// 响应式数据
const searchQuery = ref('')
const currentCategory = ref('')
const currentTag = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const posts = ref<PublishedPost[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

// 计算属性
const filteredPosts = computed(() => {
  let filtered = posts.value

  if (currentCategory.value) {
    filtered = filtered.filter(post => post.category === currentCategory.value)
  }

  if (currentTag.value) {
    filtered = filtered.filter(post => post.tags.includes(currentTag.value))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.excerpt.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 方法
const setCurrentCategory = (category: string) => {
  currentCategory.value = currentCategory.value === category ? '' : category
  updateURL()
}

const setCurrentTag = (tag: string) => {
  currentTag.value = currentTag.value === tag ? '' : tag
  updateURL()
}

const clearFilters = () => {
  currentCategory.value = ''
  currentTag.value = ''
  searchQuery.value = ''
  updateURL()
}

const updateURL = () => {
  const url = new URL(window.location.href)
  const params = new URLSearchParams()
  
  if (currentCategory.value) {
    params.set('category', currentCategory.value)
  }
  if (currentTag.value) {
    params.set('tag', currentTag.value)
  }
  
  if (params.toString()) {
    url.search = params.toString()
  } else {
    url.search = ''
  }
  
  window.history.replaceState({}, '', url.toString())
}

const onSearchInput = () => {
  // 搜索功能不需要更新 URL，因为搜索是实时的
  // 这里可以添加防抖功能
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 封面地址转换（可在此处理 CDN、占位图等）
const getCoverSrc = (src?: string) => {
  if (!src) return ''
  try {
    // 如果是绝对路径或 http(s)，直接返回
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src
    // 否则按服务器返回的相对路径处理
    return `/${src.replace(/^\/+/, '')}`
  } catch {
    return src
  }
}

// 封面加载失败处理：退回占位背景
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

// API 调用
const fetchPublishedPosts = async () => {
  try {
    loading.value = true
    error.value = null
    
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/posts/published')
    
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

const fetchPublishedCategories = async () => {
  try {
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/categories/published')
    
    if (result.success) {
      categories.value = result.data
    }
  } catch (err) {
    console.error('获取分类失败:', err)
  }
}

const fetchPublishedTags = async () => {
  try {
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/tags/published')
    
    if (result.success) {
      tags.value = result.data
    }
  } catch (err) {
    console.error('获取标签失败:', err)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchPublishedPosts(),
    fetchPublishedCategories(),
    fetchPublishedTags()
  ])
  
  // 检查 URL 查询参数
  const urlParams = new URLSearchParams(window.location.search)
  const categoryParam = urlParams.get('category')
  const tagParam = urlParams.get('tag')
  
  if (categoryParam) {
    currentCategory.value = categoryParam
  }
  if (tagParam) {
    currentTag.value = tagParam
  }
})


// 管理员欢迎提示逻辑
const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))
const adminName = computed(() => {
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return '管理员'
    const u = JSON.parse(raw)
    return u?.username || '管理员'
  } catch {
    return '管理员'
  }
})
</script>
