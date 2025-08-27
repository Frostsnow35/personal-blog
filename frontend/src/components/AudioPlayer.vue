<template>
  <div class="audio-player bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
    <!-- 音频信息 -->
    <div class="flex items-center space-x-3 mb-4">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {{ audioInfo.title || '未知标题' }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
          {{ audioInfo.artist || '未知艺术家' }}
        </p>
      </div>
    </div>

    <!-- 音频控制 -->
    <div class="space-y-4">
      <!-- 进度条 -->
      <div class="relative">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <input
          type="range"
          min="0"
          :max="duration"
          v-model="currentTime"
          @input="onSeek"
          class="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />
      </div>

      <!-- 控制按钮 -->
      <div class="flex items-center justify-center space-x-4">
        <button
          @click="previousTrack"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          :disabled="!hasPrevious"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          @click="togglePlay"
          class="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          <svg v-if="!isPlaying" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          @click="nextTrack"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          :disabled="!hasNext"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- 音量控制 -->
      <div class="flex items-center space-x-3">
        <button @click="toggleMute" class="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
          <svg v-if="isMuted || volume === 0" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.343 6.343a1 1 0 000 1.414l4.243 4.243a1 1 0 001.414 0l4.243-4.243a1 1 0 000-1.414L12 2.343 6.343 8zM15 10l4 4m0-4l-4 4" />
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.343 6.343a1 1 0 000 1.414l4.243 4.243a1 1 0 001.414 0l4.243-4.243a1 1 0 000-1.414L12 2.343 6.343 8z" />
          </svg>
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="volume"
          @input="onVolumeChange"
          class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span class="text-sm text-gray-500 w-12">{{ Math.round(volume * 100) }}%</span>
      </div>
    </div>

    <!-- 播放列表 -->
    <div v-if="playlist && playlist.length > 0" class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">播放列表</h4>
      <div class="space-y-1 max-h-32 overflow-y-auto">
        <div
          v-for="(track, index) in playlist"
          :key="index"
          @click="playTrack(index)"
          class="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'bg-blue-100 dark:bg-blue-900/30': currentTrackIndex === index }"
        >
          <span class="text-xs text-gray-500 w-6">{{ index + 1 }}</span>
          <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ track.title }}</span>
          <span class="text-xs text-gray-500">{{ formatDuration(track.duration) }}</span>
        </div>
      </div>
    </div>

    <!-- 隐藏的音频元素 -->
    <audio
      ref="audioElement"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @error="onError"
      preload="metadata"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface AudioTrack {
  src: string
  title: string
  artist?: string
  duration?: number
  cover?: string
}

interface AudioInfo {
  title: string
  artist?: string
  cover?: string
}

const props = defineProps<{
  playlist?: AudioTrack[]
  autoplay?: boolean
  loop?: boolean
}>()

const emit = defineEmits<{
  play: [track: AudioTrack]
  pause: []
  ended: []
  error: [error: string]
}>()

// 响应式数据
const audioElement = ref<HTMLAudioElement>()
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(parseFloat(localStorage.getItem('ap_volume') || '0.7'))
const isMuted = ref(localStorage.getItem('ap_muted') === '1')
const currentTrackIndex = ref(0)

// 计算属性
const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const hasPrevious = computed(() => currentTrackIndex.value > 0)
const hasNext = computed(() => currentTrackIndex.value < (props.playlist?.length || 0) - 1)

const audioInfo = computed<AudioInfo>(() => {
  const currentTrack = props.playlist?.[currentTrackIndex.value]
  return {
    title: currentTrack?.title || '未知标题',
    artist: currentTrack?.artist || '未知艺术家',
    cover: currentTrack?.cover
  }
})

// 方法
const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }
}

const playTrack = (index: number) => {
  if (!props.playlist || index < 0 || index >= props.playlist.length) return
  
  currentTrackIndex.value = index
  const track = props.playlist[index]
  
  if (audioElement.value) {
    audioElement.value.src = track.src
    audioElement.value.play()
    emit('play', track)
  }
}

const previousTrack = () => {
  if (hasPrevious.value) {
    playTrack(currentTrackIndex.value - 1)
  }
}

const nextTrack = () => {
  if (hasNext.value) {
    playTrack(currentTrackIndex.value + 1)
  } else if (props.loop) {
    playTrack(0)
  }
}

const onSeek = () => {
  if (audioElement.value) {
    audioElement.value.currentTime = currentTime.value
  }
}

const onVolumeChange = () => {
  if (audioElement.value) {
    audioElement.value.volume = isMuted.value ? 0 : volume.value
  }
  localStorage.setItem('ap_volume', String(volume.value))
  localStorage.setItem('ap_muted', isMuted.value ? '1' : '0')
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  onVolumeChange()
}

const onLoadedMetadata = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration || 0
  }
}

const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const onEnded = () => {
  isPlaying.value = false
  emit('ended')
  
  if (hasNext.value) {
    nextTrack()
  }
}

const onError = (event: Event) => {
  const error = event.target as HTMLAudioElement
  emit('error', error.error?.message || '播放出错')
}

const formatTime = (time: number): string => {
  if (isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatDuration = (duration?: number): string => {
  if (!duration) return '0:00'
  return formatTime(duration)
}

// 生命周期
onMounted(() => {
  if (audioElement.value) {
    audioElement.value.volume = isMuted.value ? 0 : volume.value
  }
  
  // 如果有播放列表，加载第一首
  if (props.playlist && props.playlist.length > 0) {
    playTrack(0)
  }
  
  // 自动播放
  if (props.autoplay && audioElement.value) {
    audioElement.value.play()
  }
})

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
  }
})

// 监听播放状态变化
watch(isPlaying, (playing) => {
  if (playing) {
    emit('play', props.playlist?.[currentTrackIndex.value] || {} as AudioTrack)
  } else {
    emit('pause')
  }
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 音量滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>
