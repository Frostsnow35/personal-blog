<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <img v-lazy-img="'/avatar.jpg'" alt="霜雪旧曾谙" class="w-10 h-10 rounded-full border-2 border-ocean-200 dark:border-ocean-700" />
            <div>
              <h1 class="text-xl font-bold text-gradient">霜雪旧曾谙</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">个人博客</p>
            </div>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <router-link
              to="/home"
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              首页
            </router-link>
            <router-link
              to="/search"
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              active-class="text-ocean-600 dark:text-ocean-400"
            >
              搜索
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
              作者
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3">
          <div class="mb-6">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索文章（标题、分类、标签）"
                @input="onSearchInput"
                @keydown.enter.prevent="applySearchNow"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
              />
              <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div v-if="hasFilters" class="mt-3 flex items-center gap-2 flex-wrap text-sm">
              <span class="text-gray-500 dark:text-gray-400">当前筛选</span>
              <span v-if="currentCategory" class="px-2 py-1 rounded-md bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200">
                分类 {{ currentCategory }}
              </span>
              <span v-if="currentTag" class="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                标签 {{ currentTag }}
              </span>
              <span v-if="searchQuery.trim()" class="px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                关键词 {{ searchQuery.trim() }}
              </span>
              <button
                class="ml-auto px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                @click="clearFilters"
              >
                清除筛选
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <article v-for="post in results" :key="post.id" class="card hover:shadow-xl transition-all duration-300 group">
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
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                  <router-link :to="`/post/${post.slug}`">{{ post.title }}</router-link>
                </h2>

                <p class="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{{ post.excerpt }}</p>

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

                  <span
                    v-if="post.category"
                    class="px-3 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-xs font-medium"
                  >
                    {{ post.category }}
                  </span>
                </div>

                <div v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
                  <span
                    v-for="t in post.tags"
                    :key="t"
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs cursor-pointer hover:bg-ocean-100 dark:hover:bg-ocean-900/30 hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors"
                    @click="setCurrentTag(t)"
                  >
                    #{{ t }}
                  </span>
                </div>
              </div>
            </article>

            <div v-if="!loading && !error && results.length > 0 && totalPages > 1" class="flex items-center justify-between pt-2">
              <button
                class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                上一页
              </button>
              <div class="text-sm text-gray-500 dark:text-gray-400">第 {{ currentPage }} / {{ totalPages }} 页</div>
              <button
                class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                下一页
              </button>
            </div>

            <div v-if="results.length === 0 && !loading && !error" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ hasFilters ? '未找到匹配内容' : '请输入关键词开始搜索' }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ hasFilters ? '尝试更换关键词或清除筛选条件' : '支持按标题、分类、标签查找' }}
              </p>
              <button
                v-if="hasFilters"
                class="mt-4 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                @click="clearFilters"
              >
                清除筛选
              </button>
            </div>

            <div v-if="loading" class="text-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto"></div>
              <p class="mt-4 text-gray-600 dark:text-gray-400">正在搜索...</p>
            </div>

            <div v-if="error && !loading" class="text-center py-12">
              <div class="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">搜索失败</h2>
              <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
              <button @click="fetchResults" class="px-6 py-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors">
                重试
              </button>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">分类</h3>
              <div class="space-y-2">
                <button
                  v-for="c in categories"
                  :key="c.name"
                  @click="setCurrentCategory(c.name)"
                  :class="[
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    currentCategory === c.name
                      ? 'bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                >
                  <span class="flex justify-between items-center">
                    {{ c.name }}
                    <span class="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">{{ c.count }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="card mb-6">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">标签</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in tags"
                  :key="t.name"
                  @click="setCurrentTag(t.name)"
                  :class="[
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    currentTag === t.name ? 'bg-ocean-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-ocean-100 dark:hover:bg-ocean-900/30'
                  ]"
                >
                  {{ t.name }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="hasFilters" class="card">
            <div class="p-6">
              <button
                class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                @click="clearFilters"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface SearchPost {
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

const router = useRouter()
const route = useRoute()

const SEARCH_DEBOUNCE_MS = 300
const POSTS_PER_PAGE = 10

const searchQuery = ref('')
const currentCategory = ref('')
const currentTag = ref('')

const results = ref<SearchPost[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const loading = ref(false)
const error = ref<string | null>(null)

const totalPages = ref(1)
const currentPage = ref(1)

let searchDebounceTimer: number | undefined
let activeController: AbortController | null = null
let lastRequestKey = ''

const normalizeQueryValue = (v: unknown) => {
  if (Array.isArray(v)) return String(v[0] ?? '')
  if (typeof v === 'string') return v
  return ''
}

const getRouteFilters = () => {
  const search = normalizeQueryValue(route.query.search).trim()
  const category = normalizeQueryValue(route.query.category).trim()
  const tag = normalizeQueryValue(route.query.tag).trim()
  const pageRaw = normalizeQueryValue(route.query.page).trim()
  const page = Math.max(1, Number(pageRaw || '1') || 1)
  return { search, category, tag, page }
}

const buildQuery = (next: { search?: string; category?: string; tag?: string; page?: number }) => {
  const query: Record<string, string> = {}
  const search = (next.search ?? '').trim()
  const category = (next.category ?? '').trim()
  const tag = (next.tag ?? '').trim()
  const page = Math.max(1, Number(next.page ?? 1) || 1)
  if (search) query.search = search
  if (category) query.category = category
  if (tag) query.tag = tag
  if (page > 1) query.page = String(page)
  return query
}

const replaceQuery = (next: { search?: string; category?: string; tag?: string; page?: number }) => {
  router.replace({ path: '/search', query: buildQuery(next) })
}

const hasFilters = computed(() => {
  return Boolean(currentCategory.value || currentTag.value || searchQuery.value.trim())
})

const onSearchInput = () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextSearch = searchQuery.value.trim()
  searchDebounceTimer = window.setTimeout(() => {
    replaceQuery({ search: nextSearch, category: currentCategory.value, tag: currentTag.value, page: 1 })
  }, SEARCH_DEBOUNCE_MS)
}

const applySearchNow = () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  replaceQuery({ search: searchQuery.value.trim(), category: currentCategory.value, tag: currentTag.value, page: 1 })
}

const setCurrentCategory = (category: string) => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextCategory = currentCategory.value === category ? '' : category
  currentCategory.value = nextCategory
  replaceQuery({ search: searchQuery.value, category: nextCategory, tag: currentTag.value, page: 1 })
}

