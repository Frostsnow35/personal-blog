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
                <span class="text-white text-4xl">🎧</span>
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
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">请点击播放器中的播放按钮开始播放</p>
          </div>
          <div class="p-4">
            <div v-if="currentItem" class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <iframe
                  :key="iframeKey"
                  :src="currentIframeUrl"
                  frameborder="0"
                  class="w-full"
                  style="height: 80px;"
                ></iframe>
              </div>
              <div class="flex items-center gap-3">
                <button @click="prev" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  ⏮️
                </button>
                <button @click="next" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  ⏭️
                </button>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <p>请点击上方歌曲卡片选择要播放的音乐</p>
            </div>
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
const iframeKey = ref(0)

const currentItem = computed(() => items.value[currentIndex.value] || null)

const currentIframeUrl = computed(() => {
  if (!currentItem.value) return ''
  const songId = currentItem.value.source_url?.split('=')?.[1] || currentItem.value.id
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=80`
})

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites/daily')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

const play = (index: number) => {
  currentIndex.value = index
  iframeKey.value++
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

onMounted(load)
</script>
