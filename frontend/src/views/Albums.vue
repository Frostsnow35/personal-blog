<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">📷 今日相册</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">每日精选 · 今日博主推荐</p>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!album" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🖼️</p>
        <p>暂无相册</p>
        <p class="text-sm mt-2">管理员可在后台添加相册</p>
      </div>
      <div v-else class="space-y-6">
        <div class="card overflow-hidden">
          <div class="relative w-full" style="aspect-ratio: 16/9;">
            <img v-if="album.cover_url" :src="album.cover_url" :alt="album.name" class="absolute inset-0 w-full h-full object-cover" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-6xl">📷</div>
          </div>
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ album.name }}</h2>
            <p v-if="album.description" class="text-gray-500 dark:text-gray-400 mt-2">{{ album.description }}</p>
            <p class="text-sm text-gray-400 mt-2">� {{ album.photo_count }} 张照片</p>
          </div>
        </div>
        
        <div v-if="album.photos?.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="photo in album.photos"
            :key="photo.id"
            class="relative w-full bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-lg group"
            style="aspect-ratio: 1/1;"
          >
            <img :src="photo.url" :alt="photo.name || album.name" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div v-if="photo.name" class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
              <p class="text-white text-xs truncate">{{ photo.name }}</p>
            </div>
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

interface Photo {
  id: number
  url: string
  name: string | null
}

interface Album {
  id: number
  name: string
  slug: string
  description: string | null
  cover_url: string | null
  photo_count: number
  photos: Photo[]
}

const album = ref<Album | null>(null)
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/albums/daily')
    if (r?.success) album.value = r.data || null
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
