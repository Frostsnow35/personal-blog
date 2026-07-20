<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="romantic-bg">
      <div class="bg-blob bg-blob-1"></div>
      <div class="bg-blob bg-blob-2"></div>
      <div class="bg-blob bg-blob-3"></div>
      <div class="bg-blob bg-blob-4"></div>
      <div class="bg-blob bg-blob-5"></div>
      <div class="stars-container">
        <div v-for="i in 50" :key="i" class="star" :style="getStarStyle(i)"></div>
      </div>
    </div>
    
    <div class="relative z-10">
      <SiteNav />
      
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent mb-4 animate-title">
            ⏱️ 博客运行时间
          </h1>
          <p class="text-gray-600 dark:text-gray-300 text-lg md:text-xl">
            记录博客从第一篇文章发布至今的运行时长
          </p>
        </div>

        <div class="glass-card">
          <BlogUptime />
        </div>

        <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card stat-card-1" @click="createCardParticles($event)">
            <div class="stat-value">{{ stats.totalPosts }}</div>
            <div class="stat-label">已发布文章</div>
          </div>
          <div class="stat-card stat-card-2" @click="createCardParticles($event)">
            <div class="stat-value">{{ stats.totalDrafts }}</div>
            <div class="stat-label">草稿数量</div>
          </div>
          <div class="stat-card stat-card-3" @click="createCardParticles($event)">
            <div class="stat-value">{{ stats.totalComments }}</div>
            <div class="stat-label">审核通过留言</div>
          </div>
          <div class="stat-card stat-card-4" @click="createCardParticles($event)">
            <div class="stat-value">{{ stats.totalAlbums }}</div>
            <div class="stat-label">相册数量</div>
          </div>
        </div>

        <div class="mt-8 text-center">
          <p class="text-gray-500 dark:text-gray-400 text-sm animate-pulse-slow">
            🚀 感谢您的访问，期待与您一起见证博客的成长
          </p>
        </div>
      </div>
    </div>

    <div class="particles-container" ref="particlesRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SiteNav from '../components/SiteNav.vue'
import BlogUptime from '../components/BlogUptime.vue'
import { http } from '../utils/http'

const stats = ref({
  totalPosts: 0,
  totalDrafts: 0,
  totalComments: 0,
  totalAlbums: 0
})

const particlesRef = ref<HTMLElement | null>(null)

const getStarStyle = (index: number) => {
  const left = Math.random() * 100
  const top = Math.random() * 100
  const size = Math.random() * 3 + 1
  const delay = Math.random() * 3
  const duration = Math.random() * 2 + 2
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

const createCardParticles = (event: MouseEvent) => {
  if (!particlesRef.value) return
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const colors = ['#ff6b9d', '#c44dff', '#4da6ff', '#4dffc4', '#ffd94d']
  const particleCount = 12
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'card-particle'
    
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
    const velocity = 3 + Math.random() * 5
    const size = 4 + Math.random() * 8
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
    }, 800)
  }
}

const loadStats = async () => {
  try {
    const result = await http.get<any>('/blog/stats')
    if (result.success && result.data) {
      stats.value = {
        totalPosts: result.data.total_posts || 0,
        totalDrafts: result.data.total_drafts || 0,
        totalComments: result.data.total_comments || 0,
        totalAlbums: result.data.total_albums || 0
      }
    }
  } catch {
    console.error('加载博客统计失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.min-h-screen {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.romantic-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: blob-move 20s ease-in-out infinite;
}

.bg-blob-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.bg-blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #4da6ff, #4dffc4);
  top: 50%;
  right: -100px;
  animation-delay: -5s;
}

.bg-blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #ffd94d, #ff6b9d);
  bottom: -100px;
  left: 20%;
  animation-delay: -10s;
}

.bg-blob-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #c44dff, #4da6ff);
  top: 30%;
  left: 60%;
  animation-delay: -15s;
}

.bg-blob-5 {
  width: 280px;
  height: 280px;
  background: linear-gradient(135deg, #4dffc4, #ffd94d);
  bottom: 10%;
  right: 30%;
  animation-delay: -7s;
}

@keyframes blob-move {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, -50px) scale(1.1);
  }
  50% {
    transform: translate(-30px, 60px) scale(0.9);
  }
  75% {
    transform: translate(40px, 30px) scale(1.05);
  }
}

.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.stat-card-1 {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1));
  border-color: rgba(139, 92, 246, 0.3);
}

.stat-card-2 {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.1));
  border-color: rgba(245, 158, 11, 0.3);
}

.stat-card-3 {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.1));
  border-color: rgba(236, 72, 153, 0.3);
}

.stat-card-4 {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.1));
  border-color: rgba(16, 185, 129, 0.3);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8px;
  letter-spacing: 1px;
}

.animate-title {
  animation: title-float 3s ease-in-out infinite;
}

@keyframes title-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
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

.card-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: card-particle-burst 0.8s ease-out forwards;
  box-shadow: 0 0 8px currentColor;
}

@keyframes card-particle-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--vx), var(--vy)) scale(0);
  }
}
</style>