<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import { Music, ExternalLink } from 'lucide-vue-next';
import { http } from '@/utils/http';
import SiteNav from '@/components/SiteNav.vue';
import AmbientBackdrop from '@/components/AmbientBackdrop.vue';

interface MusicItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  source_url: string;
  created_at: string;
}

const musicItems = ref<MusicItem[]>([]);
const loading = ref(true);
const expandedId = ref<string | null>(null);

const getSongId = (item: MusicItem): string => {
  return item.source_url?.split('=')?.[1] || item.id;
};

const getNeteaseEmbedUrl = (item: MusicItem): string => {
  const songId = getSongId(item);
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
};

const loadMusic = async () => {
  try {
    const response = await http.get<any>('/music-favorites');
    if (response?.data) {
      musicItems.value = response.data;
    }
  } catch (error: any) {
    console.error('加载音乐失败:', error);
    toast.error('加载音乐失败', error?.message || String(error));
  } finally {
    loading.value = false;
  }
};

const toggleExpand = (item: MusicItem) => {
  if (expandedId.value === item.id) {
    expandedId.value = null;
  } else {
    expandedId.value = item.id;
  }
};

const openInNetease = (item: MusicItem) => {
  const songId = getSongId(item);
  const url = `https://music.163.com/#/song?id=${songId}`;
  window.open(url, '_blank');
};

const getCoverSrc = (src?: string) => {
  if (!src) return '';
  try {
    if (/^http:\/\//i.test(src)) {
      return src.replace(/^http:\/\//i, 'https://');
    }
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
    return `/${src.replace(/^\/+/, '')}`;
  } catch {
    return src;
  }
};

const onCoverError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.style.objectFit = 'contain';
  target.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#60a5fa'/>
          <stop offset='100%' stop-color='#0ea5e9'/>
        </linearGradient>
      </defs>
      <rect fill='url(#g)' width='100%' height='100%'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='48' font-family='sans-serif'>Music</text>
    </svg>`
  );
};

onMounted(() => {
  loadMusic();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
    <AmbientBackdrop />
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-3">
          <Music class="w-10 h-10 text-ocean-600 dark:text-ocean-400" />
          个人喜爱音乐
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">🎵 每日精选 · 我的音乐品味</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-12 h-12 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="musicItems.length === 0" class="text-center py-20">
        <Music class="w-20 h-20 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 text-xl">暂无收藏音乐</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="item in musicItems"
          :key="item.id"
          :class="[
            'card overflow-hidden cursor-pointer hover-lift transition-all duration-300',
            expandedId === item.id ? 'ring-2 ring-ocean-500' : ''
          ]"
        >
          <div
            class="relative aspect-square overflow-hidden"
            @click="toggleExpand(item)"
          >
            <img
              v-lazy-img="getCoverSrc(item.cover_url)"
              :alt="item.title"
              class="w-full h-full object-cover bg-gray-200 dark:bg-gray-700"
              @error="onCoverError($event)"
            />
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div class="text-center text-white">
                <Music class="w-12 h-12 mx-auto mb-2 opacity-80" />
                <span class="text-sm opacity-80">{{ expandedId === item.id ? '点击收起' : '点击播放' }}</span>
              </div>
            </div>
          </div>

          <div class="p-4">
            <h3 class="text-gray-900 dark:text-gray-100 font-semibold truncate">{{ item.title }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm truncate">{{ item.artist }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs truncate">{{ item.album }}</p>

            <Transition name="expand">
              <div v-if="expandedId === item.id" class="mt-3">
                <iframe
                  :src="getNeteaseEmbedUrl(item)"
                  frameborder="no"
                  border="0"
                  marginwidth="0"
                  marginheight="0"
                  width="100%"
                  height="66"
                  allow="autoplay"
                  class="rounded-lg"
                ></iframe>
              </div>
            </Transition>

            <button
              @click.stop="openInNetease(item)"
              class="mt-3 w-full px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm press"
            >
              <ExternalLink class="w-4 h-4" />
              在网易云播放
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.dark .card {
  background: rgba(30, 41, 59, 0.95);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 100px;
  transform: translateY(0);
}

button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
</style>
