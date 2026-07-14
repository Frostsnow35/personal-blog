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
            @keydown.enter="searchMusic()"
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



      <div v-if="searchResults.length || searchLoading || hasSearched" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果</h2>

        <!-- 骨架屏 -->
        <div v-if="searchLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div v-for="n in 15" :key="'sk'+n" class="card overflow-hidden">
            <div class="w-full bg-gray-200 dark:bg-gray-700 animate-pulse" style="aspect-ratio: 1/1;"></div>
            <div class="p-3">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div
          v-else-if="searchResults.length"
          :key="'page-' + searchPage"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 slide-page"
        >
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            @click="addFromSearch(item)"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
              <img v-if="getCoverUrl(item.cover)" :src="getCoverUrl(item.cover)" :alt="item.name" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="onSearchImgError" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">🎵</div>
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

        <!-- 空结果 -->
        <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="text-4xl mb-3">🔍</p>
          <p>未找到相关歌曲</p>
        </div>

        <!-- 分页控件 -->
        <div v-if="!searchLoading && searchResults.length && searchTotal > 0" class="flex items-center justify-center gap-4 py-6">
          <button
            @click="goPrevPage"
            :disabled="searchPage <= 1"
            class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            ← 上一页
          </button>
          <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {{ searchPage }} / {{ totalPages }}
          </span>
          <button
            @click="goNextPage"
            :disabled="searchPage >= totalPages"
            class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            下一页 →
          </button>
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
              <p v-if="m.description" class="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 italic">"{{ m.description }}"</p>
              <div class="mt-2 flex gap-1 flex-wrap">
                <button @click="openEditModal(m)" class="px-2 py-1 text-xs bg-ocean-600 hover:bg-ocean-700 text-white rounded transition-colors">编辑评语</button>
                <button @click="del(m)" class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showEditModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">编辑评语</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">{{ editingMusic?.title }} - {{ editingMusic?.artist }}</p>
        <textarea
          v-model="editDescription"
          placeholder="这首歌对于博主来说："
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
          rows="4"
        ></textarea>
        <div class="mt-4 flex justify-end gap-3">
          <button @click="showEditModal = false" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">取消</button>
          <button @click="saveDescription" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
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
const searchTotal = ref(0)
const searchPage = ref(1)
const searchLimit = ref(15)
const hasSearched = ref(false)
const showEditModal = ref(false)
const editingMusic = ref<Music | null>(null)
const editDescription = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(searchTotal.value / searchLimit.value)))

const getCoverUrl = (src: string) => {
  if (!src) return ''
  if (/^http:\/\//i.test(src)) {
    return src.replace(/^http:\/\//i, 'https://')
  }
  if (/^https?:\/\//i.test(src)) return src
  return ''
}

const onSearchImgError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    const placeholder = document.createElement('div')
    placeholder.className = 'absolute inset-0 flex items-center justify-center text-gray-400 text-3xl'
    placeholder.textContent = '🎵'
    parent.appendChild(placeholder)
  }
}

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

const searchMusic = async (pageNum = 1) => {
  const query = searchQuery.value.trim()
  if (!query) return

  searchLoading.value = true
  hasSearched.value = true
  searchPage.value = pageNum
  try {
    const response = await http.get<any>(`/music-search?keyword=${encodeURIComponent(query)}&page=${pageNum}&limit=${searchLimit.value}`)
    if (response?.data) {
      searchResults.value = response.data.map((song: any) => ({
        id: song.id.toString(),
        name: song.title,
        artist: song.artist || '未知歌手',
        album: song.album || '未知专辑',
        cover: song.cover_url || ''
      }))
      searchTotal.value = response.total || 0
    } else {
      searchResults.value = []
      searchTotal.value = 0
    }
  } catch (error: any) {
    console.error('搜索失败:', error)
    searchResults.value = []
    searchTotal.value = 0
    const msg = error?.message || String(error)
    if (msg.includes('不可用') || msg.includes('失败')) {
      toast.error('搜索服务暂时不可用', '请稍后重试')
    } else {
      toast.error('搜索失败', msg)
    }
  } finally {
    searchLoading.value = false
  }
}

const goPrevPage = () => {
  if (searchPage.value > 1 && !searchLoading.value) {
    searchMusic(searchPage.value - 1)
  }
}

const goNextPage = () => {
  if (searchPage.value < totalPages.value && !searchLoading.value) {
    searchMusic(searchPage.value + 1)
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

const openEditModal = (m: Music) => {
  editingMusic.value = m
  editDescription.value = m.description || ''
  showEditModal.value = true
}

const saveDescription = async () => {
  if (!editingMusic.value) return
  try {
    const r = await http.put<any>(`/admin/music-favorites/${editingMusic.value.id}`, {
      description: editDescription.value.trim() || null
    })
    if (r?.success) {
      toast.success('保存成功')
      showEditModal.value = false
      await load()
    } else {
      toast.error('保存失败', r?.message)
    }
  } catch (e: any) {
    toast.error('保存失败', e?.message)
  }
}

onMounted(async () => {
  await load()
})
</script>

<style scoped>
.slide-page {
  animation: slide-in 0.35s ease-out;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
