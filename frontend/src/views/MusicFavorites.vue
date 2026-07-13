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
                :class="currentIndex === index && isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'"
              >
                <span class="text-white text-4xl">{{ currentIndex === index && isPlaying ? '⏸️' : '▶️' }}</span>
                <p v-if="item.description" class="text-white text-xs text-center line-clamp-3 mt-2 px-4">{{ item.description }}</p>
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

        <div v-if="currentItem" class="h-28"></div>
      </div>
    </div>

    <div v-if="currentItem" class="fixed bottom-0 left-0 right-0 z-50">
      <div class="bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div class="relative w-14 h-14 flex-shrink-0">
            <img v-if="currentItem.cover_url" :src="currentItem.cover_url" :alt="currentItem.title" class="w-full h-full object-cover rounded-lg" />
            <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">🎵</div>
            <div v-if="isPlaying" class="absolute inset-0 flex items-center justify-center">
              <div class="flex gap-0.5">
                <span class="w-1 bg-white dark:bg-gray-300 h-3 rounded-full animate-[bounce_0.5s_ease-in-out_infinite]"></span>
                <span class="w-1 bg-white dark:bg-gray-300 h-5 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.1s]"></span>
                <span class="w-1 bg-white dark:bg-gray-300 h-3 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.2s]"></span>
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ currentItem.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ currentItem.artist }}{{ currentItem.album ? ' · ' + currentItem.album : '' }}
            </p>
            <p v-if="playError" class="text-xs text-red-500 truncate">{{ playError }}</p>
          </div>
          <div class="flex items-center gap-3">
            <button @click="prev" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              ⏮️
            </button>
            <button @click="togglePlay" class="p-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-full transition-colors">
              {{ isPlaying ? '⏸️' : '▶️' }}
            </button>
            <button @click="next" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              ⏭️
            </button>
          </div>
          <div class="hidden sm:block w-48">
            <input
              type="range"
              v-model="progress"
              min="0"
              max="100"
              class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div v-if="useIframe" class="w-48 flex-shrink-0">
            <div class="text-xs text-gray-500 mb-1">请点击播放器播放</div>
            <iframe
              :key="iframeKey"
              :src="currentIframeUrl"
              frameborder="0"
              class="w-full"
              style="height: 66px;"
            ></iframe>
          </div>
          <div v-else class="text-xs text-gray-500">
            {{ durationText }}
          </div>
        </div>
      </div>
    </div>

    <audio ref="audioRef" @timeupdate="onTimeUpdate" @ended="onEnded" @error="onAudioError" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
const progress = ref(0)
const duration = ref(0)
const currentTime = ref(0)
const playError = ref('')
const useIframe = ref(false)
const iframeKey = ref(0)

let progressInterval: number | null = null
const audioRef = ref<HTMLAudioElement | null>(null)

const currentItem = computed(() => items.value[currentIndex.value] || null)

const currentIframeUrl = computed(() => {
  if (!currentItem.value) return ''
  const songId = currentItem.value.source_url?.split('=')?.[1] || currentItem.value.id
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`
})

const durationText = computed(() => {
  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }
  return `${format(currentTime.value)} / ${format(duration.value)}`
})

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites/daily')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

const getPlayUrl = async (songId: number | string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/music?id=${songId}`)
    const data = await response.json()
    if (data.success && data.data?.url) {
      return data.data.url
    }
  } catch (error) {
    console.error('获取播放链接失败:', error)
  }
  return null
}

const play = async (index: number) => {
  if (currentIndex.value === index && isPlaying.value) {
    togglePlay()
    return
  }

  currentIndex.value = index
  playError.value = ''
  useIframe.value = false

  const item = items.value[index]
  if (!item) return

  const songId = item.source_url?.split('=')?.[1] || item.id
  
  const audioUrl = await getPlayUrl(songId)
  
  if (audioUrl) {
    await nextTick()
    if (audioRef.value) {
      audioRef.value.src = audioUrl
      audioRef.value.load()
      try {
        await audioRef.value.play()
        isPlaying.value = true
        progress.value = 0
      } catch (error) {
        console.error('播放失败:', error)
        useIframe.value = true
        iframeKey.value++
        isPlaying.value = true
      }
    }
  } else {
    useIframe.value = true
    iframeKey.value++
    isPlaying.value = true
    playError.value = '该歌曲受版权保护，使用外链播放器'
    
    if (progressInterval) {
      clearInterval(progressInterval)
    }
    progressInterval = window.setInterval(() => {
      progress.value = (progress.value + 0.1) % 100
    }, 100)
  }
}

const togglePlay = async () => {
  if (!audioRef.value || useIframe.value) {
    isPlaying.value = !isPlaying.value
    return
  }

  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    try {
      await audioRef.value.play()
    } catch (error) {
      console.error('播放失败:', error)
    }
  }
  isPlaying.value = !isPlaying.value
}

const prev = () => {
  if (items.value.length === 0) return
  const newIndex = currentIndex.value <= 0 ? items.value.length - 1 : currentIndex.value - 1
  play(newIndex)
}

const next = () => {
  if (items.value.length === 0) return
  const newIndex = currentIndex.value >= items.value.length - 1 ? 0 : currentIndex.value + 1
  play(newIndex)
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    duration.value = audioRef.value.duration || 0
    progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  }
}

const onEnded = () => {
  isPlaying.value = false
  next()
}

const onAudioError = () => {
  playError.value = '音频播放失败，已切换到外链播放器'
  useIframe.value = true
  iframeKey.value++
}

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
})

onMounted(load)
</script>
