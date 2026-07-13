<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎵 我的音乐</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">每日精选 · 随机推荐</p>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!items.length && !fallbackItems.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🎶</p>
        <p>暂无音乐收藏</p>
        <p class="text-sm mt-2">管理员可在后台添加音乐收藏</p>
      </div>
      <div v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div
            v-for="(item, index) in displayItems"
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
          <div class="p-4 border-b dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">🎧 网易云音乐播放器</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">点击播放器中的播放按钮开始播放</p>
          </div>
          <div class="p-4">
            <iframe
              :key="iframeKey"
              :src="currentIframeUrl"
              frameborder="0"
              class="w-full"
              style="height: 450px;"
              allow="autoplay; fullscreen"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Music {
  id: number | string
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
const currentIndex = ref(0)
const isPlaying = ref(false)
const iframeKey = ref(0)

const fallbackItems = ref<Music[]>([
  {
    id: '492999917',
    title: 'Merry Christmas Mr. Lawrence',
    artist: '坂本龙一',
    album: '1996 (Re-Mastered)',
    cover_url: 'http://p1.music.126.net/Jgil1KYoQG7FLZ6V8DtXcQ==/109951172071362685.jpg?param=300x300',
    source_url: 'https://music.163.com/#/song?id=492999917',
    description: null,
    tags: ['钢琴', '电影原声']
  },
  {
    id: '31911137',
    title: 'The Truth That You Leave',
    artist: 'Pianoboy高至豪',
    album: 'Pianoboy',
    cover_url: 'http://p1.music.126.net/x2YwR-3BpWZv785bW0qV_Q==/109951164499445510.jpg?param=300x300',
    source_url: 'https://music.163.com/#/song?id=31911137',
    description: null,
    tags: ['钢琴', '治愈']
  },
  {
    id: '488592',
    title: 'Kiss the Rain',
    artist: 'Yiruma',
    album: 'From the Yellow Room',
    cover_url: 'http://p1.music.126.net/b4z8R6Q80Jw66H3nGk4R2A==/109951164501181055.jpg?param=300x300',
    source_url: 'https://music.163.com/#/song?id=488592',
    description: null,
    tags: ['钢琴', '治愈']
  },
  {
    id: '227045',
    title: 'Canon in D',
    artist: 'Johann Pachelbel',
    album: 'Canon',
    cover_url: 'http://p1.music.126.net/fJg3t6u8l5n2M7P9Q0R1S2T==/109951164502916600.jpg?param=300x300',
    source_url: 'https://music.163.com/#/song?id=227045',
    description: null,
    tags: ['古典', '钢琴']
  },
  {
    id: '29838668',
    title: 'Summer',
    artist: '久石让',
    album: 'ENCORE',
    cover_url: 'http://p1.music.126.net/Nx0K0I8X5M9P2Q7R1S6T3U==/109951164504652145.jpg?param=300x300',
    source_url: 'https://music.163.com/#/song?id=29838668',
    description: null,
    tags: ['钢琴', '电影原声']
  },
])

const displayItems = computed(() => {
  if (items.value.length > 0) return items.value
  return fallbackItems.value
})

const currentItem = computed(() => displayItems.value[currentIndex.value] || null)

const songIds = computed(() => {
  return displayItems.value.map(item => {
    const id = item.source_url?.split('=')?.[1] || item.id
    return id
  }).join(',')
})

const currentIframeUrl = computed(() => {
  if (!songIds.value) return ''
  return `https://music.163.com/outchain/player?type=0&id=${songIds.value}&auto=0&height=450`
})

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites/daily')
    if (r?.success && r.data?.length > 0) {
      items.value = r.data || []
    }
  } catch (error) {
    console.error('加载音乐失败:', error)
  } finally {
    loading.value = false
  }
}

const play = (index: number) => {
  currentIndex.value = index
  iframeKey.value++
}

onMounted(load)
</script>
