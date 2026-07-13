<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">🎵 音乐管理</h1>
        <button @click="openCreate" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg">+ 新增音乐</button>
      </div>

      <!-- 搜索区域 -->
      <div class="mb-6 card p-4">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 dark:text-gray-400">🔍 搜索网易云音乐：</span>
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="输入歌曲名或歌手..."
              @keydown.enter="searchMusic"
              class="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              @click="searchMusic"
              :disabled="!searchQuery.trim() || searchLoading"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
            >
              {{ searchLoading ? '搜索中...' : '搜索' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length" class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">搜索结果（来自网易云音乐）</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="card overflow-hidden"
          >
            <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
              <img :src="item.cover" :alt="item.name" class="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div class="p-3">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ item.artist }} · {{ item.album }}</p>
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
      <div v-else-if="!items.length" class="text-center py-10 text-gray-500">暂无音乐</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="m in items" :key="m.id" class="card overflow-hidden">
          <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 1/1;">
            <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">🎵</div>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
            <p v-if="m.artist" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {{ m.artist }}<span v-if="m.album"> · {{ m.album }}</span>
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
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ editing.id ? '编辑音乐' : '新增音乐' }}</h2>
          <div class="space-y-3">
            <input v-model="editing.title" placeholder="标题 *" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.artist" placeholder="艺术家" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.album" placeholder="专辑" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.cover_url" placeholder="封面 URL" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.source_url" placeholder="外链 URL *" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <textarea v-model="editing.description" placeholder="简介" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"></textarea>
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
  id: number
  name: string
  artist: string
  album: string
  cover: string
}

const items = ref<Music[]>([])
const loading = ref(false)
const editing = ref<any>(null)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/admin/music-favorites')
    if (r?.success) items.value = r.data || []
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
}

const openCreate = () => {
  editing.value = { title: '', artist: '', album: '', cover_url: '', source_url: '', description: '', tagsText: '', sort_order: 0 }
}

const openEdit = (m: Music) => {
  editing.value = { ...m, tagsText: (m.tags || []).join(', ') }
}

const save = async () => {
  if (!editing.value.title?.trim() || !editing.value.source_url?.trim()) {
    toast.warning('标题和链接必填')
    return
  }
  const tags = (editing.value.tagsText || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const payload = {
    title: editing.value.title.trim(),
    artist: editing.value.artist?.trim() || null,
    album: editing.value.album?.trim() || null,
    cover_url: editing.value.cover_url?.trim() || null,
    source_url: editing.value.source_url.trim(),
    description: editing.value.description?.trim() || null,
    tags,
    sort_order: editing.value.sort_order || 0
  }
  try {
    let r
    if (editing.value.id) {
      r = await http.put<any>(`/admin/music-favorites/${editing.value.id}`, payload)
    } else {
      r = await http.post<any>('/admin/music-favorites', payload)
    }
    if (r?.success) { editing.value = null; await load() }
    else toast.error('保存失败', r?.message)
  } catch (e: any) {
    toast.error('保存失败', e?.message)
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
    toast.error('搜索失败', '无法连接到网易云音乐')
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

onMounted(load)
</script>
