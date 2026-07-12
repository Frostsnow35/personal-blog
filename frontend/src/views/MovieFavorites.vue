<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🎬 喜爱电影</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">看过的、想看的、难忘的</p>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🎞️</p>
        <p>暂无电影</p>
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <a
          v-for="m in items"
          :key="m.id"
          :href="m.source_url || '#'"
          target="_blank"
          rel="noopener"
          class="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
          <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 2/3;">
            <img v-if="m.cover_url" :src="m.cover_url" :alt="m.title" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">🎬</div>
            <div v-if="m.rating" class="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded">★ {{ m.rating }}</div>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{{ m.title }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              <span v-if="m.director">{{ m.director }}</span>
              <span v-if="m.year"> · {{ m.year }}</span>
            </p>
          </div>
        </a>
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
  rating: number | null
}

const items = ref<Movie[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/movie-favorites')
    if (r?.success) items.value = r.data || []
  } finally { loading.value = false }
}

onMounted(load)
</script>
