<template>
  <div class="uptime-page">
    <canvas ref="canvasRef" class="starry-canvas"></canvas>
    <div class="content">
      <div class="timer-title">博客运行时间</div>
      <div class="timer-subtitle">记录博客运行的每一刻</div>
      <div class="timer-row" v-html="timerHtml"></div>
      <div class="start-note">{{ startNote }}</div>
    </div>
    <div class="footer-quote">即使身处阴沟，也别忘了仰望星空</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const START_DATE = '2024-01-01'
const canvasRef = ref<HTMLCanvasElement | null>(null)
const timerHtml = ref('')
const startNote = ref('')

let animId = 0
let timerId: ReturnType<typeof setInterval> | null = null
let W = 0
let H = 0
let time = 0
let ctx: CanvasRenderingContext2D | null = null
let stars: Array<{ x: number; y: number; r: number; p: number; v: number }> = []

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  W = canvas.width = window.innerWidth
  H = canvas.height = window.innerHeight
}

function initStars() {
  stars = [
    { x: 0.15, y: 0.15, r: 4, p: 0, v: 0.02 }, { x: 0.22, y: 0.25, r: 3, p: 1.2, v: 0.018 },
    { x: 0.3, y: 0.1, r: 2.5, p: 2.5, v: 0.022 }, { x: 0.42, y: 0.18, r: 3.5, p: 0.8, v: 0.015 },
    { x: 0.55, y: 0.12, r: 5, p: 3, v: 0.02 }, { x: 0.68, y: 0.08, r: 4.5, p: 1.5, v: 0.017 },
    { x: 0.75, y: 0.2, r: 3, p: 0.3, v: 0.025 }, { x: 0.82, y: 0.3, r: 2.5, p: 2.1, v: 0.019 },
    { x: 0.6, y: 0.25, r: 2, p: 1.8, v: 0.023 }, { x: 0.35, y: 0.3, r: 3.2, p: 0.6, v: 0.016 },
    { x: 0.48, y: 0.35, r: 2, p: 2.8, v: 0.021 }
  ]
}

function drawSky() {
  if (!ctx) return
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#050520'); g.addColorStop(0.25, '#0a1240'); g.addColorStop(0.5, '#0e1a50')
  g.addColorStop(0.7, '#162060'); g.addColorStop(0.85, '#1a2855'); g.addColorStop(1, '#0d1530')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
}

