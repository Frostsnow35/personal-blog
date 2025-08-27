<template>
  <div v-if="showMonitor" class="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg font-mono text-sm">
    <div class="space-y-1">
      <div class="flex items-center space-x-2">
        <span>FPS:</span>
        <span :class="fpsClass">{{ currentFPS }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <span>内存:</span>
        <span>{{ memoryUsage }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <span>帧时间:</span>
        <span :class="frameTimeClass">{{ frameTime }}ms</span>
      </div>
    </div>
    
    <!-- 性能警告 -->
    <div v-if="showWarning" class="mt-2 p-2 bg-yellow-600/80 rounded text-xs">
      ⚠️ 性能较低，建议关闭特效
    </div>
    
    <!-- 关闭按钮 -->
    <button 
      @click="showMonitor = false"
      class="absolute top-1 right-1 text-gray-400 hover:text-white text-xs"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const showMonitor = ref(false)
const currentFPS = ref(0)
const memoryUsage = ref('0 MB')
const frameTime = ref(0)
const showWarning = ref(false)

// 性能监控相关变量
let frameCount = 0
let lastTime = 0
let fpsUpdateInterval: number

// FPS 计算
const updateFPS = () => {
  const now = performance.now()
  frameCount++
  
  if (now - lastTime >= 1000) {
    currentFPS.value = frameCount
    frameCount = 0
    lastTime = now
    
    // 检查性能警告
    showWarning.value = currentFPS.value < 30
  }
  
  // 计算帧时间
  frameTime.value = Math.round((now - lastTime) / frameCount)
  
  requestAnimationFrame(updateFPS)
}

// 内存使用监控
const updateMemory = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    memoryUsage.value = `${usedMB} MB`
  }
}

// 样式类
const fpsClass = computed(() => {
  if (currentFPS.value >= 55) return 'text-green-400'
  if (currentFPS.value >= 30) return 'text-yellow-400'
  return 'text-red-400'
})

const frameTimeClass = computed(() => {
  if (frameTime.value <= 16) return 'text-green-400'
  if (frameTime.value <= 33) return 'text-yellow-400'
  return 'text-red-400'
})

onMounted(() => {
  // 启动FPS监控
  updateFPS()
  
  // 定期更新内存使用
  setInterval(updateMemory, 1000)
  
  // 默认隐藏，可通过快捷键或链接显示
  showMonitor.value = false
  
  // 添加快捷键支持
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      showMonitor.value = !showMonitor.value
    }
  })
  
  // 检查URL参数，如果包含showMonitor=true则显示
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('showMonitor') === 'true') {
    showMonitor.value = true
  }
  
  // 监听自定义事件来控制显示/隐藏
  const handleShowMonitor = () => {
    showMonitor.value = true
  }
  
  const handleHideMonitor = () => {
    showMonitor.value = false
  }
  
  window.addEventListener('showPerformanceMonitor', handleShowMonitor)
  window.addEventListener('hidePerformanceMonitor', handleHideMonitor)
  
  // 清理事件监听器
  onUnmounted(() => {
    window.removeEventListener('showPerformanceMonitor', handleShowMonitor)
    window.removeEventListener('hidePerformanceMonitor', handleHideMonitor)
  })
})

onUnmounted(() => {
  if (fpsUpdateInterval) {
    clearInterval(fpsUpdateInterval)
  }
})
</script>
