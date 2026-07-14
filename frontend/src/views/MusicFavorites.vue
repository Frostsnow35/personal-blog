<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
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
  audio_url: string;
  created_at: string;
}

const musicItems = ref<MusicItem[]>([]);
const loading = ref(true);
const currentIndex = ref(0);
const isPlaying = ref(false);
const progress = ref(0);
const duration = ref(0);
const currentTime = ref(0);

const audioElement = ref<HTMLAudioElement | null>(null);

const currentItem = computed(() => musicItems.value[currentIndex.value] || null);
const hasNext = computed(() => currentIndex.value < musicItems.value.length - 1);
const hasPrev = computed(() => currentIndex.value > 0);

const playSong = (index: number) => {
  if (!musicItems.value[index]) return;
  
  currentIndex.value = index;
  isPlaying.value = false;
  
  const audio = audioElement.value;
  if (audio) {
    audio.src = musicItems.value[index].audio_url || '';
    audio.load();
    
    setTimeout(() => {
      audio.play().then(() => {
        isPlaying.value = true;
      }).catch((error) => {
        console.error('播放失败:', error);
        toast.error('播放失败，请检查音频文件');
      });
    }, 100);
  }
};

const togglePlay = () => {
  if (!currentItem.value) {
    if (musicItems.value.length > 0) {
      playSong(0);
    }
    return;
  }
  
  const audio = audioElement.value;
  if (!audio) return;
  
  if (isPlaying.value) {
    audio.pause();
    isPlaying.value = false;
  } else {
    audio.play().then(() => {
      isPlaying.value = true;
    }).catch((error) => {
      console.error('播放失败:', error);
      toast.error('播放失败，请检查音频文件');
    });
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

const updateProgress = () => {
  const audio = audioElement.value;
  if (audio) {
    currentTime.value = audio.currentTime;
    duration.value = audio.duration;
    progress.value = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
  }
};

const seekTo = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const audio = audioElement.value;
  if (audio && duration.value > 0) {
    audio.currentTime = (parseFloat(target.value) / 100) * duration.value;
  }
};

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

const openInNetease = (item: MusicItem) => {
  const songId = item.source_url?.split('=')?.[1] || item.id;
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

const handleEnded = () => {
  if (hasNext.value) {
    playSong(currentIndex.value + 1);
  } else {
    isPlaying.value = false;
  }
};

onMounted(() => {
  loadMusic();
});

onBeforeUnmount(() => {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = '';
  }
});

watch(currentIndex, () => {
  if (audioElement.value && currentItem.value) {
    audioElement.value.src = currentItem.value.audio_url || '';
    audioElement.value.load();
  }
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-24">
          <div
            v-for="(item, index) in musicItems"
            :key="item.id"
            @click="playSong(index)"
            :class="[
              'card overflow-hidden cursor-pointer hover-lift transition-all duration-300',
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
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div class="text-center text-white">
                  <Play v-if="currentIndex !== index || !isPlaying" class="w-12 h-12 mx-auto" />
                  <Pause v-else class="w-12 h-12 mx-auto" />
                </div>
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
        </div>
      </div>
    </div>

    <audio
      ref="audioElement"
      @timeupdate="updateProgress"
      @loadedmetadata="updateProgress"
      @ended="handleEnded"
      @error="(e) => { console.error('音频错误:', e); isPlaying.value = false; }"
    ></audio>

    <div v-if="currentItem" class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-50">
      <div class="max-w-6xl mx-auto flex items-center gap-4">
        <img
          v-lazy-img="getCoverSrc(currentItem.cover_url)"
          :alt="currentItem.title"
          class="w-12 h-12 rounded-lg object-cover bg-gray-200 dark:bg-gray-700"
          @error="onCoverError($event)"
        />
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ currentItem.title }}</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ currentItem.artist }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="playPrev"
            :disabled="!hasPrev"
            class="p-2 text-gray-600 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors press"
          >
            <SkipBack class="w-5 h-5" />
          </button>
          <button
            @click="togglePlay"
            class="p-3 bg-ocean-600 hover:bg-ocean-500 rounded-full text-white transition-colors press"
          >
            <Pause v-if="isPlaying" class="w-6 h-6" />
            <Play v-else class="w-6 h-6" />
          </button>
          <button
            @click="playNext"
            :disabled="!hasNext"
            class="p-2 text-gray-600 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors press"
          >
            <SkipForward class="w-5 h-5" />
          </button>
        </div>
        <div class="hidden sm:flex items-center gap-3 w-48">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            min="0"
            max="100"
            :value="progress"
            @input="seekTo"
            class="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-ocean-500"
          />
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(duration) }}</span>
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

button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
  border: none;
}
</style>