function drawSwirls(t: number) {
  if (!ctx) return
  const centers = [
    { cx: W * 0.55, cy: H * 0.38, sc: 1, sp: 0.0004 },
    { cx: W * 0.7, cy: H * 0.25, sc: 0.6, sp: 0.0006 },
    { cx: W * 0.4, cy: H * 0.2, sc: 0.5, sp: 0.0005 },
    { cx: W * 0.65, cy: H * 0.45, sc: 0.7, sp: 0.00035 }
  ]
  for (const c of centers) {
    const { cx, cy, sc, sp } = c
    const layers = [
      { r0: 40 * sc, r1: 130 * sc, n: 300, w: 30, col: 'rgba(80,140,210,0.06)', f: 4, a: 25 },
      { r0: 30 * sc, r1: 120 * sc, n: 280, w: 20, col: 'rgba(120,180,230,0.05)', f: 5, a: 20 },
      { r0: 20 * sc, r1: 100 * sc, n: 250, w: 12, col: 'rgba(200,210,230,0.06)', f: 6, a: 18 },
      { r0: 15 * sc, r1: 80 * sc, n: 200, w: 6, col: 'rgba(240,230,200,0.05)', f: 7, a: 12 }
    ]
    for (const ly of layers) {
      ctx.beginPath()
      for (let i = 0; i < ly.n; i++) {
        const frac = i / ly.n
        const angle = frac * Math.PI * 6
        const r = ly.r0 + (ly.r1 - ly.r0) * frac
        const rr = r + Math.sin(angle * ly.f + t * sp) * ly.a
        const x = cx + Math.cos(angle) * rr
        const y = cy + Math.sin(angle) * rr * 0.7
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = ly.col; ctx.lineWidth = ly.w * (W / 1200); ctx.lineCap = 'round'; ctx.stroke()
    }
  }

  const shortStrokes = [
    { x: W * 0.5, y: H * 0.2, n: 40, w: 1.5, len: 30, col: 'rgba(255,220,150,0.08)', ang: -0.3 },
    { x: W * 0.65, y: H * 0.32, n: 50, w: 1, len: 20, col: 'rgba(200,200,255,0.06)', ang: 0.5 },
    { x: W * 0.45, y: H * 0.28, n: 35, w: 1.2, len: 22, col: 'rgba(180,200,240,0.07)', ang: -0.6 }
  ]
  for (let s = 0; s < shortStrokes.length; s++) {
    const ss = shortStrokes[s]
    ctx.strokeStyle = ss.col; ctx.lineWidth = ss.w * (W / 1200); ctx.lineCap = 'round'
    for (let i = 0; i < ss.n; i++) {
      const r1 = (Math.sin(i * 127.1 + s * 311.7) + 1) * 0.5
      const r2 = (Math.sin(i * 269.5 + s * 183.3) + 1) * 0.5
      const bx = ss.x + (r1 - 0.5) * 100 * (W / 1200)
      const by = ss.y + (r2 - 0.5) * 60 * (W / 1200)
      const ang = ss.ang + Math.sin(i * 0.5 + t * 0.002) * 0.5
      ctx.beginPath(); ctx.moveTo(bx, by)
      ctx.lineTo(bx + Math.cos(ang) * ss.len * (W / 1200), by + Math.sin(ang) * ss.len * (W / 1200))
      ctx.stroke()
    }
  }
}

function drawStars(t: number) {
  if (!ctx) return
  for (const s of stars) {
    const sx = s.x * W, sy = s.y * H
    const tw = 0.6 + 0.4 * Math.sin(t * s.v + s.p)
    const al = 0.5 + tw * 0.5
    const r = s.r * (W / 1200)

    const halos = [
      { rr: r * 8, a: al * 0.12, a2: al * 0.06 },
      { rr: r * 4, a: al * 0.3, a2: al * 0.15 },
      { rr: r * 2, a: al, a2: al * 0.8 }
    ]
    for (const l of halos) {
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, l.rr)
      g.addColorStop(0, 'rgba(255,255,240,' + l.a + ')')
      g.addColorStop(0.4, 'rgba(255,220,150,' + l.a2 + ')')
      g.addColorStop(1, 'rgba(255,200,100,0)')
      ctx.fillStyle = g; ctx.fillRect(sx - l.rr, sy - l.rr, l.rr * 2, l.rr * 2)
    }
    ctx.fillStyle = 'rgba(255,255,240,' + (al * 0.9) + ')'
    ctx.beginPath(); ctx.arc(sx, sy, r * 0.5, 0, Math.PI * 2); ctx.fill()
  }
}

function drawMoon(t: number) {
  if (!ctx) return
  const mx = W * 0.78, my = H * 0.13, mr = 38 * (W / 1200)
  const ga = 0.5 + 0.1 * Math.sin(t * 0.01)

  const g1 = ctx.createRadialGradient(mx, my, mr * 0.3, mx, my, mr * 2.5)
  g1.addColorStop(0, 'rgba(255,240,200,' + (ga * 0.25) + ')')
  g1.addColorStop(0.5, 'rgba(255,220,150,' + (ga * 0.1) + ')')
  g1.addColorStop(1, 'rgba(255,180,80,0)')
  ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(mx, my, mr * 2.5, 0, Math.PI * 2); ctx.fill()

  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = 'rgba(255,235,180,0.95)'; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2)
  ctx.fillStyle = 'rgba(10,15,40,0.85)'
  ctx.beginPath(); ctx.arc(mx + mr * 0.25, my - mr * 0.1, mr * 0.85, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  const g2 = ctx.createRadialGradient(mx, my, mr * 0.7, mx, my, mr * 1.5)
  g2.addColorStop(0, 'rgba(255,240,200,0)')
  g2.addColorStop(0.5, 'rgba(255,230,160,' + (ga * 0.2) + ')')
  g2.addColorStop(1, 'rgba(255,200,100,0)')
  ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(mx, my, mr * 1.5, 0, Math.PI * 2); ctx.fill()
}

