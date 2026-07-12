<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎵 个人喜爱音乐</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">那些循环过无数次的旋律</p>

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
              class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span class="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                <span class="text-2xl">▶</span>
              </span>
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

const items = ref<Music[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/music-favorites')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

onMounted(load)
</script>
