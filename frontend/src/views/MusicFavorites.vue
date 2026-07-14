<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import { Music, Play, ExternalLink, Heart } from 'lucide-vue-next';
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
const selectedId = ref<string | null>(null);
const playerError = ref<string | null>(null);

const extractSongId = (sourceUrl: string): string => {
  const match = sourceUrl.match(/id=(\d+)/);
  return match ? match[1] : '';
};

const getNeteaseEmbedUrl = (item: MusicItem): string => {
  const songId = extractSongId(item.source_url);
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

const selectSong = (item: MusicItem) => {
  playerError.value = null;
  if (selectedId.value === item.id) {
    selectedId.value = null;
  } else {
    selectedId.value = item.id;
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
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-ocean-500 to-sea-500 rounded-2xl shadow-lg mb-4">
          <Music class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          个人喜爱音乐
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2 text-lg">🎵 每日精选 · 我的音乐品味</p>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-12 h-12 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="musicItems.length === 0" class="text-center py-20">
        <Heart class="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 text-xl">暂无收藏音乐</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="item in musicItems"
          :key="item.id"
          :class="[
            'music-card group cursor-pointer transition-all duration-300',
            selectedId === item.id ? 'ring-2 ring-ocean-500 scale-[1.02]' : ''
          ]"
          @click="selectSong(item)"
        >
          <div class="relative aspect-[4/3] overflow-hidden rounded-xl mb-4">
            <img
              v-lazy-img="getCoverSrc(item.cover_url)"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              @error="onCoverError($event)"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <div class="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 inline-flex">
                <Play class="w-4 h-4 text-ocean-600" />
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">点击播放</span>
              </div>
            </div>
            <div v-if="selectedId === item.id" class="absolute top-3 right-3">
              <div class="w-8 h-8 bg-ocean-500 rounded-full flex items-center justify-center">
                <Play class="w-4 h-4 text-white fill-white" />
              </div>
            </div>
          </div>

          <div class="px-1">
            <h3 class="text-gray-900 dark:text-gray-100 font-semibold text-lg truncate group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
              {{ item.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">{{ item.artist }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{{ item.album }}</p>
          </div>

          <Transition name="slide-up">
            <div v-if="selectedId === item.id" class="mt-4 px-1">
              <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div v-if="extractSongId(item.source_url)" class="player-container">
                  <iframe
                    :src="getNeteaseEmbedUrl(item)"
                    frameborder="no"
                    border="0"
                    marginwidth="0"
                    marginheight="0"
                    width="100%"
                    height="66"
                    allow="autoplay"
                  ></iframe>
                </div>
                <div v-else class="text-center py-3">
                  <p class="text-gray-500 dark:text-gray-400 text-sm">无法获取播放链接</p>
                </div>
              </div>
            </div>
          </Transition>

          <div class="mt-3 flex gap-2">
            <button
              @click.stop="openInNetease(item)"
              class="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
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
.music-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}

.dark .music-card {
  background: rgba(30, 41, 59, 0.9);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(10px);
}

.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  max-height: 120px;
  transform: translateY(0);
}

.player-container {
  border-radius: 8px;
  overflow: hidden;
}

button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
</style>