function drawCypress() {
  if (!ctx) return
  const cx = W * 0.08, baseY = H * 0.88, topY = H * 0.05, maxW = 55 * (W / 1200)
  ctx.save()
  const g = ctx.createLinearGradient(cx, topY, cx, baseY)
  g.addColorStop(0, '#0a1a08'); g.addColorStop(0.5, '#0d2008'); g.addColorStop(1, '#061005')
  ctx.fillStyle = g; ctx.beginPath()
  ctx.moveTo(cx, topY)
  for (let i = 0; i <= 15; i++) {
    const t = i / 15, y = topY + (baseY - topY) * t
    ctx.lineTo(cx + maxW * (1 - t * 0.6) * (0.6 + 0.4 * Math.sin(t * 8)), y)
  }
  ctx.lineTo(cx + maxW * 0.4, baseY); ctx.lineTo(cx - maxW * 0.15, baseY)
  for (let i = 15; i >= 0; i--) {
    const t = i / 15, y = topY + (baseY - topY) * t
    ctx.lineTo(cx - maxW * 0.3 * (1 - t * 0.5) * (0.6 + 0.4 * Math.sin(t * 7 + 1)), y)
  }
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(20,40,15,0.3)'; ctx.lineWidth = 1
  for (let i = 0; i < 25; i++) {
    const bx = cx - maxW * 0.1 + ((Math.sin(i * 77.3) + 1) * 0.5) * maxW * 0.5
    const by = topY + ((Math.sin(i * 53.7) + 1) * 0.5) * (baseY - topY)
    ctx.beginPath(); ctx.moveTo(bx, by)
    ctx.lineTo(bx + (Math.sin(i * 99.1) * 4), by + 8 + Math.sin(i * 61.3) * 6)
    ctx.stroke()
  }
  ctx.restore()
}

function drawVillage(t: number) {
  if (!ctx) return
  const vY = H * 0.78
  ctx.fillStyle = '#0d1d30'; ctx.beginPath(); ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 20)
    ctx.lineTo(x, vY + Math.sin(x * 0.003) * 25 + Math.sin(x * 0.007) * 15)
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()

  ctx.fillStyle = '#13253d'; ctx.beginPath(); ctx.moveTo(0, H)
  for (let x = 0; x <= W; x += 20)
    ctx.lineTo(x, vY + 10 + Math.sin(x * 0.005 + 1) * 20 + Math.sin(x * 0.009 + 2) * 10)
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill()

  ctx.fillStyle = '#0a1628'
  ctx.beginPath(); ctx.moveTo(W * 0.52 - 6, vY + 15); ctx.lineTo(W * 0.52, vY - 45)
  ctx.lineTo(W * 0.52 + 6, vY + 15); ctx.closePath(); ctx.fill()
  ctx.fillRect(W * 0.52 - 8, vY + 15, 16, 25)

  const houses = [W * 0.3, W * 0.35, W * 0.4, W * 0.45, W * 0.58, W * 0.62, W * 0.67, W * 0.72]
  ctx.fillStyle = '#0a1628'
  for (let i = 0; i < houses.length; i++) {
    const hw = [30, 25, 35, 28, 32, 22, 35, 28][i]
    const hh = [18, 22, 15, 20, 18, 24, 16, 20][i]
    ctx.fillRect(houses[i], vY + 10, hw * (W / 1200), hh * (W / 1200))
  }

  const lights = [W * 0.31, W * 0.36, W * 0.41, W * 0.46, W * 0.59, W * 0.63, W * 0.68, W * 0.73, W * 0.33, W * 0.43, W * 0.6]
  const lightYs = [vY + 12, vY + 10, vY + 13, vY + 11, vY + 12, vY + 10, vY + 13, vY + 11, vY + 18, vY + 17, vY + 16]
  for (let i = 0; i < lights.length; i++) {
    const tw = 0.7 + 0.3 * Math.sin(t * 0.03 + i * 1.7)
    ctx.fillStyle = 'rgba(255,210,120,' + tw + ')'
    ctx.beginPath(); ctx.arc(lights[i], lightYs[i], 2.5 * (W / 1200), 0, Math.PI * 2); ctx.fill()
  }
}

function animate() {
  if (!ctx) return
  time++
  ctx.clearRect(0, 0, W, H)
  drawSky()
  drawSwirls(time)
  drawStars(time)
  drawMoon(time)
  drawCypress()
  drawVillage(time)
  animId = requestAnimationFrame(animate)
}

