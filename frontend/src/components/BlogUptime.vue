<template>
  <div class="blog-uptime">
    <div class="uptime-header">
      <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <svg class="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        博客已运行
      </h3>
    </div>
    
    <div class="uptime-display">
      <div class="time-item">
        <div class="time-value" :class="{ 'animate-pulse': isAnimating }">
          <span ref="yearsRef" class="digit">{{ displayYears }}</span>
        </div>
        <div class="time-label">年</div>
      </div>
      <div class="time-separator">:</div>
      <div class="time-item">
        <div class="time-value" :class="{ 'animate-pulse': isAnimating }">
          <span ref="monthsRef" class="digit">{{ displayMonths }}</span>
        </div>
        <div class="time-label">月</div>
      </div>
      <div class="time-separator">:</div>
      <div class="time-item">
        <div class="time-value" :class="{ 'animate-pulse': isAnimating }">
          <span ref="daysRef" class="digit">{{ displayDays }}</span>
        </div>
        <div class="time-label">天</div>
      </div>
      <div class="time-separator">:</div>
      <div class="time-item">
        <div class="time-value" :class="{ 'animate-pulse': isAnimating }">
          <span ref="hoursRef" class="digit">{{ displayHours }}</span>
        </div>
        <div class="time-label">时</div>
      </div>
      <div class="time-separator">:</div>
      <div class="time-item">
        <div class="time-value" :class="{ 'animate-pulse': isAnimating }">
          <span ref="minutesRef" class="digit">{{ displayMinutes }}</span>
        </div>
        <div class="time-label">分</div>
      </div>
      <div class="time-separator">:</div>
      <div class="time-item">
        <div class="time-value seconds" :class="{ 'animate-pulse': isAnimating }">
          <span ref="secondsRef" class="digit">{{ displaySeconds }}</span>
        </div>
        <div class="time-label">秒</div>
      </div>
    </div>
    
    <div class="uptime-footer">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        自 {{ formatStartDate }} 起
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { http } from '../utils/http'

const startDate = ref<Date | null>(null)
const currentTime = ref(new Date())
const isAnimating = ref(false)

let updateTimer: ReturnType<typeof setInterval> | null = null
let animationTimer: ReturnType<typeof setTimeout> | null = null

const loadStats = async () => {
  try {
    const result = await http.get<any>('/blog/stats')
    if (result.success && result.data?.start_date) {
      startDate.value = new Date(result.data.start_date)
    }
  } catch {
    startDate.value = new Date('2024-01-01')
  }
}

const timeDiff = computed(() => {
  if (!startDate.value) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  
  const start = startDate.value
  const now = currentTime.value
  
  const years = now.getFullYear() - start.getFullYear()
  const months = now.getMonth() - start.getMonth()
  const days = now.getDate() - start.getDate()
  const hours = now.getHours() - start.getHours()
  const minutes = now.getMinutes() - start.getMinutes()
  const seconds = now.getSeconds() - start.getSeconds()
  
  let totalYears = years
  let totalMonths = months
  let totalDays = days
  let totalHours = hours
  let totalMinutes = minutes
  let totalSeconds = seconds
  
  if (totalSeconds < 0) {
    totalSeconds += 60
    totalMinutes--
  }
  if (totalMinutes < 0) {
    totalMinutes += 60
    totalHours--
  }
  if (totalHours < 0) {
    totalHours += 24
    totalDays--
  }
  if (totalDays < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    totalDays += prevMonth.getDate()
    totalMonths--
  }
  if (totalMonths < 0) {
    totalMonths += 12
    totalYears--
  }
  
  return {
    years: Math.max(0, totalYears),
    months: Math.max(0, totalMonths),
    days: Math.max(0, totalDays),
    hours: Math.max(0, totalHours),
    minutes: Math.max(0, totalMinutes),
    seconds: Math.max(0, totalSeconds)
  }
})

const formatNumber = (num: number): string => {
  return num.toString().padStart(2, '0')
}

const displayYears = computed(() => formatNumber(timeDiff.value.years))
const displayMonths = computed(() => formatNumber(timeDiff.value.months))
const displayDays = computed(() => formatNumber(timeDiff.value.days))
const displayHours = computed(() => formatNumber(timeDiff.value.hours))
const displayMinutes = computed(() => formatNumber(timeDiff.value.minutes))
const displaySeconds = computed(() => formatNumber(timeDiff.value.seconds))

const formatStartDate = computed(() => {
  if (!startDate.value) return '未知日期'
  return startDate.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const updateTime = () => {
  currentTime.value = new Date()
  isAnimating.value = true
  if (animationTimer) clearTimeout(animationTimer)
  animationTimer = setTimeout(() => {
    isAnimating.value = false
  }, 200)
}

onMounted(async () => {
  await loadStats()
  updateTime()
  updateTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (updateTimer) clearInterval(updateTimer)
  if (animationTimer) clearTimeout(animationTimer)
})
</script>

<style scoped>
.blog-uptime {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1));
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(10px);
}

.uptime-header {
  margin-bottom: 20px;
}

.uptime-display {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.time-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-value {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  transition: transform 0.2s ease;
}

.time-value.seconds {
  background: linear-gradient(135deg, #ef4444, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: pulse-glow 1s ease-in-out infinite;
}

.time-value:hover {
  transform: scale(1.1);
}

.time-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.dark .time-label {
  color: #9ca3af;
}

.time-separator {
  font-size: 1.5rem;
  font-weight: 300;
  color: #9ca3af;
  margin-top: -8px;
  animation: blink 1s ease-in-out infinite;
}

.dark .time-separator {
  color: #6b7280;
}

.uptime-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.animate-pulse {
  animation: number-pulse 0.2s ease;
}

@keyframes number-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .time-value {
    font-size: 1.25rem;
    min-width: 32px;
  }
  
  .time-separator {
    font-size: 1rem;
  }
  
  .blog-uptime {
    padding: 16px;
  }
}
</style>