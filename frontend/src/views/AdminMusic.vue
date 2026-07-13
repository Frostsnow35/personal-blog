<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button @click="$router.push('/admin/dashboard')" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            ← 返回
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">🎵 音乐管理</h1>
        </div>
        <button @click="scrollToSearch" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors">
          + 新增音乐
        </button>
      </div>

      <div id="search-section" class="mb-8 card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🔍 搜索音乐</h2>
        <div class="flex flex-wrap items-center gap-3">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="输入歌曲名或歌手..."
            @keydown.enter="searchMusic"
            class="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          <select v-model="platform" class="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500">
            <option value="netease">网易云音乐</option>
            <option value="qqmusic">QQ音乐</option>
          </select>
          <button
            @click="searchMusic"
            :disabled="!searchQuery.trim() || searchLoading"
            class="px-5 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {{ searchLoading ? '搜索中...' : '搜索' }}
          </button>
        </div>
      </div>

      

      <div v-if="searchResults.length" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            @click="addFromSearch(item)"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
              <img :src="item.cover" :alt="item.name" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span class="opacity-0 group-hover:opacity-100 text-white font-semibold bg-ocean-600 px-4 py-2 rounded-lg transition-opacity">
                  + 添加
                </span>
              </div>
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ item.artist }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.album }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t dark:border-gray-700 pt-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📁 我的音乐收藏</h2>
        
        <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
        <div v-else-if="!items.length" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="text-4xl mb-3">🎵</p>
          <p>暂无收藏音乐</p>
          <p class="text-sm mt-2">点击上方"新增音乐"或从推荐列表添加</p>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div v-for="m in items" :key="m.id" class="card overflow-hidden hover:shadow-lg transition-shadow">
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
              <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">🎵</div>
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
              <p v-if="m.artist" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ m.artist }}</p>
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

interface Music {
  id: number
  title: string
  artist: string | null
  album: string | null
  cover_url: string | null
  source_url: string
  description: string | null
  tags: string[] | null
  sort_order: number
}

interface SearchResult {
  id: string
  name: string
  artist: string
  album: string
  cover: string
}

const items = ref<Music[]>([])
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const platform = ref('netease')
const searchInput = ref<HTMLInputElement | null>(null)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/admin/music-favorites')
    if (r?.success) items.value = r.data || []
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
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

const searchMusic = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  searchResults.value = []
  try {
    const response = await http.get<any>(`/music?keywords=${encodeURIComponent(query)}`)
    if (response?.success && response.data?.result?.songs) {
      searchResults.value = response.data.result.songs.map((song: any) => ({
        id: song.id.toString(),
        name: song.name,
        artist: song.ar && song.ar.length > 0 ? song.ar[0].name : '未知歌手',
        album: song.al ? song.al.name : '未知专辑',
        cover: song.al && song.al.picUrl ? `${song.al.picUrl}?param=300x300` : ''
      })).filter((m: any) => m.cover)
    }
    if (!searchResults.value.length && response?.success) {
      toast.warning('未找到相关歌曲')
    }
  } catch (error: any) {
    console.error('搜索失败:', error)
    toast.error('搜索失败', error?.message || String(error))
  } finally {
    searchLoading.value = false
  }
}

const addFromSearch = async (item: SearchResult) => {
  const payload = {
    title: item.name,
    artist: item.artist,
    album: item.album,
    cover_url: item.cover || null,
    source_url: `https://music.163.com/#/song?id=${item.id}`,
    description: null,
    tags: [],
    sort_order: 0
  }
  try {
    const r = await http.post<any>('/admin/music-favorites', payload)
    if (r?.success) {
      toast.success('添加成功')
      searchResults.value = searchResults.value.filter(s => s.id !== item.id)
      await load()
    } else {
      toast.error('添加失败', r?.message)
    }
  } catch (e: any) {
    toast.error('添加失败', e?.message)
  }
}

const del = async (m: Music) => {
  if (!confirm(`删除 "${m.title}"？`)) return
  try {
    const r = await http.delete<any>(`/admin/music-favorites/${m.id}`)
    if (r?.success) { toast.success('已删除'); await load() }
    else toast.error('删除失败', r?.message)
  } catch (e: any) {
    toast.error('删除失败', e?.message)
  }
}

onMounted(async () => {
  await load()
})
</script>
