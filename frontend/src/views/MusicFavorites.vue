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

        <div v-if="currentItem" class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-50">
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
          </div>
        </div>

        <div v-if="currentItem" class="h-20"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

let audio: HTMLAudioElement | null = null
let progressInterval: number | null = null

const currentItem = computed(() => items.value[currentIndex.value] || null)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites/daily')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

const getPlayUrl = async (songId: string | number): Promise<string | null> => {
  try {
    const r = await http.get<any>(`/proxy/music/url?id=${songId}&platform=netease&br=320000`)
    if (r?.success && r.data?.data?.[0]?.url) {
      return r.data.data[0].url
    }
    return null
  } catch {
    return null
  }
}

const play = async (index: number) => {
  if (currentIndex.value === index && isPlaying.value) {
    togglePlay()
    return
  }

  currentIndex.value = index
  const item = items.value[index]
  
  const playUrl = await getPlayUrl(item.source_url?.split('=')?.[1] || item.id)
  if (!playUrl) {
    return
  }

  if (audio) {
    audio.pause()
    audio.src = playUrl
    audio.load()
  } else {
    audio = new Audio(playUrl)
    audio.loop = false
    audio.addEventListener('ended', () => {
      next()
    })
    audio.addEventListener('timeupdate', () => {
      if (audio && audio.duration) {
        progress.value = (audio.currentTime / audio.duration) * 100
      }
    })
  }

  audio.play()
  isPlaying.value = true
}

const togglePlay = () => {
  if (!audio) return
  
  if (isPlaying.value) {
    audio.pause()
  } else {
    audio.play()
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

watch(progress, (newVal) => {
  if (audio && audio.duration) {
    audio.currentTime = (newVal / 100) * audio.duration
  }
})

onUnmounted(() => {
  if (audio) {
    audio.pause()
    audio = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
  }
})

onMounted(load)
</script>