// ---- 计时器逻辑 ----
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function calcUptime(startDateStr: string) {
  const now = new Date()
  const start = new Date(startDateStr + 'T00:00:00')
  let cursor = new Date(start)
  let years = 0
  let months = 0

  while (true) {
    const ny = new Date(cursor)
    ny.setFullYear(ny.getFullYear() + 1)
    if (ny > now) break
    years++
    cursor = ny
  }
  while (true) {
    const nm = new Date(cursor)
    const pd = nm.getDate()
    nm.setMonth(nm.getMonth() + 1)
    if (nm.getDate() !== pd) nm.setDate(0)
    if (nm > now) break
    months++
    cursor = nm
  }

  const dms = now.getTime() - cursor.getTime()
  return {
    years, months,
    days: Math.floor(dms / 86400000),
    hours: Math.floor((dms % 86400000) / 3600000),
    minutes: Math.floor((dms % 3600000) / 60000),
    seconds: Math.floor((dms % 60000) / 1000)
  }
}

const units = ['年', '月', '天', '时', '分', '秒']

function renderTimer() {
  const t = calcUptime(START_DATE)
  const v = [t.years, t.months, t.days, t.hours, t.minutes, t.seconds]
  let h = ''
  for (let i = 0; i < v.length; i++) {
    h += '<div class="timer-unit"><span class="timer-num">' + pad(v[i]) + '</span><span class="timer-label">' + units[i] + '</span></div>'
    if (i < v.length - 1) h += '<span class="timer-colon">:</span>'
  }
  timerHtml.value = h
}

// ---- 生命周期 ----
onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resize()
  initStars()

  const sd = new Date(START_DATE + 'T00:00:00')
  startNote.value = '自 ' + sd.getFullYear() + ' 年 ' + pad(sd.getMonth() + 1) + ' 月 ' + pad(sd.getDate()) + ' 日起'

  renderTimer()
  timerId = setInterval(renderTimer, 1000)
  animate()

  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (timerId) clearInterval(timerId)
  window.removeEventListener('resize', onResize)
  ctx = null
})

function onResize() {
  resize()
  initStars()
}
</script>

<style>
/* 全局样式 —— 不可 scoped，因为需要覆盖 body/html */
.uptime-page {
  position: fixed;
  inset: 0;
  background: #060618;
  font-family: Georgia, 'Times New Roman', 'Noto Serif SC', serif;
  overflow: hidden;
}

.starry-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: block;
}

.content {
  position: fixed;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.timer-title {
  font-size: clamp(1.6rem, 4.5vw, 3rem);
  font-weight: bold;
  color: #E8C97A;
  letter-spacing: 0.18em;
  text-shadow: 0 0 40px rgba(232, 201, 122, 0.2), 0 2px 8px rgba(0, 0, 0, 0.7);
  margin-bottom: 0.5rem;
}

.timer-subtitle {
  font-size: clamp(0.8rem, 1.8vw, 1.15rem);
  color: #B8A88A;
  font-weight: 300;
  letter-spacing: 0.14em;
  margin-bottom: 2.8rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.timer-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(1px, 0.8vw, 6px);
  margin-bottom: 0.2rem;
}

.timer-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: clamp(2.8rem, 8vw, 5.5rem);
}

.timer-num {
  font-family: 'Courier New', 'Consolas', 'Menlo', 'Source Code Pro', monospace;
  font-size: clamp(2.2rem, 7vw, 5.5rem);
  font-weight: bold;
  color: #FFD54F;
  line-height: 1.1;
  text-shadow: 0 0 20px rgba(255, 213, 79, 0.35), 0 2px 6px rgba(0, 0, 0, 0.7);
  letter-spacing: 0.04em;
}

.timer-colon {
  font-family: 'Courier New', 'Consolas', 'Menlo', monospace;
  font-size: clamp(1.8rem, 6vw, 4.5rem);
  color: #E8C97A;
  padding-bottom: clamp(1rem, 2.5vw, 1.8rem);
  text-shadow: 0 0 10px rgba(232, 201, 122, 0.2);
  user-select: none;
}

.timer-label {
  font-size: clamp(0.65rem, 1.5vw, 0.95rem);
  color: #9B8E7A;
  margin-top: 0.15rem;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.start-note {
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  color: #8B7D6B;
  margin-top: 2.8rem;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.footer-quote {
  font-size: clamp(0.7rem, 1.5vw, 0.85rem);
  color: #7A6E5A;
  position: fixed;
  bottom: clamp(1.5rem, 3vh, 2.5rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  letter-spacing: 0.1em;
  font-style: italic;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

@media (max-width: 480px) {
  .timer-unit { min-width: 2.4rem; }
  .timer-row { gap: 0; }
  .timer-colon { font-size: clamp(1.4rem, 5vw, 2.5rem); }
}
</style>
