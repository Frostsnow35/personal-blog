<template>
  <div class="flex items-center gap-3">
    <div 
      class="w-28 h-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center cursor-pointer select-none border border-gray-200 dark:border-gray-700"
      @click="refresh"
    >
      <span class="text-lg font-bold tracking-wider" :style="{ color: textColor }">{{ captcha }}</span>
    </div>
    <button 
      type="button" 
      class="text-sm text-gray-500 hover:text-ocean-500 dark:text-gray-400 dark:hover:text-ocean-400 transition-colors"
      @click="refresh"
    >
      刷新
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const captcha = ref('')
const textColor = ref('#333')

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const COLORS = ['#333333', '#666666', '#999999', '#3498db', '#e74c3c', '#2ecc71', '#9b59b6']

function generateCaptcha(): string {
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return result
}

function refresh() {
  captcha.value = generateCaptcha()
  textColor.value = COLORS[Math.floor(Math.random() * COLORS.length)]
}

onMounted(() => {
  refresh()
})

const validateCaptcha = (input: string): boolean => {
  return input.toLowerCase() === captcha.value.toLowerCase()
}

defineExpose({ captcha, validateCaptcha, refresh })
</script>
