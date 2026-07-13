<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎬 喜爱电影</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">看过的、想看的、难忘的</p>

      <div class="mb-6 flex justify-center">
        <div class="relative w-full max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索电影..."
            @keydown.enter="searchMovie"
            class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
          />
          <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            @click="searchMovie"
            :disabled="!searchQuery.trim() || searchLoading"
            class="absolute right-2 top-2 px-4 py-1 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors"
          >
            {{ searchLoading ? '搜索中...' : '搜索' }}
          </button>
        </div>
      </div>

      <div v-if="searchResults.length" class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果 (来自豆瓣电影)</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <a
            v-for="item in searchResults"
            :key="item.id"
            :href="item.url"
            target="_blank"
            rel="noopener"
            class="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
              <img :src="item.cover" :alt="item.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div v-if="item.rating" class="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded">★ {{ item.rating }}</div>
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                <span v-if="item.director">{{ item.director }}</span>
                <span v-if="item.year"> · {{ item.year }}</span>
              </p>
            </div>
          </a>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🎞️</p>
        <p>暂无电影</p>
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <a
          v-for="m in items"
          :key="m.id"
          :href="m.source_url || '#'"
          target="_blank"
          rel="noopener"
          class="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
          <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
            <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">🎬</div>
            <div v-if="m.rating" class="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded">★ {{ m.rating }}</div>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center mb-2 transform group-hover:scale-110 transition-transform">
                <span class="text-xl">↗</span>
              </span>
              <span class="text-white text-xs font-medium">点击跳转到豆瓣</span>
            </div>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              <span v-if="m.director">{{ m.director }}</span>
              <span v-if="m.year"> · {{ m.year }}</span>
            </p>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Movie {
  id: number
  title: string
  director: string | null
  year: number | null
  cover_url: string | null
  source_url: string | null
  rating: number | null
}

interface SearchResult {
  id: string
  title: string
  director: string
  year: string
  cover: string
  rating: string
  url: string
}

const items = ref<Movie[]>([])
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/movie-favorites')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

const searchMovie = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  searchResults.value = []
  try {
    const response = await fetch(`https://api.douban.com/v2/movie/search?q=${encodeURIComponent(query)}&count=8`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    const data = await response.json()
    
    if (data?.subjects) {
      searchResults.value = data.subjects.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        director: movie.directors?.[0]?.name || '未知导演',
        year: movie.year || '',
        cover: movie.images?.large || movie.images?.medium || '',
        rating: movie.rating?.average?.toString() || '',
        url: movie.alt || ''
      }))
    }
  } catch (error) {
    console.error('搜索失败:', error)
    try {
      const fallbackResponse = await fetch(`https://douban.uieee.cn/v2/movie/search?q=${encodeURIComponent(query)}&count=8`)
      const fallbackData = await fallbackResponse.json()
      if (fallbackData?.subjects) {
        searchResults.value = fallbackData.subjects.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          director: movie.directors?.[0]?.name || '未知导演',
          year: movie.year || '',
          cover: movie.images?.large || movie.images?.medium || '',
          rating: movie.rating?.average?.toString() || '',
          url: movie.alt || ''
        }))
      }
    } catch (fallbackError) {
      console.error('备用API搜索失败:', fallbackError)
    }
  } finally {
    searchLoading.value = false
  }
}

onMounted(load)
</script>
