<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import { Music, ExternalLink, Heart } from 'lucide-vue-next';
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
  description: string;
  created_at?: string;
}

const randomMusic = ref<MusicItem[]>([]);
const loading = ref(true);

const extractSongId = (sourceUrl: string): string => {
  const match = sourceUrl.match(/id=(\d+)/);
  return match ? match[1] : '';
};

const loadRandomMusic = async () => {
  try {
    const response = await http.get<any>('/music-favorites/random');
    if (response?.data) {
      randomMusic.value = response.data;
    }
  } catch (error: any) {
    console.error('加载音乐失败:', error);
    toast.error('加载音乐失败', error?.message || String(error));
  } finally {
    loading.value = false;
  }
};

const openInNetease = (item: MusicItem) => {
  const songId = extractSongId(item.source_url);
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
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#60a5fa'/>
          <stop offset='100%' stop-color='#0ea5e9'/>
        </linearGradient>
      </defs>
      <rect fill='url(#g)' width='100%' height='100%'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='64' font-family='sans-serif'>🎵</text>
    </svg>`
  );
};

onMounted(() => {
  loadRandomMusic();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
    <AmbientBackdrop />
    <SiteNav />

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-ocean-500 to-sea-500 rounded-2xl shadow-xl mb-6">
          <Music class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          个人喜爱音乐
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-lg">🎵 每日精选 · 我的音乐品味</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-12 h-12 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="randomMusic.length === 0" class="text-center py-20">
        <Heart class="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <p class="text-gray-500 dark:text-gray-400 text-xl">暂无收藏音乐</p>
        <p class="text-gray-400 dark:text-gray-500 mt-2">快去管理后台添加喜欢的音乐吧</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="item in randomMusic"
          :key="item.id"
          class="music-card group cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl"
        >
          <div class="relative aspect-square overflow-hidden rounded-2xl mb-5 shadow-lg">
            <img
              :src="getCoverSrc(item.cover_url)"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              @error="onCoverError($event)"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div class="px-2">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 truncate mb-2">
              {{ item.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">{{ item.artist }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs mb-4">{{ item.album }}</p>

            <div v-if="item.description" class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-5">
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic">
                "{{ item.description }}"
              </p>
            </div>

            <button
              @click="openInNetease(item)"
              class="w-full px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg"
            >
              <ExternalLink class="w-4 h-4" />
              在网易云播放
            </button>
          </div>
        </div>
      </div>

      <div class="text-center mt-12">
        <p class="text-gray-400 dark:text-gray-500 text-sm">
          💡 刷新页面查看不同的音乐推荐
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 32px -8px rgb(0 0 0 / 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dark .music-card {
  background: rgba(30, 41, 59, 0.95);
  box-shadow: 0 8px 32px -8px rgb(0 0 0 / 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
</style>