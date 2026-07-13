<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">🎬 电影管理</h1>
        <button @click="openCreate" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg">+ 新增电影</button>
      </div>

      <!-- 搜索区域 -->
  <div class="mb-6 card p-4">
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-600 dark:text-gray-400">🔍 搜索TMDb电影：</span>
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

  <!-- 推荐列表 -->
  <div v-if="recommendResults.length" class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">🎬 TMDb热门电影推荐</h3>
      <button @click="fetchRecommend" :disabled="recommendLoading" class="text-sm text-ocean-600 hover:text-ocean-700 disabled:text-gray-400">
        {{ recommendLoading ? '刷新中...' : '刷新推荐' }}
      </button>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="item in recommendResults"
        :key="item.id"
        class="card overflow-hidden"
      >
        <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
          <img :src="item.cover" :alt="item.title" class="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            <span v-if="item.year">{{ item.year }}</span>
          </p>
          <button
            @click="addFromSearch(item)"
            class="mt-2 w-full px-3 py-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm rounded transition-colors"
          >
            + 添加到收藏
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 搜索结果 -->
  <div v-if="searchResults.length" class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果（来自TMDb）</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="item in searchResults"
        :key="item.id"
        class="card overflow-hidden"
      >
        <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
          <img :src="item.cover" :alt="item.title" class="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            <span v-if="item.year">{{ item.year }}</span>
          </p>
          <button
            @click="addFromSearch(item)"
            class="mt-2 w-full px-3 py-1.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm rounded transition-colors"
          >
            + 添加到收藏
          </button>
        </div>
      </div>
    </div>
  </div>

      <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-500">暂无电影</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="m in items" :key="m.id" class="card overflow-hidden">
          <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
            <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">🎬</div>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              <span v-if="m.year">{{ m.year }}</span>
            </p>
            <div class="mt-2 flex gap-1 flex-wrap">
              <button @click="openEdit(m)" class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">编辑</button>
              <button @click="del(m)" class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增/编辑 Modal -->
      <div v-if="editing !== null" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="editing = null">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ editing.id ? '编辑电影' : '新增电影' }}</h2>
          <div class="space-y-3">
            <input v-model="editing.title" placeholder="片名 *" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model.number="editing.year" type="number" placeholder="上映年份" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.cover_url" placeholder="海报 URL" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <textarea v-model="editing.description" placeholder="简介" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"></textarea>
            <input v-model="editing.tagsText" placeholder="标签（逗号分隔）" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model.number="editing.sort_order" type="number" placeholder="排序" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button @click="editing = null" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">取消</button>
            <button @click="save" class="px-4 py-2 text-sm bg-ocean-600 hover:bg-ocean-700 text-white rounded">保存</button>
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
const editing = ref<any>(null)
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

const openCreate = () => {
  editing.value = { title: '', year: null, cover_url: '', description: '', tagsText: '', sort_order: 0 }
}

const openEdit = (m: Movie) => {
  editing.value = { ...m, tagsText: (m.tags || []).join(', ') }
}

const save = async () => {
  if (!editing.value.title?.trim()) {
    toast.warning('片名必填')
    return
  }
  const tags = (editing.value.tagsText || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const payload: any = {
    title: editing.value.title.trim(),
    year: editing.value.year || null,
    cover_url: editing.value.cover_url?.trim() || null,
    description: editing.value.description?.trim() || null,
    tags,
    sort_order: editing.value.sort_order || 0
  }
  try {
    let r
    if (editing.value.id) {
      r = await http.put<any>(`/admin/movie-favorites/${editing.value.id}`, payload)
    } else {
      r = await http.post<any>('/admin/movie-favorites', payload)
    }
    if (r?.success) { editing.value = null; await load() }
    else toast.error('保存失败', r?.message)
  } catch (e: any) {
    toast.error('保存失败', e?.message)
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

onMounted(async () => {
  await load()
  await fetchRecommend()
})
</script>
