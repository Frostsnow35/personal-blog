<template>
  <div class="fixed bottom-6 left-6 z-50 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
    <div class="flex items-center space-x-4">
      <!-- 播放/暂停按钮 -->
      <button
        @click="togglePlay"
        class="w-10 h-10 rounded-full bg-ocean-600 hover:bg-ocean-700 text-white flex items-center justify-center transition-all duration-300"
      >
        <svg
          v-if="!isPlaying"
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        <svg
          v-else
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- 歌曲信息 -->
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {{ currentSong.title }}
        </p>
        <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
          {{ currentSong.artist }}
        </p>
      </div>
      
      <!-- 进度条 -->
      <div class="w-40 relative select-none">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            class="bg-ocean-600 h-1 rounded-full transition-all duration-150"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <input
          type="range"
          min="0"
          :max="duration || 0"
          step="0.1"
          v-model="currentTime"
          @input="onSeekInput"
          class="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />
      </div>
      
      <!-- 音量控制 -->
      <div class="flex items-center space-x-2">
        <button @click="toggleMute" class="p-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <svg v-if="isMuted || volume === 0" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
            <path d="M12 6a6 6 0 010 8" />
          </svg>
        </button>
        <input
          v-model="volume"
          @input="onVolumeInput"
          type="range"
          min="0"
          max="100"
          class="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Song {
  id: number
  title: string
  artist: string
  url: string
  duration: number
}

const playlist: Song[] = [
  {
    id: 1,
    title: "eikyuu hours",
    artist: "",
    url: '/audio/music/eikyuu%20hours.mp3',
    duration: 0
  }
]

const currentSongIndex = ref(0)
const isPlaying = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const volume = ref(Number(localStorage.getItem('mp_volume') || 50))
const isMuted = ref(localStorage.getItem('mp_muted') === '1')
const audio = ref<HTMLAudioElement>()

const currentSong = computed(() => playlist[currentSongIndex.value])
const progressPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
})

const togglePlay = () => {
  if (!audio.value) return
  
  // 若未配置有效地址则忽略（不弹窗打断）
  if (!currentSong.value.url || currentSong.value.url === '#') {
    return
  }
  
  if (isPlaying.value) {
    audio.value.pause()
  } else {
    audio.value.play().catch(() => {
      // 静默处理播放错误
    })
  }
  isPlaying.value = !isPlaying.value
}

const nextSong = () => {
  currentSongIndex.value = (currentSongIndex.value + 1) % playlist.length
  loadSong()
}

const prevSong = () => {
  currentSongIndex.value = currentSongIndex.value === 0 ? playlist.length - 1 : currentSongIndex.value - 1
  loadSong()
}

const loadSong = () => {
  if (!audio.value) return
  
  audio.value.src = currentSong.value.url
  if (isPlaying.value) {
    audio.value.play()
  }
}

const onTimeUpdate = () => {
  if (!audio.value) return
  currentTime.value = audio.value.currentTime || 0
  duration.value = isFinite(audio.value.duration) ? audio.value.duration : 0
}

const applyVolume = () => {
  if (!audio.value) return
  const vol = isMuted.value ? 0 : volume.value / 100
  audio.value.volume = vol
}

const onSeekInput = () => {
  if (!audio.value) return
  audio.value.currentTime = currentTime.value
}

const onVolumeInput = () => {
  isMuted.value = Number(volume.value) === 0
  localStorage.setItem('mp_volume', String(volume.value))
  localStorage.setItem('mp_muted', isMuted.value ? '1' : '0')
  applyVolume()
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  localStorage.setItem('mp_muted', isMuted.value ? '1' : '0')
  applyVolume()
}

onMounted(() => {
  audio.value = new Audio()
  audio.value.addEventListener('timeupdate', onTimeUpdate)
  audio.value.addEventListener('ended', nextSong)
  audio.value.addEventListener('loadedmetadata', onTimeUpdate)
  
  applyVolume()
  loadSong()
})

onUnmounted(() => {
  if (audio.value) {
    audio.value.removeEventListener('timeupdate', onTimeUpdate)
    audio.value.removeEventListener('ended', nextSong)
    audio.value.removeEventListener('loadedmetadata', onTimeUpdate)
    audio.value.pause()
  }
})
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #0ea5e9;
  cursor: pointer;
  border: none;
}
</style>
