<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎵 我的音乐</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">每日精选 · 随机推荐十首</p>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🎶</p>
        <p>暂无音乐收藏</p>
        <p class="text-sm mt-2">管理员可在后台添加音乐收藏</p>
      </div>
      <div v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div
            v-for="(item, index) in items"
            :key="item.id"
            class="card overflow-hidden cursor-pointer transition-all hover:shadow-lg"
            :class="{ 'ring-2 ring-ocean-500': currentIndex === index }"
            @click="play(index)"
          >
            <div class="relative w-full" style="aspect-ratio: 1/1;">
              <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-6xl">🎵</div>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 transition-all duration-300"
                :class="currentIndex === index ? 'opacity-100' : 'opacity-0 hover:opacity-100'"
              >
                <span class="text-white text-4xl">{{ isPlaying ? '⏸️' : '▶️' }}</span>
                <p class="text-white text-xs text-center mt-2">点击播放</p>
                <div v-if="item.tags?.length" class="mt-3 flex flex-wrap justify-center gap-2">
                  <span v-for="tag in item.tags" :key="tag" class="px-2 py-0.5 bg-white/20 text-white text-xs rounded">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div class="p-4">
              <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{{ item.title }}</h2>
              <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                <span v-if="item.artist">{{ item.artist }}</span>
                <span v-if="item.album"> · {{ item.album }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div v-if="!currentItem" class="p-8 text-center text-gray-500">
            <p class="text-4xl mb-2">🎧</p>
            <p>请选择一首歌曲开始播放</p>
          </div>
          <div v-else>
            <div class="flex items-center gap-4 p-4 border-b dark:border-gray-700">
              <img v-if="currentItem.cover_url" :src="currentItem.cover_url" :alt="currentItem.title" class="w-16 h-16 rounded-lg object-cover" />
              <div v-else class="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl">🎵</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ currentItem.title }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="currentItem.artist">{{ currentItem.artist }}</span>
                  <span v-if="currentItem.album"> · {{ currentItem.album }}</span>
                </p>
              </div>
              <button @click="togglePlay" class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-xl">
                {{ isPlaying ? '⏸️' : '▶️' }}
              </button>
            </div>
            <div class="p-4">
              <div v-if="!hasAudioUrl" class="text-center text-gray-500">
                <p>正在获取播放链接...</p>
              </div>
              <div v-else-if="audioUrl">
                <div class="flex items-center gap-3 mb-2">
                  <button @click="prev" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">⏮️</button>
                  <audio
                    ref="audioRef"
                    :src="audioUrl"
                    class="flex-1"
                    controls
                    @play="isPlaying = true"
                    @pause="isPlaying = false"
                    @ended="next"
                    @error="handleAudioError"
                  />
                  <button @click="next" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">⏭️</button>
                </div>
                <p class="text-xs text-gray-500 text-center mt-2">使用音频流播放，支持暂停、快进、快退</p>
              </div>
              <div v-else>
                <p class="text-center text-gray-500 mb-3">当前歌曲受版权保护，无法直接播放</p>
                <p class="text-center text-sm text-gray-400 mb-4">请使用下方网易云音乐外链播放器</p>
                <iframe
                  :key="iframeKey"
                  :src="currentIframeUrl"
                  frameborder="0"
                  class="w-full"
                  style="height: 100px;"
                  allow="autoplay"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
  tags: string[] | null
}

const items = ref<Music[]>([])
const loading = ref(false)
const currentIndex = ref(-1)
const isPlaying = ref(false)
const audioUrl = ref('')
const hasAudioUrl = ref(false)
const iframeKey = ref(0)
const audioRef = ref<HTMLAudioElement | null>(null)

const currentItem = computed(() => items.value[currentIndex.value] || null)

const currentIframeUrl = computed(() => {
  if (!currentItem.value) return ''
  const songId = currentItem.value.source_url?.split('=')?.[1] || currentItem.value.id
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=100`
})

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites/daily')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

const getSongId = (item: Music) => {
  return item.source_url?.split('=')?.[1] || item.id
}

const fetchAudioUrl = async (songId: string | number) => {
  hasAudioUrl.value = false
  audioUrl.value = ''
  try {
    const response = await http.get<any>(`/api/music?id=${songId}`)
    if (response?.success && response.data?.url) {
      audioUrl.value = response.data.url
    }
  } catch (error) {
    console.error('获取音频链接失败:', error)
  } finally {
    hasAudioUrl.value = true
  }
}

const play = async (index: number) => {
  currentIndex.value = index
  const songId = getSongId(items.value[index])
  await fetchAudioUrl(songId)
  iframeKey.value++
  
  await nextTick()
  if (audioRef.value && audioUrl.value) {
    try {
      await audioRef.value.play()
    } catch (e) {
      console.error('自动播放失败:', e)
    }
  }
}

const togglePlay = () => {
  if (audioRef.value) {
    if (isPlaying.value) {
      audioRef.value.pause()
    } else {
      audioRef.value.play().catch(e => console.error('播放失败:', e))
    }
  }
}

const prev = () => {
  if (items.value.length === 0) return
  currentIndex.value = currentIndex.value <= 0 ? items.value.length - 1 : currentIndex.value - 1
  play(currentIndex.value)
}

const next = () => {
  if (items.value.length === 0) return
  currentIndex.value = currentIndex.value >= items.value.length - 1 ? 0 : currentIndex.value + 1
  play(currentIndex.value)
}

const handleAudioError = () => {
  console.error('音频播放出错')
  hasAudioUrl.value = true
  audioUrl.value = ''
}

onMounted(load)
</script>
