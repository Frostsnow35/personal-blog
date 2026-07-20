<template>
  <div class="starry-night-page">
    <!-- 梵高星月夜油画 Canvas 背景 -->
    <canvas ref="canvasRef" class="oil-canvas"></canvas>

    <!-- 低端设备降级背景 -->
    <div v-if="isLowEnd" class="fallback-bg"></div>

    <!-- 星光层（Canvas 之上，增强呼吸感） -->
    <div class="stars-layer">
      <div
        v-for="star in stars"
        :key="star.id"
        class="star-dot"
        :style="{
          left: star.left + '%',
          top: star.top + '%',
          width: star.size + 'px',
          height: star.size + 'px',
          animationDelay: star.delay + 's',
          animationDuration: star.duration + 's'
        }"
      ></div>
    </div>

    <!-- 导航栏（保留，透明融合） -->
    <SiteNav class="starry-nav" />

    <!-- 主内容 -->
    <div class="content-layer">
      <!-- 主标题 -->
      <header class="title-block">
        <h1 class="main-title">博客运行时间</h1>
        <p class="subtitle">记录博客运行的每一刻</p>
      </header>

      <!-- 计时器 -->
      <div class="timer-block">
        <div class="timer-row">
          <div class="time-unit">
            <span class="time-value">{{ displayYears }}</span>
            <span class="time-label">年</span>
          </div>
          <span class="separator">:</span>
          <div class="time-unit">
            <span class="time-value">{{ displayMonths }}</span>
            <span class="time-label">月</span>
          </div>
          <span class="separator">:</span>
          <div class="time-unit">
            <span class="time-value">{{ displayDays }}</span>
            <span class="time-label">天</span>
          </div>
          <span class="separator">:</span>
          <div class="time-unit">
            <span class="time-value">{{ displayHours }}</span>
            <span class="time-label">时</span>
          </div>
          <span class="separator">:</span>
          <div class="time-unit">
            <span class="time-value">{{ displayMinutes }}</span>
            <span class="time-label">分</span>
          </div>
          <span class="separator">:</span>
          <div class="time-unit">
            <span class="time-value">{{ displaySeconds }}</span>
            <span class="time-label">秒</span>
          </div>
        </div>

        <p class="start-time">自 2026 年 7 月 12 日起</p>
      </div>

      <!-- 底部收尾 -->
      <footer class="footer-text">
        即使身处阴沟，也别忘了仰望星空
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import SiteNav from '../components/SiteNav.vue'

// 起始时间硬编码（2026年7月12日0点）
const START_DATE = new Date('2026-07-12T00:00:00')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentTime = ref(new Date())

// 低端设备检测
const isLowEnd = ref(false)

// 星光数据
const stars = ref<Array<{
  id: number
  left: number
  top: number
  size: number
  delay: number
  duration: number
}>>([])

// Canvas 相关
let ctx: CanvasRenderingContext2D | null = null
let animationId: number | null = null
let strokes: Stroke[] = []
let mouseX = -1000
let mouseY = -1000
let lastFrameTime = 0
const FRAME_INTERVAL = 1000 / 30 // 30fps

// 笔触接口
interface Stroke {
  x: number
  y: number
  baseX: number
  baseY: number
  length: number
  angle: number
  baseAngle: number
  curvature: number
  color: string
  width: number
  alpha: number
  layer: number
  phase: number
  speed: number
}

// 时间差计算
const timeDiff = computed(() => {
  const start = START_DATE
  const now = currentTime.value

  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  let days = now.getDate() - start.getDate()
  let hours = now.getHours() - start.getHours()
  let minutes = now.getMinutes() - start.getMinutes()
  let seconds = now.getSeconds() - start.getSeconds()

  if (seconds < 0) { seconds += 60; minutes-- }
  if (minutes < 0) { minutes += 60; hours-- }
  if (hours < 0) { hours += 24; days-- }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
    months--
  }
  if (months < 0) { months += 12; years-- }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds)
  }
})

