<script setup lang="ts">import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-vue-next';
import { http } from '@/utils/http';
const router = useRouter();
interface MusicItem {
 id: string;
 title: string;
 artist: string;
 album: string;
 cover: string;
 source_url: string;
 created_at: string;
}
const musicItems = ref<MusicItem[]>([]);
const loading = ref(true);
const currentIndex = ref(0);
const isPlaying = ref(false);
const volume = ref(80);
const isMuted = ref(false);
const progress = ref(0);
const duration = ref(0);
const playLoading = ref(false);
let audioElement: HTMLAudioElement | null = null;
const currentItem = computed(() => musicItems.value[currentIndex.value] || null);
const hasNext = computed(() => currentIndex.value < musicItems.value.length - 1);
const hasPrev = computed(() => currentIndex.value > 0);
const audioSrc = computed(() => {
 if (!currentItem.value)
 return '';
 const songId = currentItem.value.source_url?.split('=')?.[1] || currentItem.value.id;
 const name = encodeURIComponent(currentItem.value.title || '');
 const artist = encodeURIComponent(currentItem.value.artist || '');
 return `/api/music?id=${songId}&name=${name}&artist=${artist}&stream=1`;
});
const loadMusic = async () => {
 try {
 const response = await http.get<any>('/music-favorites');
 if (response?.data) {
 musicItems.value = response.data;
 }
 }
 catch (error: any) {
 console.error('加载音乐失败:', error);
 toast.error('加载音乐失败', error?.message || String(error));
 }
 finally {
 loading.value = false;
 }
};
const initAudio = () => {
 if (!audioElement) {
 audioElement = new Audio();
 audioElement.volume = volume.value / 100;
 audioElement.addEventListener('timeupdate', () => {
 if (audioElement && audioElement.duration) {
 progress.value = (audioElement.currentTime / audioElement.duration) * 100;
 }
 });
 audioElement.addEventListener('loadedmetadata', () => {
 if (audioElement) {
 duration.value = audioElement.duration;
 }
 });
 audioElement.addEventListener('ended', () => {
 if (hasNext.value) {
 playNext();
 }
 else {
 isPlaying.value = false;
 }
 });
 audioElement.addEventListener('error', (e) => {
 console.error('音频播放错误:', e);
 isPlaying.value = false;
 playLoading.value = false;
 toast.error('无法播放该歌曲，可能是版权限制或网络问题');
 });
 }
};
const playSong = async (index: number) => {
 initAudio();
 currentIndex.value = index;
 playLoading.value = true;
 try {
 if (audioElement) {
 audioElement.src = audioSrc.value;
 await audioElement.load();
 await audioElement.play();
 isPlaying.value = true;
 }
 }
 catch (error: any) {
 console.error('播放失败:', error);
 isPlaying.value = false;
 toast.error('播放失败', error?.message || String(error));
 }
 finally {
 playLoading.value = false;
 }
};
const togglePlay = async () => {
 if (!audioElement) {
 if (currentItem.value) {
 await playSong(currentIndex.value);
 }
 return;
 }
 if (isPlaying.value) {
 audioElement.pause();
 isPlaying.value = false;
 }
 else {
 try {
 await audioElement.play();
 isPlaying.value = true;
 }
 catch (error) {
 console.error('播放失败:', error);
 toast.error('播放失败');
 }
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
const setProgress = (event: Event) => {
 const target = event.target as HTMLInputElement;
 if (audioElement && audioElement.duration) {
 audioElement.currentTime = (parseFloat(target.value) / 100) * audioElement.duration;
 }
};
const setVolume = (event: Event) => {
 const target = event.target as HTMLInputElement;
 volume.value = parseFloat(target.value);
 if (audioElement) {
 audioElement.volume = volume.value / 100;
 }
};
const toggleMute = () => {
 if (!audioElement)
 return;
 isMuted.value = !isMuted.value;
 audioElement.muted = isMuted.value;
};
const formatTime = (seconds: number) => {
 const mins = Math.floor(seconds / 60);
 const secs = Math.floor(seconds % 60);
 return `${mins}:${secs.toString().padStart(2, '0')}`;
};
loadMusic();
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-bold text-white flex items-center gap-3">
          <Music class="w-10 h-10 text-purple-400" />
          个人喜爱音乐
        </h1>
        <button
          @click="router.push('/')"
          class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
        >
          返回首页
        </button>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="musicItems.length === 0" class="text-center py-20">
        <Music class="w-20 h-20 text-gray-600 mx-auto mb-4" />
        <p class="text-gray-400 text-xl">暂无收藏音乐</p>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          <div
            v-for="(item, index) in musicItems"
            :key="item.id"
            @click="playSong(index)"
            :class="[
              'bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white/20',
              currentIndex === index ? 'ring-2 ring-purple-500' : ''
            ]"
          >
            <div class="relative aspect-square overflow-hidden">
              <img
                :src="item.cover"
                :alt="item.title"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play v-if="currentIndex !== index || !isPlaying" class="w-16 h-16 text-white" />
                <Pause v-else class="w-16 h-16 text-white" />
              </div>
            </div>
            <div class="p-4">
              <h3 class="text-white font-semibold truncate">{{ item.title }}</h3>
              <p class="text-gray-400 text-sm truncate">{{ item.artist }}</p>
              <p class="text-gray-500 text-xs truncate">{{ item.album }}</p>
            </div>
          </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 p-4">
          <div class="max-w-6xl mx-auto flex items-center gap-6">
            <div v-if="currentItem" class="flex items-center gap-4 flex-shrink-0">
              <img
                :src="currentItem.cover"
                :alt="currentItem.title"
                class="w-16 h-16 rounded-lg object-cover"
              />
              <div class="min-w-0">
                <h4 class="text-white font-medium truncate">{{ currentItem.title }}</h4>
                <p class="text-gray-400 text-sm">{{ currentItem.artist }}</p>
              </div>
            </div>

            <div class="flex-1 flex flex-col items-center gap-2">
              <div class="flex items-center gap-4">
                <button
                  @click="playPrev"
                  :disabled="!hasPrev"
                  class="p-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <SkipBack class="w-6 h-6" />
                </button>
                <button
                  @click="togglePlay"
                  class="p-4 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors"
                >
                  <span v-if="playLoading" class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <Pause v-else-if="isPlaying" class="w-8 h-8" />
                  <Play v-else class="w-8 h-8" />
                </button>
                <button
                  @click="playNext"
                  :disabled="!hasNext"
                  class="p-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <SkipForward class="w-6 h-6" />
                </button>
              </div>

              <div class="w-full max-w-md flex items-center gap-3">
                <span class="text-gray-400 text-sm">{{ formatTime((progress / 100) * duration) }}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="progress"
                  @input="setProgress"
                  class="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
                <span class="text-gray-400 text-sm">{{ formatTime(duration) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3 flex-shrink-0">
              <button
                @click="toggleMute"
                class="p-2 text-white hover:text-purple-400 transition-colors"
              >
                <VolumeX v-if="isMuted" class="w-6 h-6" />
                <Volume2 v-else class="w-6 h-6" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                :value="volume"
                @input="setVolume"
                class="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        <div class="h-32"></div>
      </div>
    </div>
  </div>
</template>