const setCurrentTag = (tag: string) => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  const nextTag = currentTag.value === tag ? '' : tag
  currentTag.value = nextTag
  replaceQuery({ search: searchQuery.value, category: currentCategory.value, tag: nextTag, page: 1 })
}

const goToPage = (page: number) => {
  router.push({ path: '/search', query: buildQuery({ search: searchQuery.value, category: currentCategory.value, tag: currentTag.value, page }) })
}

const clearFilters = () => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  currentCategory.value = ''
  currentTag.value = ''
  searchQuery.value = ''
  replaceQuery({ page: 1 })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getCoverSrc = (src?: string) => {
  if (!src) return ''
  try {
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src
    return `/${src.replace(/^\/+/, '')}`
  } catch {
    return src
  }
}

const onCoverError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.objectFit = 'contain'
  target.src =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
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

const fetchCategories = async () => {
  try {
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/categories/published')
    if (result.success) categories.value = result.data || []
  } catch {}
}

const fetchTags = async () => {
  try {
    const { http } = await import('../utils/http')
    const result = await http.get<any>('/tags/published')
    if (result.success) tags.value = result.data || []
  } catch {}
}

const fetchResults = async () => {
  let controller: AbortController | null = null
  try {
    const { search, category, tag, page } = getRouteFilters()
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(POSTS_PER_PAGE))
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)

    const requestKey = params.toString()
    if (requestKey === lastRequestKey && !error.value) return
    lastRequestKey = requestKey

    if (activeController) activeController.abort()
    controller = new AbortController()
    activeController = controller

    loading.value = true
    error.value = null

    const { http } = await import('../utils/http')
    const result = await http.get<any>(`/search?${params.toString()}`, controller.signal)
    if (result.success) {
      results.value = result?.data?.items || []
      totalPages.value = Number(result?.data?.pages || 1) || 1
      currentPage.value = Number(result?.data?.current_page || page) || page
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') return
    error.value = (err as any)?.message || '网络错误，请稍后重试'
  } finally {
    if (controller && activeController === controller) {
      loading.value = false
      activeController = null
    }
  }
}

onMounted(async () => {
  await Promise.allSettled([fetchCategories(), fetchTags()])
})

watch(
  () => route.query,
  () => {
    const { search, category, tag, page } = getRouteFilters()
    searchQuery.value = search
    currentCategory.value = category
    currentTag.value = tag
    currentPage.value = page
    fetchResults()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  if (activeController) activeController.abort()
})
</script>
