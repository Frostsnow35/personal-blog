<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 导航栏 -->
    <SiteNav />

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
                placeholder="搜索文章（跳转到搜索页）"
                @input="onSearchInput"
                @keydown.enter.prevent="applySearchNow"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
              />
              <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- 文章列表 -->
          <div class="space-y-6">
            <!-- 加载骨架屏 -->
            <div
              v-for="i in (loading && posts.length === 0 ? 3 : 0)"
              :key="`skeleton-post-${i}`"
              class="card"
            >
              <div class="skeleton w-full rounded-t-xl" style="aspect-ratio: 16/9;"></div>
              <div class="p-6 space-y-4">
                <div class="skeleton h-7 w-3/4"></div>
                <div class="space-y-2">
                  <div class="skeleton h-4 w-full"></div>
                  <div class="skeleton h-4 w-5/6"></div>
                </div>
                <div class="flex items-center justify-between pt-2">
                  <div class="flex items-center gap-4">
                    <div class="skeleton h-4 w-20"></div>
                    <div class="skeleton h-4 w-16"></div>
                    <div class="skeleton h-4 w-12"></div>
                    <div class="skeleton h-4 w-10"></div>
                  </div>
                  <div class="skeleton h-6 w-16"></div>
                </div>
                <div class="flex gap-2">
                  <div class="skeleton h-5 w-12"></div>
                  <div class="skeleton h-5 w-16"></div>
                </div>
              </div>
            </div>

            <TransitionGroup name="list" tag="div" class="space-y-6">
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
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {{ post.views || 0 }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {{ post.likes || 0 }}
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
            </TransitionGroup>

            <div
              v-if="!loading && !error && filteredPosts.length > 0 && totalPages > 1"
              class="flex items-center justify-between pt-2"
            >
              <button
                class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                上一页
              </button>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                第 {{ currentPage }} / {{ totalPages }} 页
              </div>
              <button
                class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                下一页
              </button>
            </div>
            
            <!-- 无文章提示 -->
            <div v-if="filteredPosts.length === 0 && !loading" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ hasFilters ? '未找到匹配内容' : '暂无文章' }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ hasFilters ? '尝试更换关键词或清除筛选条件' : '稍后再来看看吧' }}
              </p>
              <button
                v-if="hasFilters"
                class="mt-4 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                @click="clearFilters()"
              >
                清除筛选
              </button>
            </div>

            <!-- 错误状态 -->
            <div v-if="error && !loading" class="text-center py-12">
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
          </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="lg:col-span-1">
          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">关注我</h3>
              <PublicSocialLinks :links="profileStore.publicSocialLinks" />
            </div>
          </div>

          <!-- 管理员功能区域 -->
          <div v-if="isAuthenticated" class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                管理员功能
              </h3>
              <div class="space-y-3">
                <router-link
                  to="/admin/posts/new"
                  class="flex items-center justify-center w-full px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  新建文章
                </router-link>
                <router-link
                  to="/admin/posts"
                  class="flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  管理文章
                </router-link>
                <router-link
                  to="/admin/dashboard"
                  class="flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  数据统计
                </router-link>
              </div>
            </div>
          </div>

          <!-- 分类 -->
          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">分类</h3>
              <TransitionGroup name="list" tag="div" class="space-y-2">
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
              </TransitionGroup>
            </div>
          </div>

          <!-- 标签云 -->
          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">标签</h3>
              <TransitionGroup name="list" tag="div" class="flex flex-wrap gap-2">
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
              </TransitionGroup>
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
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import SiteNav from '../components/SiteNav.vue'
import PublicSocialLinks from '../components/PublicSocialLinks.vue'
import { http } from '../utils/http'

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
  views?: number
  likes?: number
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

const router = useRouter()
const route = useRoute()
const profileStore = useProfileStore()

const SEARCH_DEBOUNCE_MS = 300
const POSTS_PER_PAGE = 10

const totalPages = ref(1)
const currentPage = ref(1)

let searchDebounceTimer: number | undefined
let activePostsController: AbortController | null = null
let lastPostsRequestKey = ''

const normalizeQueryValue = (v: unknown) => {
  if (Array.isArray(v)) return String(v[0] ?? '')
  if (typeof v === 'string') return v
  return ''
}

const getRouteFilters = () => {
  const category = normalizeQueryValue(route.query.category).trim()
  const tag = normalizeQueryValue(route.query.tag).trim()
  const pageRaw = normalizeQueryValue(route.query.page).trim()
  const page = Math.max(1, Number(pageRaw || '1') || 1)
  return { category, tag, page }
}

