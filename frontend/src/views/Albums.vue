<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">📷 相册</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">记录生活的瞬间</p>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!albums.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🖼️</p>
        <p>暂无相册</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="a in albums"
          :key="a.id"
          :to="`/albums/${a.id}`"
          class="card overflow-hidden hover:shadow-xl transition-all duration-300 group"
        >
          <div class="relative w-full bg-gray-200 dark:bg-gray-700" style="aspect-ratio: 4/3;">
            <img
              v-if="a.cover_url"
              :src="a.cover_url"
              :alt="a.name"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-5xl">📷</div>
          </div>
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ a.name }}</h3>
            <p v-if="a.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{{ a.description }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">📸 {{ a.photo_count }} 张</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Album {
  id: number
  name: string
  slug: string
  description: string | null
  cover_url: string | null
  photo_count: number
}

const albums = ref<Album[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/albums')
    if (r?.success) {
      albums.value = r.data || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