const pad = (n: number) => n.toString().padStart(2, '0')
const displayYears = computed(() => pad(timeDiff.value.years))
const displayMonths = computed(() => pad(timeDiff.value.months))
const displayDays = computed(() => pad(timeDiff.value.days))
const displayHours = computed(() => pad(timeDiff.value.hours))
const displayMinutes = computed(() => pad(timeDiff.value.minutes))
const displaySeconds = computed(() => pad(timeDiff.value.seconds))

// 生成星光
const generateStars = () => {
  const arr = []
  for (let i = 0; i < 80; i++) {
    arr.push({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2
    })
  }
  stars.value = arr
}

// 生成笔触
const generateStrokes = (width: number, height: number) => {
  strokes = []
  const colors = {
    deepBlue: '#1a3a6c',
    cobalt: '#2d5aa0',
    violet: '#5d3f9e',
    deepViolet: '#3d2b6e',
    gold: '#f4c430',
    warmWhite: '#f5e6b8',
    indigo: '#1b1f3a'
  }

  // 底层：大块漩涡（20条）
  for (let i = 0; i < 20; i++) {
    strokes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: 0,
      baseY: 0,
      length: 80 + Math.random() * 120,
      angle: Math.random() * Math.PI * 2,
      baseAngle: Math.random() * Math.PI * 2,
      curvature: 0.3 + Math.random() * 0.4,
      color: Math.random() > 0.5 ? colors.deepBlue : colors.indigo,
      width: 12 + Math.random() * 10,
      alpha: 0.15 + Math.random() * 0.1,
      layer: 0,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0005 + Math.random() * 0.0008
    })
  }

  // 中层：漩涡曲线（25条）
  for (let i = 0; i < 25; i++) {
    const c = [colors.cobalt, colors.violet, colors.deepViolet][Math.floor(Math.random() * 3)]
    strokes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: 0,
      baseY: 0,
      length: 60 + Math.random() * 100,
      angle: Math.random() * Math.PI * 2,
      baseAngle: Math.random() * Math.PI * 2,
      curvature: 0.4 + Math.random() * 0.5,
      color: c,
      width: 6 + Math.random() * 8,
      alpha: 0.2 + Math.random() * 0.15,
      layer: 1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0008 + Math.random() * 0.0012
    })
  }

  // 顶层：暖金星光笔触（15条）
  for (let i = 0; i < 15; i++) {
    strokes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: 0,
      baseY: 0,
      length: 30 + Math.random() * 50,
      angle: Math.random() * Math.PI * 2,
      baseAngle: Math.random() * Math.PI * 2,
      curvature: 0.2 + Math.random() * 0.3,
      color: Math.random() > 0.4 ? colors.gold : colors.warmWhite,
      width: 4 + Math.random() * 6,
      alpha: 0.3 + Math.random() * 0.2,
      layer: 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.001 + Math.random() * 0.0015
    })
  }

  // 记录基准位置
  strokes.forEach(s => {
    s.baseX = s.x
    s.baseY = s.y
  })
}

