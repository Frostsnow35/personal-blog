<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">🎬 电影分级管理</h1>
        <div class="text-sm text-gray-500 dark:text-gray-400">点击电影卡片添加到收藏（默认 S 级）</div>
      </div>

      <!-- 搜索区域 -->
      <div class="mb-6 card p-4">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 dark:text-gray-400">🔍 搜索豆瓣电影：</span>
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="输入电影名..."
              @keydown.enter="searchMovie"
              class="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              @click="searchMovie"
              :disabled="!searchQuery.trim() || searchLoading"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
            >
              {{ searchLoading ? '搜索中...' : '搜索' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">🔍 搜索结果</h3>
          <button @click="searchResults = []" class="text-sm text-gray-500 hover:text-gray-700">清空</button>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          <div
            v-for="item in searchResults"
            :key="item.id"
            @click="addFromSearch(item)"
            class="flex-shrink-0 w-32 cursor-pointer group"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow" style="aspect-ratio: 2/3;">
              <img :src="item.cover" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div v-if="item.rating" class="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded font-medium">★ {{ item.rating }}</div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span class="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">+</span>
              </div>
            </div>
            <div class="mt-2 text-center">
              <h4 class="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.year }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 推荐区域 -->
      <div v-if="recommendResults.length" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">🎬 豆瓣热映推荐</h3>
          <button @click="fetchRecommend" :disabled="recommendLoading" class="text-sm text-ocean-600 hover:text-ocean-700 disabled:text-gray-400">
            {{ recommendLoading ? '刷新中...' : '刷新' }}
          </button>
        </div>
        <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          <div
            v-for="item in recommendResults"
            :key="item.id"
            @click="addFromSearch(item)"
            class="flex-shrink-0 w-32 cursor-pointer group"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow" style="aspect-ratio: 2/3;">
              <img :src="item.cover" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div v-if="item.rating" class="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded font-medium">★ {{ item.rating }}</div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span class="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">+</span>
              </div>
            </div>
            <div class="mt-2 text-center">
              <h4 class="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.year }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tier List -->
      <div class="space-y-4">
        <div
          v-for="tier in tiers"
          :key="tier.level"
          class="card p-4"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              :class="tier.color"
            >
              {{ tier.level }}
            </div>
            <div class="flex-1">
              <div v-if="getMoviesByTier(tier.level).length === 0" class="text-gray-400 text-sm py-4">
                暂无电影，点击上方搜索或推荐中的电影添加到此处
              </div>
              <div v-else class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                <div
                  v-for="m in getMoviesByTier(tier.level)"
                  :key="m.id"
                  class="flex-shrink-0 w-32 relative group"
                >
                  <div class="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md" style="aspect-ratio: 2/3;">
                    <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-3xl">🎬</div>
                    <div v-if="m.rating" class="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded font-medium">★ {{ m.rating }}</div>
                    <!-- 删除按钮 -->
                    <button
                      @click.stop="del(m)"
                      class="absolute top-1 left-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                  <div class="mt-2 text-center">
                    <h4 class="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ m.year }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'

interface Movie {
  id: number
  title: string
  director: string | null
  year: number | null
  cover_url: string | null
  source_url: string | null
  description: string | null
  rating: number | null
  tags: string[] | null
  sort_order: number
  tier: string
}

interface SearchResult {
  id: string
  title: string
  director: string
  year: string
  cover: string
  rating: string
  url: string
  description: string
}

const tiers = [
  { level: 'S', color: 'bg-gradient-to-br from-red-500 to-red-700' },
  { level: 'A', color: 'bg-gradient-to-br from-orange-500 to-orange-700' },
  { level: 'B', color: 'bg-gradient-to-br from-yellow-500 to-yellow-700' },
  { level: 'C', color: 'bg-gradient-to-br from-green-500 to-green-700' },
  { level: 'D', color: 'bg-gradient-to-br from-gray-500 to-gray-700' },
]

const items = ref<Movie[]>([])
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const recommendResults = ref<SearchResult[]>([])
const recommendLoading = ref(false)

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
    const response = await http.get<any>('/proxy/douban/movie/hot')
    if (response?.success && response.data?.subjects) {
      recommendResults.value = response.data.subjects.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        director: movie.directors?.[0]?.name || '未知导演',
        year: movie.year || '',
        cover: movie.images?.large || movie.images?.medium || '',
        rating: movie.rating?.average?.toString() || '',
        url: movie.alt || '',
        description: movie.summary?.substring(0, 100) || ''
      }))
    }
  } catch (error) {
    console.error('推荐加载失败:', error)
    toast.error('推荐加载失败', '无法连接到豆瓣电影')
  } finally {
    recommendLoading.value = false
  }
}

const getMoviesByTier = (tier: string) => {
  return items.value.filter(m => m.tier === tier)
}

const searchMovie = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  searchResults.value = []
  try {
    const response = await http.get<any>(`/proxy/douban/movie/search?q=${encodeURIComponent(query)}&count=12`)
    if (response?.success && response.data?.subjects) {
      searchResults.value = response.data.subjects.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        director: movie.directors?.[0]?.name || '未知导演',
        year: movie.year || '',
        cover: movie.images?.large || movie.images?.medium || '',
        rating: movie.rating?.average?.toString() || '',
        url: movie.alt || '',
        description: movie.summary?.substring(0, 100) || ''
      }))
    }
  } catch (error) {
    console.error('搜索失败:', error)
    toast.error('搜索失败', '无法连接到豆瓣电影')
  } finally {
    searchLoading.value = false
  }
}

const addFromSearch = async (item: SearchResult) => {
  const payload: any = {
    title: item.title,
    director: item.director,
    year: item.year ? parseInt(item.year) : null,
    cover_url: item.cover || null,
    source_url: item.url || null,
    description: item.description || null,
    rating: item.rating ? parseFloat(item.rating) : null,
    tags: [],
    sort_order: 0,
    tier: 'S'
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