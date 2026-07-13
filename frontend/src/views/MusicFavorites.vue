<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎵 个人喜爱音乐</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">那些循环过无数次的旋律</p>

      <div class="mb-6 flex justify-center">
        <div class="relative w-full max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索歌曲/歌手/专辑..."
            @keydown.enter="searchMusic"
            class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
          />
          <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            @click="searchMusic"
            :disabled="!searchQuery.trim() || searchLoading"
            class="absolute right-2 top-2 px-4 py-1 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors"
          >
            {{ searchLoading ? '搜索中...' : '搜索' }}
          </button>
        </div>
      </div>

      <div v-if="searchResults.length" class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果 (来自网易云音乐)</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
              <img :src="item.cover" :alt="item.name" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <a
                :href="`https://music.163.com/#/song?id=${item.id}`"
                target="_blank"
                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span class="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <span class="text-2xl">▶</span>
                </span>
              </a>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.artist }} · {{ item.album }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🎶</p>
        <p>暂无音乐</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="m in items"
          :key="m.id"
          class="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
          <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
            <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-5xl">🎵</div>
            <a
              :href="m.source_url"
              target="_blank"
              rel="noopener"
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <span class="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform">
                <span class="text-2xl">▶</span>
              </span>
              <span class="text-white text-sm font-medium">点击跳转到网易云音乐</span>
            </a>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
            <p v-if="m.artist" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{{ m.artist }}<span v-if="m.album"> · {{ m.album }}</span></p>
            <p v-if="m.description" class="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{{ m.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Music {
  id: number
  title: string
  artist: string | null
  album: string | null
  cover_url: string | null
  source_url: string
  description: string | null
  tags: string[]
}

interface SearchResult {
  id: number
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

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

const searchMusic = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  searchResults.value = []
  try {
    const response = await fetch(`https://api.imjad.cn/cloudmusic/?type=search&s=${encodeURIComponent(query)}&limit=6`)
    const data = await response.json()
    
    if (data?.result?.songs) {
      searchResults.value = data.result.songs.map((song: any) => ({
        id: song.id,
        name: song.name,
        artist: song.artists?.[0]?.name || '未知歌手',
        album: song.album?.name || '未知专辑',
        cover: song.album?.picUrl ? `${song.album.picUrl}?param=300x300` : ''
      }))
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    searchLoading.value = false
  }
}

onMounted(load)
</script>