const applyQueryToRoute = (next: { category?: string; tag?: string; page?: number }) => {
  const query: Record<string, string> = {}
  const category = (next.category ?? '').trim()
  const tag = (next.tag ?? '').trim()
  const page = Math.max(1, Number(next.page ?? 1) || 1)

  if (category) query.category = category
  if (tag) query.tag = tag
  if (page > 1) query.page = String(page)

  router.replace({ path: route.path, query })
}


// 计算属性
const filteredPosts = computed(() => posts.value)
const hasFilters = computed(() => !!(currentCategory.value || currentTag.value))

// 方法
const setCurrentCategory = (category: string) => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextCategory = currentCategory.value === category ? '' : category
  currentCategory.value = nextCategory
  applyQueryToRoute({ category: nextCategory, tag: currentTag.value, page: 1 })
}

const setCurrentTag = (tag: string) => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextTag = currentTag.value === tag ? '' : tag
  currentTag.value = nextTag
  applyQueryToRoute({ category: currentCategory.value, tag: nextTag, page: 1 })
}

const clearFilters = () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  currentCategory.value = ''
  currentTag.value = ''
  searchQuery.value = ''
  applyQueryToRoute({ page: 1 })
}

const applySearchNow = () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextSearch = searchQuery.value.trim()
  const query: Record<string, string> = {}
  if (nextSearch) query.search = nextSearch
  if (currentCategory.value) query.category = currentCategory.value
  if (currentTag.value) query.tag = currentTag.value
  router.push({ path: '/search', query })
}

const onSearchInput = () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextSearch = searchQuery.value.trim()
  if (!nextSearch) {
    return
  }
  searchDebounceTimer = window.setTimeout(() => {
    const query: Record<string, string> = { search: nextSearch }
    if (currentCategory.value) query.category = currentCategory.value
    if (currentTag.value) query.tag = currentTag.value
    router.push({ path: '/search', query })
  }, SEARCH_DEBOUNCE_MS)
}

const goToPage = (page: number) => {
  applyQueryToRoute({ category: currentCategory.value, tag: currentTag.value, page })
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
  let controller: AbortController | null = null
  try {
    const { category, tag, page } = getRouteFilters()
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(POSTS_PER_PAGE))
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)

    const requestKey = params.toString()
    if (requestKey === lastPostsRequestKey && !error.value) return
    lastPostsRequestKey = requestKey

    if (activePostsController) activePostsController.abort()
    controller = new AbortController()
    activePostsController = controller

    // 已有缓存/数据时不再显示 loading，避免骨架屏闪烁
    if (posts.value.length === 0) {
      loading.value = true
    }
    error.value = null

    const result = await http.get<any>(`/posts/published?${params.toString()}`, controller.signal)

    if (result.success) {
      const newPosts = result.data.items || []
      posts.value = newPosts
      totalPages.value = Number(result?.data?.pages || 1) || 1
      currentPage.value = Number(result?.data?.current_page || page) || page
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') return
    // 已有缓存数据时静默失败，保留缓存
    if (posts.value.length === 0) {
      error.value = (err as any)?.message || '网络错误，请稍后重试'
    }
  } finally {
    if (controller && activePostsController === controller) {
      loading.value = false
      activePostsController = null
    }
  }
}

const fetchPublishedCategories = async () => {
  try {
    const result = await http.get<any>('/categories/published')
    if (result.success) {
      categories.value = result.data
    }
  } catch (err) {
    // 静默处理错误
  }
}

const fetchPublishedTags = async () => {
  try {
    const result = await http.get<any>('/tags/published')
    if (result.success) {
      tags.value = result.data
    }
  } catch (err) {
    // 静默处理错误
  }
}

onMounted(async () => {
  // 并行加载数据，优化性能
  const promises = [
    profileStore.loadProfile(),
    fetchPublishedCategories(),
    fetchPublishedTags()
  ]

  // 使用 Promise.allSettled 确保即使某个请求失败也不影响其他请求
  await Promise.allSettled(promises)
})

watch(
  () => route.query,
  () => {
    const search = normalizeQueryValue(route.query.search).trim()
    if (search) {
      router.replace({ path: '/search', query: route.query })
      return
    }
    const { category, tag, page } = getRouteFilters()
    currentCategory.value = category
    currentTag.value = tag
    searchQuery.value = ''
    currentPage.value = page
    fetchPublishedPosts()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  if (activePostsController) activePostsController.abort()
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