// 绘制单条笔触（厚涂油画感）
const drawStroke = (stroke: Stroke, time: number) => {
  if (!ctx) return

  // 缓慢漂移
  const driftX = Math.sin(time * stroke.speed + stroke.phase) * 15
  const driftY = Math.cos(time * stroke.speed * 0.8 + stroke.phase) * 15

  // 鼠标影响（150px 范围内笔触偏转加速）
  let mouseInfluenceX = 0
  let mouseInfluenceY = 0
  const dx = mouseX - stroke.x
  const dy = mouseY - stroke.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 150) {
    const force = (1 - dist / 150) * 20
    mouseInfluenceX = (dx / dist) * force * -0.3
    mouseInfluenceY = (dy / dist) * force * -0.3
  }

  const x = stroke.baseX + driftX + mouseInfluenceX
  const y = stroke.baseY + driftY + mouseInfluenceY

  // 角度缓慢旋转
  const angle = stroke.baseAngle + Math.sin(time * stroke.speed * 0.5 + stroke.phase) * 0.3

  ctx.save()
  ctx.globalAlpha = stroke.alpha
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 厚涂模糊质感
  ctx.filter = 'blur(1.5px)'

  // 绘制弯曲笔触（二次贝塞尔模拟漩涡）
  const endX = x + Math.cos(angle) * stroke.length
  const endY = y + Math.sin(angle) * stroke.length
  const ctrlAngle = angle + stroke.curvature
  const ctrlX = x + Math.cos(ctrlAngle) * stroke.length * 0.5
  const ctrlY = y + Math.sin(ctrlAngle) * stroke.length * 0.5

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY)
  ctx.stroke()

  // 顶层星光额外加发光
  if (stroke.layer === 2) {
    ctx.globalAlpha = stroke.alpha * 0.5
    ctx.shadowColor = stroke.color
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY)
    ctx.stroke()
  }

  ctx.restore()
}

// 动画主循环
const animate = (timestamp: number) => {
  if (!ctx || !canvasRef.value) return

  // 帧率限制
  if (timestamp - lastFrameTime < FRAME_INTERVAL) {
    animationId = requestAnimationFrame(animate)
    return
  }
  lastFrameTime = timestamp

  const canvas = canvasRef.value
  const time = timestamp

  // 清空 + 绘制底色渐变（每帧重绘背景）
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.2
  )
  gradient.addColorStop(0, '#1b1f3a')
  gradient.addColorStop(0.5, '#0f1530')
  gradient.addColorStop(1, '#0a0d1f')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 按层绘制笔触
  strokes
    .slice()
    .sort((a, b) => a.layer - b.layer)
    .forEach(stroke => drawStroke(stroke, time))

  animationId = requestAnimationFrame(animate)
}

// 调整 Canvas 尺寸
const resizeCanvas = () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  generateStrokes(canvas.width, canvas.height)
}

// 鼠标交互
const onMouseMove = (e: MouseEvent) => {
  mouseX = e.clientX
  mouseY = e.clientY
}

const onMouseLeave = () => {
  mouseX = -1000
  mouseY = -1000
}

// 可见性检测（页面隐藏时暂停）
const onVisibilityChange = () => {
  if (document.hidden) {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  } else {
    if (!animationId && ctx) {
      lastFrameTime = 0
      animationId = requestAnimationFrame(animate)
    }
  }
}

// 时间更新
let timeTimer: number | null = null

onMounted(async () => {
  // 低端设备检测
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
    ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) ||
    prefersReducedMotion
  isLowEnd.value = !!lowEnd

  // 生成星光
  generateStars()

  // 时间更新
  timeTimer = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  await nextTick()

  // 低端设备不启动 Canvas
  if (isLowEnd.value) return

  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      resizeCanvas()
      window.addEventListener('resize', resizeCanvas)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseleave', onMouseLeave)
      document.addEventListener('visibilitychange', onVisibilityChange)
      animationId = requestAnimationFrame(animate)
    }
  }
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (timeTimer) clearInterval(timeTimer)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.starry-night-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #0a0d1f;
}

.oil-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

/* 低端设备降级背景 */
.fallback-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background: radial-gradient(ellipse at center, #1b1f3a 0%, #0f1530 50%, #0a0d1f 100%);
}

/* 星光层 */
.stars-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
}

