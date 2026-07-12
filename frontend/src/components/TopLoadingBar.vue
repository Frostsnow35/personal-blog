<template>
  <Teleport to="body">
    <div
      v-show="visible"
      class="top-progress"
      :style="{ width: width + '%', opacity: visible ? 1 : 0 }"
      role="progressbar"
      :aria-valuenow="width"
      aria-valuemin="0"
      aria-valuemax="100"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { loadingManager } from '../utils/loadingManager'

const width = ref(0)
const visible = ref(false)
let timer: number | null = null
let hideTimer: number | null = null

function start() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  visible.value = true
  width.value = 20
  if (!timer) {
    timer = window.setInterval(() => {
      if (width.value < 90) {
        // 渐进式增长，递减步长模拟不确定加载
        const step = (90 - width.value) * 0.15 + 2
        width.value = Math.min(90, width.value + step)
      }
    }, 200)
  }
}

function finish() {
  if (timer) { clearInterval(timer); timer = null }
  width.value = 100
  hideTimer = window.setTimeout(() => {
    visible.value = false
    setTimeout(() => { width.value = 0 }, 300)
  }, 250) as unknown as number
}

const listener = (_key: string, loading: boolean) => {
  if (loading) start()
  else finish()
}
loadingManager.addListener(listener)

onUnmounted(() => {
  loadingManager.removeListener(listener)
  if (timer) clearInterval(timer)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>
