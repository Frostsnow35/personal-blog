<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button @click="$router.back()" class="text-ocean-600 hover:text-ocean-700 mb-4 inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        返回
      </button>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!album" class="text-center py-12 text-gray-500">相册不存在</div>
      <div v-else>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ album.name }}</h1>
        <p v-if="album.description" class="text-gray-600 dark:text-gray-400 mb-6">{{ album.description }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">共 {{ album.photos?.length || 0 }} 张</p>

        <div v-if="!album.photos?.length" class="text-center py-16 text-gray-500 dark:text-gray-400">
          <p class="text-5xl mb-2">🖼️</p>
          <p>该相册暂无照片</p>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="(p, idx) in album.photos"
            :key="p.id"
            class="relative aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-lg cursor-pointer group"
            @click="openLightbox(idx)"
          >
            <img :src="p.url" :alt="p.description || ''" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div
      v-if="lightboxIdx !== null"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      @click.self="closeLightbox"
    >
      <button @click="closeLightbox" class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">×</button>
      <button
        v-if="lightboxIdx! > 0"
        @click="lightboxIdx!--"
        class="absolute left-4 text-white text-4xl hover:text-gray-300"
      >‹</button>
      <button
        v-if="album && lightboxIdx! < album.photos.length - 1"
        @click="lightboxIdx++"
        class="absolute right-4 text-white text-4xl hover:text-gray-300"
      >›</button>
      <img
        v-if="album && album.photos[lightboxIdx!]"
        :src="album.photos[lightboxIdx!].url"
        :alt="album.photos[lightboxIdx!].description || ''"
        class="max-w-full max-h-full object-contain"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Photo {
  id: number
  url: string
  description: string | null
}

interface Album {
  id: number
  name: string
  description: string | null
  photos: Photo[]
}

const route = useRoute()
const album = ref<Album | null>(null)
const loading = ref(false)
const lightboxIdx = ref<number | null>(null)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>(`/albums/${route.params.id}`)
    if (r?.success) {
      album.value = r.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openLightbox = (idx: number) => { lightboxIdx.value = idx }
const closeLightbox = () => { lightboxIdx.value = null }

onMounted(load)
watch(() => route.params.id, load)
</script>
