<template>
  <div class="blog-uptime">
    <div class="fluid-bg"></div>
    <div class="particles-container" ref="particlesRef"></div>
    
    <div class="uptime-header">
      <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <svg class="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        博客已运行
      </h3>
    </div>
    
    <div class="uptime-display">
      <div 
        class="time-item" 
        @click="createParticles($event, 'years')"
      >
        <div class="time-value heart-beat" :style="{ '--beat-delay': '0s' }">
          <span class="digit-glow">{{ displayYears }}</span>
        </div>
        <div class="time-label">年</div>
      </div>
      <div class="time-separator">:</div>
      <div 
        class="time-item" 
        @click="createParticles($event, 'months')"
      >
        <div class="time-value heart-beat" :style="{ '--beat-delay': '0.1s' }">
          <span class="digit-glow">{{ displayMonths }}</span>
        </div>
        <div class="time-label">月</div>
      </div>
      <div class="time-separator">:</div>
      <div 
        class="time-item" 
        @click="createParticles($event, 'days')"
      >
        <div class="time-value heart-beat" :style="{ '--beat-delay': '0.2s' }">
          <span class="digit-glow">{{ displayDays }}</span>
        </div>
        <div class="time-label">天</div>
      </div>
      <div class="time-separator">:</div>
      <div 
        class="time-item" 
        @click="createParticles($event, 'hours')"
      >
        <div class="time-value heart-beat" :style="{ '--beat-delay': '0.3s' }">
          <span class="digit-glow">{{ displayHours }}</span>
        </div>
        <div class="time-label">时</div>
      </div>
      <div class="time-separator">:</div>
      <div 
        class="time-item" 
        @click="createParticles($event, 'minutes')"
      >
        <div class="time-value heart-beat" :style="{ '--beat-delay': '0.4s' }">
          <span class="digit-glow">{{ displayMinutes }}</span>
        </div>
        <div class="time-label">分</div>
      </div>
      <div class="time-separator">:</div>
      <div 
        class="time-item" 
        @click="createParticles($event, 'seconds')"
      >
        <div class="time-value heart-beat seconds" :style="{ '--beat-delay': '0.5s' }">
          <span class="digit-glow">{{ displaySeconds }}</span>
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
const particlesRef = ref<HTMLElement | null>(null)

let updateTimer: ReturnType<typeof setInterval> | null = null

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

const createParticles = (event: MouseEvent, type: string) => {
  if (!particlesRef.value) return
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const colors = ['#ff6b9d', '#c44dff', '#4da6ff', '#4dffc4', '#ffd94d']
  const particleCount = 15
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
    const velocity = 2 + Math.random() * 4
    const size = 6 + Math.random() * 10
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    particle.style.left = `${centerX}px`
    particle.style.top = `${centerY}px`
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    particle.style.background = color
    particle.style.setProperty('--vx', `${Math.cos(angle) * velocity}px`)
    particle.style.setProperty('--vy', `${Math.sin(angle) * velocity}px`)
    
    particlesRef.value.appendChild(particle)
    
    setTimeout(() => {
      particle.remove()
    }, 1000)
  }
}

const updateTime = () => {
  currentTime.value = new Date()
}

onMounted(async () => {
  await loadStats()
  updateTime()
  updateTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (updateTimer) clearInterval(updateTimer)
})
</script>

<style scoped>
.blog-uptime {
  position: relative;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(20px);
  min-height: 200px;
}

.fluid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.15) 0%, 
    rgba(59, 130, 246, 0.15) 25%,
    rgba(6, 182, 212, 0.15) 50%,
    rgba(16, 185, 129, 0.15) 75%,
    rgba(245, 158, 11, 0.15) 100%
  );
  background-size: 400% 400%;
  animation: fluid-flow 15s ease infinite;
  z-index: 0;
}

@keyframes fluid-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: particle-burst 1s ease-out forwards;
  box-shadow: 0 0 10px currentColor;
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--vx), var(--vy)) scale(0);
  }
}

.uptime-header {
  position: relative;
  z-index: 1;
  margin-bottom: 24px;
}

.uptime-display {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.time-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.time-item:hover {
  transform: translateY(-4px);
}

.time-value {
  font-size: 2.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  min-width: 56px;
  position: relative;
}

.time-value .digit-glow {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  display: inline-block;
}

.time-value.seconds .digit-glow {
  background: linear-gradient(135deg, #ec4899, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
}

.time-value.heart-beat {
  animation: heart-beat 2s ease-in-out infinite;
  animation-delay: var(--beat-delay, 0s);
}

@keyframes heart-beat {
  0%, 100% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.05);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.08);
  }
  70% {
    transform: scale(1);
  }
}

.time-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 8px;
  font-weight: 500;
  letter-spacing: 1px;
}

.dark .time-label {
  color: #9ca3af;
}

.time-separator {
  font-size: 2rem;
  font-weight: 200;
  color: #8b5cf6;
  margin-top: -12px;
  animation: blink 1.5s ease-in-out infinite;
  opacity: 0.6;
}

.dark .time-separator {
  color: #a78bfa;
}

@keyframes blink {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.uptime-footer {
  position: relative;
  z-index: 1;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

@media (max-width: 640px) {
  .time-value {
    font-size: 1.5rem;
    min-width: 36px;
  }
  
  .time-separator {
    font-size: 1.25rem;
  }
  
  .blog-uptime {
    padding: 20px;
  }
  
  .uptime-display {
    gap: 8px;
  }
}
</style>