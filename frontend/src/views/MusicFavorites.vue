<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { toast } from 'vue3-toastify';
import { Music, Play, Pause, SkipBack, SkipForward, ExternalLink } from 'lucide-vue-next';
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
const currentIndex = ref(0);
const isPlaying = ref(false);
const playLoading = ref(false);

const currentItem = computed(() => musicItems.value[currentIndex.value] || null);
const hasNext = computed(() => currentIndex.value < musicItems.value.length - 1);
const hasPrev = computed(() => currentIndex.value > 0);

const getSongId = (item: MusicItem): string => {
  return item.source_url?.split('=')?.[1] || item.id;
};

const getNeteaseEmbedUrl = (item: MusicItem): string => {
  const songId = getSongId(item);
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=1&height=32`;
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

const playSong = async (index: number) => {
  currentIndex.value = index;
  playLoading.value = true;
  
  await nextTick();
  
  isPlaying.value = true;
  playLoading.value = false;
};

const togglePlay = () => {
  if (!currentItem.value) {
    if (musicItems.value.length > 0) {
      playSong(0);
    }
    return;
  }
  
  if (isPlaying.value) {
    isPlaying.value = false;
  } else {
    isPlaying.value = true;
  }
};

const playPrev = () => {
  if (hasPrev.value) {
    playSong(currentIndex.value - 1);
  }
};

const playNext = () => {
  if (hasNext.value) {
    playSong(currentIndex.value + 1);
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

onBeforeUnmount(() => {
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

      <div v-else>
        <TransitionGroup name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div
            v-for="(item, index) in musicItems"
            :key="item.id"
            @click="playSong(index)"
            :class="[
              'card overflow-hidden cursor-pointer hover-lift',
              currentIndex === index ? 'ring-2 ring-ocean-500' : ''
            ]"
          >
          <div class="relative aspect-square overflow-hidden">
            <img
              v-lazy-img="getCoverSrc(item.cover_url)"
              :alt="item.title"
              class="w-full h-full object-cover bg-gray-200 dark:bg-gray-700"
              @error="onCoverError($event)"
            />
            <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Play v-if="currentIndex !== index || !isPlaying" class="w-16 h-16 text-white" />
              <Pause v-else class="w-16 h-16 text-white" />
            </div>
          </div>
          <div class="p-4">
            <h3 class="text-gray-900 dark:text-gray-100 font-semibold truncate">{{ item.title }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm truncate">{{ item.artist }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs truncate">{{ item.album }}</p>
            <button
              @click.stop="openInNetease(item)"
              class="mt-3 w-full px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm press"
            >
              <ExternalLink class="w-4 h-4" />
              在网易云播放
            </button>
          </div>
          </div>
        </TransitionGroup>

        <div class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 px-3 py-2 sm:px-4 sm:py-3">
          <div class="max-w-6xl mx-auto flex items-center gap-3 sm:gap-6">
            <div v-if="currentItem" class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <img
                v-lazy-img="getCoverSrc(currentItem.cover_url)"
                :alt="currentItem.title"
                class="w-10 h-10 sm:w-16 sm:h-16 rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
                @error="onCoverError($event)"
              />
              <div class="min-w-0 w-20 sm:w-auto">
                <h4 class="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium truncate">{{ currentItem.title }}</h4>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ currentItem.artist }}</p>
              </div>
            </div>

            <div class="flex-1 flex flex-col items-center gap-1 sm:gap-2">
              <div class="flex items-center gap-2 sm:gap-4">
                <button
                  @click="playPrev"
                  :disabled="!hasPrev"
                  class="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors press"
                >
                  <SkipBack class="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  @click="togglePlay"
                  class="p-2.5 sm:p-4 bg-ocean-600 hover:bg-ocean-500 rounded-full text-white transition-colors press"
                >
                  <span v-if="playLoading" class="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <Pause v-else-if="isPlaying" class="w-6 h-6 sm:w-8 sm:h-8" />
                  <Play v-else class="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button
                  @click="playNext"
                  :disabled="!hasNext"
                  class="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors press"
                >
                  <SkipForward class="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div v-if="currentItem" class="w-full max-w-md">
                <iframe
                  :key="currentIndex + '-' + isPlaying"
                  :src="getNeteaseEmbedUrl(currentItem)"
                  frameborder="no"
                  border="0"
                  marginwidth="0"
                  marginheight="0"
                  width="100%"
                  height="32"
                  allow="autoplay"
                ></iframe>
              </div>
            </div>

            <div class="hidden sm:flex items-center gap-3 flex-shrink-0">
              <button
                v-if="currentItem"
                @click="openInNetease(currentItem)"
                class="p-2 text-red-500 hover:text-red-400 transition-colors press"
                title="在网易云播放"
              >
                <ExternalLink class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div class="h-32"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.dark .card {
  background: rgba(30, 41, 59, 0.9);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.list-move {
  transition: transform 0.4s ease;
}

button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
  border: none;
}
</style>