.star-dot {
  position: absolute;
  background: #f5e6b8;
  border-radius: 50%;
  box-shadow: 0 0 4px #f4c430, 0 0 8px rgba(244, 196, 48, 0.4);
  animation: star-twinkle ease-in-out infinite;
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

/* 导航栏透明融合 */
.starry-nav {
  position: relative;
  z-index: 10;
  background: transparent !important;
  border-bottom: none !important;
}

.starry-nav :deep(nav) {
  background: transparent !important;
  border-bottom: none !important;
  backdrop-filter: none !important;
}

.starry-nav :deep(a),
.starry-nav :deep(button) {
  color: #f5e6b8 !important;
  text-shadow: 0 0 8px rgba(10, 13, 31, 0.8);
}

.starry-nav :deep(a:hover),
.starry-nav :deep(button:hover) {
  color: #f4c430 !important;
}

.starry-nav :deep(.text-gradient) {
  background: linear-gradient(135deg, #f4c430, #f5e6b8) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

/* 主内容层 */
.content-layer {
  position: relative;
  z-index: 5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 1.5rem 3rem;
  text-align: center;
}

/* 标题区 */
.title-block {
  margin-bottom: 4rem;
}

.main-title {
  font-family: 'Georgia', 'Songti SC', 'STSong', serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 300;
  color: #f4c430;
  letter-spacing: 0.15em;
  margin: 0 0 1rem;
  text-shadow: 0 0 20px rgba(244, 196, 48, 0.4), 0 0 40px rgba(244, 196, 48, 0.2);
  animation: title-glow 4s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% {
    text-shadow: 0 0 20px rgba(244, 196, 48, 0.4), 0 0 40px rgba(244, 196, 48, 0.2);
  }
  50% {
    text-shadow: 0 0 30px rgba(244, 196, 48, 0.6), 0 0 60px rgba(244, 196, 48, 0.3);
  }
}

.subtitle {
  font-family: 'Georgia', 'Songti SC', serif;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  color: rgba(245, 230, 184, 0.6);
  letter-spacing: 0.3em;
  margin: 0;
  font-weight: 300;
}

/* 计时器 */
.timer-block {
  margin-bottom: 4rem;
}

.timer-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.5rem;
}

.time-value {
  font-family: 'Georgia', serif;
  font-size: clamp(2rem, 6vw, 4.5rem);
  font-weight: 400;
  color: #f4c430;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 15px rgba(244, 196, 48, 0.6), 0 0 30px rgba(244, 196, 48, 0.3);
  line-height: 1;
  transition: text-shadow 0.3s ease;
}

.time-label {
  font-family: 'Georgia', 'Songti SC', serif;
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  color: rgba(245, 230, 184, 0.5);
  margin-top: 0.5rem;
  letter-spacing: 0.2em;
  font-weight: 300;
}

.separator {
  font-family: 'Georgia', serif;
  font-size: clamp(2rem, 6vw, 4.5rem);
  color: #5d3f9e;
  font-weight: 200;
  line-height: 1;
  animation: separator-pulse 2s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(93, 63, 158, 0.6);
  align-self: flex-start;
}

@keyframes separator-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.9;
  }
}

.start-time {
  font-family: 'Georgia', 'Songti SC', serif;
  font-size: clamp(0.75rem, 1.5vw, 0.9rem);
  color: rgba(245, 230, 184, 0.4);
  margin-top: 2.5rem;
  letter-spacing: 0.25em;
  font-weight: 300;
}

/* 底部收尾 */
.footer-text {
  font-family: 'Georgia', 'Songti SC', 'STSong', serif;
  font-size: clamp(0.85rem, 2vw, 1.05rem);
  color: rgba(93, 63, 158, 0.85);
  letter-spacing: 0.2em;
  font-weight: 300;
  font-style: italic;
  text-shadow: 0 0 12px rgba(93, 63, 158, 0.4);
  animation: footer-breathe 5s ease-in-out infinite;
  max-width: 90%;
}

@keyframes footer-breathe {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .content-layer {
    padding: 5rem 1rem 2rem;
  }

  .timer-row {
    gap: 0.25rem;
  }

  .time-unit {
    min-width: 2.5rem;
  }

  .separator {
    margin: 0 0.1rem;
  }

  .title-block {
    margin-bottom: 2.5rem;
  }

  .timer-block {
    margin-bottom: 2.5rem;
  }
}
</style>
