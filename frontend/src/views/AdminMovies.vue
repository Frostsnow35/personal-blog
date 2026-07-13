<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">🎬 电影管理</h1>
        <button @click="scrollToSearch" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors">
          + 新增电影
        </button>
      </div>

      <!-- 搜索区域 -->
      <div id="search-section" class="mb-8 card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🔍 搜索 TMDb 电影</h2>
        <div class="flex items-center gap-3">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="输入电影名搜索..."
            @keydown.enter="searchMovie"
            class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          <button
            @click="searchMovie"
            :disabled="!searchQuery.trim() || searchLoading"
            class="px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {{ searchLoading ? '搜索中...' : '搜索' }}
          </button>
        </div>
      </div>

      <!-- 推荐列表 -->
      <div v-if="recommendResults.length" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">🎬 TMDb 热门电影推荐</h2>
          <button @click="fetchRecommend" :disabled="recommendLoading" class="text-sm text-ocean-600 hover:text-ocean-700 disabled:text-gray-400 font-medium">
            {{ recommendLoading ? '刷新中...' : '刷新推荐' }}
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in recommendResults"
            :key="item.id"
            class="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            @click="addFromSearch(item)"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
              <img :src="item.cover" :alt="item.title" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span class="opacity-0 group-hover:opacity-100 text-white font-semibold bg-ocean-600 px-4 py-2 rounded-lg transition-opacity">
                  + 添加
                </span>
              </div>
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.year }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果（来自 TMDb）</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            @click="addFromSearch(item)"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
              <img :src="item.cover" :alt="item.title" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span class="opacity-0 group-hover:opacity-100 text-white font-semibold bg-ocean-600 px-4 py-2 rounded-lg transition-opacity">
                  + 添加
                </span>
              </div>
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.year }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 已收藏列表 -->
      <div class="border-t dark:border-gray-700 pt-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📁 我的电影收藏</h2>
        
        <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
        <div v-else-if="!items.length" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="text-4xl mb-3">🎬</p>
          <p>暂无收藏电影</p>
          <p class="text-sm mt-2">点击上方"新增电影"或从推荐列表添加</p>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div v-for="m in items" :key="m.id" class="card overflow-hidden hover:shadow-lg transition-shadow">
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
              <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">🎬</div>
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ m.year }}</p>
              <div class="mt-2 flex gap-1 flex-wrap">
                <button @click="del(m)" class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'

interface Movie {
  id: number
  title: string
  year: number | null
  cover_url: string | null
  description: string | null
  tags: string[] | null
  sort_order: number
}

interface SearchResult {
  id: string
  title: string
  year: string
  cover: string
  description: string
}

const items = ref<Movie[]>([])
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const recommendResults = ref<SearchResult[]>([])
const recommendLoading = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/admin/movie-favorites')
    if (r?.success) items.value = r.data || []
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
}

const fetchRecommend = async () => {
  recommendLoading.value = true
  recommendResults.value = []
  try {
    const response = await http.get<any>('/proxy/tmdb/movie/popular')
    if (response?.success && response.data?.results) {
      recommendResults.value = response.data.results.map((movie: any) => ({
        id: movie.id.toString(),
        title: movie.title || movie.original_title || '',
        year: movie.release_date ? movie.release_date.substring(0, 4) : '',
        cover: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '',
        description: movie.overview?.substring(0, 100) || ''
      })).filter((m: any) => m.cover)
    }
  } catch (error) {
    console.error('推荐加载失败:', error)
    toast.error('推荐加载失败', '无法连接到TMDb')
  } finally {
    recommendLoading.value = false
  }
}

const scrollToSearch = async () => {
  await nextTick()
  const element = document.getElementById('search-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

const searchMovie = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  searchResults.value = []
  try {
    const response = await http.get<any>(`/proxy/tmdb/movie/search?q=${encodeURIComponent(query)}`)
    if (response?.success && response.data?.results) {
      searchResults.value = response.data.results.map((movie: any) => ({
        id: movie.id.toString(),
        title: movie.title || movie.original_title || '',
        year: movie.release_date ? movie.release_date.substring(0, 4) : '',
        cover: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '',
        description: movie.overview?.substring(0, 100) || ''
      })).filter((m: any) => m.cover)
    }
  } catch (error) {
    console.error('搜索失败:', error)
    toast.error('搜索失败', '无法连接到TMDb')
  } finally {
    searchLoading.value = false
  }
}

const addFromSearch = async (item: SearchResult) => {
  const payload: any = {
    title: item.title,
    year: item.year ? parseInt(item.year) : null,
    cover_url: item.cover || null,
    description: item.description || null,
    tags: [],
    sort_order: 0
  }
  try {
    const r = await http.post<any>('/admin/movie-favorites', payload)
    if (r?.success) {
      toast.success('添加成功')
      searchResults.value = searchResults.value.filter(s => s.id !== item.id)
      recommendResults.value = recommendResults.value.filter(s => s.id !== item.id)
      await load()
    } else {
      toast.error('添加失败', r?.message)
    }
  } catch (e: any) {
    toast.error('添加失败', e?.message)
  }
}

const del = async (m: Movie) => {
  if (!confirm(`删除 "${m.title}"？`)) return
  try {
    const r = await http.delete<any>(`/admin/movie-favorites/${m.id}`)
    if (r?.success) { toast.success('已删除'); await load() }
    else toast.error('删除失败', r?.message)
  } catch (e: any) {
    toast.error('删除失败', e?.message)
  }
}

onMounted(async () => {
  await load()
  await fetchRecommend()
})
</script>