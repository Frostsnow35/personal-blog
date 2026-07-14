<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎬 今日电影</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-6">每日精选 · 今日博主推荐</p>
      <div v-if="item" class="text-center mb-8">
        <button
          @click="refreshMovie"
          :disabled="refreshing"
          class="inline-flex items-center gap-2 px-5 py-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow"
        >
          <svg
            :class="{ 'animate-spin': refreshing }"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ refreshing ? '换一部中...' : '换一部' }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!item" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🎞️</p>
        <p>暂无电影收藏</p>
        <p class="text-sm mt-2">管理员可在后台添加电影收藏</p>
      </div>
      <div v-else class="flex justify-center">
        <div class="max-w-md w-full card overflow-hidden">
          <div class="relative w-full" style="aspect-ratio: 2/3;">
            <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-6xl">🎬</div>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-all duration-300 p-6"
            >
              <p v-if="item.description" class="text-white text-sm text-center line-clamp-6">{{ item.description }}</p>
              <div v-if="item.tags?.length" class="mt-3 flex flex-wrap justify-center gap-2">
                <span v-for="tag in item.tags" :key="tag" class="px-3 py-1 bg-white/20 text-white text-xs rounded">{{ tag }}</span>
              </div>
            </div>
          </div>
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ item.title }}</h2>
            <p class="text-gray-500 dark:text-gray-400 mt-2">
              <span v-if="item.director">导演：{{ item.director }}</span>
              <span v-if="item.year"> · {{ item.year }}年</span>
            </p>
            <p v-if="item.description" class="text-gray-600 dark:text-gray-300 mt-3 text-sm">{{ item.description }}</p>
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

interface Movie {
  id: number
  title: string
  director: string | null
  year: number | null
  cover_url: string | null
  source_url: string | null
  description: string | null
  tags: string[] | null
}

const item = ref<Movie | null>(null)
const loading = ref(false)
const refreshing = ref(false)

const load = async (forceRandom = false) => {
  loading.value = !forceRandom
  refreshing.value = forceRandom
  try {
    const url = forceRandom ? '/movie-favorites/daily?refresh=1' : '/movie-favorites/daily'
    const r = await http.get<any>(url)
    if (r?.success) item.value = r.data || null
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const refreshMovie = () => load(true)

onMounted(() => load())
</script>
