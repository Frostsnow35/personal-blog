<template>
  <div class="uptime-page">
    <canvas ref="canvasRef"></canvas>
    <div class="content">
      <router-link to="/" class="back-link">返回主页</router-link>
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

const START_DATE = '2026-07-12'
const canvasRef = ref<HTMLCanvasElement | null>(null)
const timerHtml = ref('')
const startNote = ref('')

let W = 0; let H = 0
let ctx: CanvasRenderingContext2D | null = null
let animId = 0
let timerId: ReturnType<typeof setInterval> | null = null
let time = 0

/* ==================== 工具 ==================== */
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const cs = () => Math.min(W, H) / 900
function sr(seed: number): number { const n = Math.sin(seed * 9301 + 49297) * 233280; return n - Math.floor(n) }
function ns(seed: number, x: number, y: number, z: number): number { const n = Math.sin(seed * 12.9898 + x * 78.233 + y * 43.117 + z * 37.419) * 43758.5453; return n - Math.floor(n) }
function mc(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] }

/* ==================== 调色板 v4（暴力增亮版） ==================== */
const SKY_DEEP   = ['#20346c','#243a76','#284080','#2c468a','#263c7a','#2a4284','#304888','#223870']
const SKY_MID    = ['#3858a0','#3e60aa','#4468b4','#4a70be','#3c5ca8','#4064b0','#4e6cb8','#425eb4']
const SKY_PURPLE = ['#4a50b0','#5058c0','#5660d0','#5c68d8','#4e54b8','#525cc4','#5e64d0','#5058c0']
const SKY_LIGHT  = ['#5878c8','#5e82d8','#648ce0','#6a96e8','#5c7cd0','#6086d8','#6890e0','#668ee0']
const SKY_CTR    = ['#4260a4','#4868ae','#4e70b8','#5478c2','#4664a8','#4c6cb4','#5074bc','#567cbe']

const VORT_GREEN  = ['#68a880','#74b890','#80c8a0','#8cd8b0','#6cac88','#78bc98','#80c4a8','#8cd0b0']
const VORT_LIGHT  = ['#a0d8c0','#b0e8d0','#bcf0d8','#c8f8e0','#a8dcc8','#b4ecd4','#c0f0d8','#c8f8e0']
const VORT_YELLOW = ['#dcc060','#e8d878','#f0e888','#f8f098','#e0c868','#ecd878','#f0e480','#f8f090']
const VORT_WHITE  = ['#f4f0d8','#faf8e8','#fffff0','#ffffff','#f8f4e0','#fcf8e8','#fffff0','#fcf8e0']
const VORT_NUM    = 600

const STAR_OUTER = ['#d4dcf8','#dce4fc','#c8d4f0','#d0d8f4','#e0e8fc','#d8e0f8','#c0cce8','#dce0f8']
const STAR_CR    = ['#fff8d0','#fff0c0','#fce8a8','#f8e090','#f0d878','#fff4c8','#fcecb0','#fae898']
const STAR_MINT  = ['#e8f0a8','#e0e8a0','#f0f8b8','#f8fcc0','#e4eca4','#ecf4b0']
const STAR_CORE  = ['#ffffe8','#fffa98','#fff888','#fff068','#ffe848','#fce030','#ffffb0','#fffa80']

const MOON_HALO  = ['#fcf0b0','#fef8c8','#fcf0b8','#f8e8a0','#fef8c0','#fcecb0','#fef8c8','#f4e898']
const MOON_BODY  = ['#fce498','#ffeca0','#fff0a8','#f8d880','#fee898','#ffe8a0']
const MOON_CORE  = '#fff8c8'

const SIL_BASE   = '#0c1c16'
const SIL_TEX    = ['#122420','#142622','#162824','#10221e','#152622','#182a26','#0e201a','#182a24']
const CYPRESS_BASE='#081a10'
const CYPRESS_TEX = ['#0e2016','#102218','#0d1e14','#0f2016','#112418','#0e1e14']

/* ==================== 笔触系统 ==================== */
interface Stroke { x: number; y: number; angle: number; len: number; width: number; color: string; alpha: number; jx: number; jy: number; impasto: boolean; seed: number }

function drawStroke(c: CanvasRenderingContext2D, s: Stroke) {
  const css = cs()
  const sx = s.x + s.jx * css, sy = s.y + s.jy * css
  const cos = Math.cos(s.angle), sin = Math.sin(s.angle)
  const ex = sx + cos * s.len * css, ey = sy + sin * s.len * css
  const co = (ns(s.seed, 77, 0, 0) - 0.5) * 1.8
  const curve = s.angle + co
  const midX = sx + Math.cos(curve) * s.len * css * 0.5
  const midY = sy + Math.sin(curve) * s.len * css * 0.5
  c.globalAlpha = s.alpha; c.strokeStyle = s.color; c.lineWidth = s.width * css; c.lineCap = 'round'
  c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(midX, midY, ex, ey); c.stroke()
  if (s.impasto) {
    c.globalAlpha = s.alpha * 0.78; c.fillStyle = s.color
    c.beginPath(); c.ellipse(ex, ey, s.width * css * 2.1, s.width * css * 0.85, s.angle, 0, Math.PI * 2); c.fill()
  }
  c.globalAlpha = 1
}

function ms(x: number, y: number, a: number, len: number, w: number, color: string, alpha: number, seed: number): Stroke {
  return { x, y, angle: a, len, width: w, color, alpha, jx: (sr(seed + 1) - 0.5) * 1.0, jy: (sr(seed + 2) - 0.5) * 1.0, impasto: sr(seed + 3) < 0.60, seed }
}

/* ==================== 流场 ==================== */
function flowAngle(px: number, py: number): number {
  const cx = W * 0.5, cy = H * 0.28; const dx = px - cx, dy = py - cy
  const dist = Math.sqrt(dx * dx + dy * dy); const maxDist = W * 0.48
  const spiral = Math.atan2(dy, dx) + Math.PI * 0.5
  const nx = px / W, ny = py / H
  const sWave = 0.15 + Math.sin(nx * 6.2) * 0.4 + Math.sin((nx + ny) * 5.0) * 0.25 + Math.cos(nx * 7.5 - ny * 3.5) * 0.15
  const t = Math.min(dist / maxDist, 1); let b = spiral * (1 - t) + sWave * t
  const dmx = px - W * 0.86, dmy = py - H * 0.08; const dm = Math.sqrt(dmx * dmx + dmy * dmy)
  if (dm < W * 0.18) b += Math.atan2(dmy, dmx) * (1 - dm / (W * 0.18)) * 0.4
  return b
}

/* ==================== 缓存 ==================== */
let cacheVillage: HTMLCanvasElement | null = null
let cacheSky: HTMLCanvasElement | null = null
let cacheStars: HTMLCanvasElement | null = null
let cacheMoon: HTMLCanvasElement | null = null
let cacheTexture: HTMLCanvasElement | null = null
let cacheVignette: HTMLCanvasElement | null = null
let vortexStrokes: Stroke[] = []

/* ==================== 背景 ==================== */
function fillBg(c: CanvasRenderingContext2D) {
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0e1e44'); g.addColorStop(0.35, '#102050')
  g.addColorStop(0.60, '#112252'); g.addColorStop(0.80, '#0f1d46')
  g.addColorStop(1, '#0c1838'); c.fillStyle = g; c.fillRect(0, 0, W, H)
}

/* ==================== Layer 1: 村庄+丝柏 ==================== */
function buildVillage(): HTMLCanvasElement {
  const [c, cx] = mc(W, H); const ridgeY = H * 0.83

  // 山峦实体剪影
  cx.fillStyle = SIL_BASE; cx.beginPath(); cx.moveTo(0, H)
  for (let i = 0; i <= 40; i++) {
    const px = (i / 40) * W
    const nv = ns(0, i * 3.7, 0, 0) * 0.5 + Math.sin(i * 0.8) * 0.3 + Math.sin(i * 2.1) * 0.15
    cx.lineTo(px, ridgeY - nv * H * 0.06)
  }
  cx.lineTo(W, H); cx.closePath(); cx.fill()

  // 教堂尖塔
  const sx = W * 0.48, sb = H * 0.84, st = H * 0.64
  cx.fillStyle = SIL_BASE; cx.beginPath()
  cx.moveTo(sx - 20 * cs(), sb); cx.lineTo(sx, st); cx.lineTo(sx + 15 * cs(), sb)
  cx.closePath(); cx.fill()

  // 建筑块
  for (let i = 0; i < 10; i++) {
    cx.fillStyle = SIL_BASE
    cx.fillRect(W * (0.06 + i * 0.09 + sr(i + 7000) * 0.04), ridgeY + H * 0.01,
      W * (0.03 + sr(i + 7100) * 0.07), H * (0.03 + sr(i + 7200) * 0.07))
  }

  // 山峦纹理笔触
  let sid = 0
  for (let i = 0; i < 200; i++) {
    const px = W * (0.02 + sr(sid + 100) * 0.96)
    const frac = sr(sid + 200)
    const py = (ridgeY - H * 0.04) + (H - ridgeY + H * 0.04) * (0.2 + frac * 0.8)
    drawStroke(cx, ms(px, py, (sr(sid + 300) - 0.5) * 0.35,
      20 + sr(sid + 400) * 45, 2 + sr(sid + 500) * 4, pick(SIL_TEX), 0.55 + sr(sid + 600) * 0.3, sid)); sid++
  }

  // 尖塔纹理
  for (let i = 0; i < 20; i++) {
    const f = sr(sid + 700); const py = st + (sb - st) * f
    const w = 5 + (sb - py) / (sb - st) * 12
    drawStroke(cx, ms(sx - w * 0.5 + sr(sid + 800) * w, py, (sr(sid + 900) - 0.5) * 0.1,
      8 + sr(sid + 1000) * 14, 1.8 + sr(sid + 1100) * 2.5, '#122418', 0.55 + sr(sid + 1200) * 0.25, sid)); sid++
  }

  // 丝柏实体剪影
  const cyX = W * 0.07, cyBase = H * 0.92, cyTop = H * 0.20, cyMaxW = W * 0.09
  cx.fillStyle = CYPRESS_BASE; cx.beginPath(); cx.moveTo(cyX, cyTop)
  for (let i = 1; i < 35; i++) {
    const f = i / 35, py = cyTop + (cyBase - cyTop) * f
    const w = cyMaxW * (1 - f * 0.65) * (0.35 + 0.65 * Math.sin(f * 10 + i * 0.7))
    cx.lineTo(cyX - w * 0.45, py)
  }
  for (let i = 34; i >= 0; i--) {
    const f = i / 35, py = cyTop + (cyBase - cyTop) * f
    const w = cyMaxW * (1 - f * 0.65) * (0.35 + 0.65 * Math.sin(f * 10 + i * 0.7 + 0.5))
    cx.lineTo(cyX + w * 0.55, py)
  }
  cx.closePath(); cx.fill()

  // 丝柏纹理
  for (let i = 0; i < 120; i++) {
    const f = sr(sid + 1300); const py = cyTop + (cyBase - cyTop) * f
    const wave = Math.sin(f * 12 + sr(sid + 1400)) * 0.5 + 0.5
    const w = cyMaxW * (1 - f * 0.65) * (0.35 + wave * 0.65)
    const px = cyX - w * 0.5 + sr(sid + 1500) * w * 1.1
    drawStroke(cx, ms(px, py, (sr(sid + 1600) - 0.5) * 0.25,
      12 + sr(sid + 1700) * 28, 2 + sr(sid + 1800) * 3.5, pick(CYPRESS_TEX), 0.55 + sr(sid + 1900) * 0.3, sid)); sid++
  }
  return c
}

/* ==================== Layer 2: 夜空 ==================== */
function buildSky(): HTMLCanvasElement {
  const [c, cx] = mc(W, H)
  for (let i = 0; i < 1700; i++) {
    const px = sr(10000 + i) * W, py = sr(10000 + i + 2000) * H * 0.76
    const ny = py / H
    const dCtr = Math.sqrt((px / W - 0.5) ** 2 + (py / H - 0.35) ** 2)
    let cp: string[]
    if (ny < 0.12) cp = SKY_PURPLE
    else if (ny < 0.28) cp = sr(10000 + i + 3000) < 0.5 ? SKY_PURPLE : SKY_MID
    else if (ny < 0.46) cp = sr(10000 + i + 3100) < 0.35 ? SKY_LIGHT : SKY_MID
    else if (ny < 0.60) cp = SKY_MID
    else cp = SKY_DEEP
    if (dCtr < 0.16) { cp = SKY_CTR; if (sr(10000 + i + 3200) < 0.35) continue }
    const a = flowAngle(px, py) + (sr(10000 + i + 4000) - 0.5) * 0.7
    const alpha = (dCtr < 0.20 ? 0.14 : 0.10) + sr(10000 + i + 10000) * 0.28
    drawStroke(cx, ms(px, py, a, 22 + sr(10000 + i + 6000) * 58, 2.5 + sr(10000 + i + 8000) * 5, pick(cp), alpha, 10000 + i))
  }
  return c
}

/* ==================== Layer 3: 漩涡光带 ==================== */
function buildVortexStrokes() {
  vortexStrokes = []
  let sid = 20000
  for (let i = 0; i < VORT_NUM; i++) {
    const px = W * (0.04 + sr(sid + i) * 0.92)
    const py = H * (0.02 + sr(sid + i + 2000) * 0.55)

    // 跳过月亮区（半径 15% 屏宽）
    const dmx = px - W * 0.86, dmy = py - H * 0.06
    if (Math.sqrt(dmx * dmx + dmy * dmy) < W * 0.15) continue

    // 中心文字区降低密度
    const dcx = px - W * 0.5, dcy = py - H * 0.42
    if (Math.sqrt(dcx * dcx + dcy * dcy) < W * 0.10 && sr(sid + i + 100) < 0.5) continue

    const a = flowAngle(px, py) + (sr(sid + i + 4000) - 0.5) * 0.5
    const distFromCtr = Math.sqrt((px / W - 0.5) ** 2 + (py / H - 0.28) ** 2)
    let cp: string[]
    if (distFromCtr < 0.06) cp = VORT_WHITE
    else if (distFromCtr < 0.14) cp = VORT_LIGHT
    else if (distFromCtr < 0.22) cp = VORT_YELLOW
    else cp = VORT_GREEN
    vortexStrokes.push(ms(px, py, a, 24 + sr(sid + i + 6000) * 44, 3 + sr(sid + i + 8000) * 5.5, pick(cp), 0.24 + sr(sid + i + 10000) * 0.26, sid + i))
  }
}

function drawVortex(c: CanvasRenderingContext2D, t: number) {
  for (const s of vortexStrokes) {
    const da = Math.sin(t * 0.00045 + s.seed * 0.01) * 0.025 * (Math.PI / 180)
    const dx = Math.cos(s.angle) * Math.sin(t * 0.0005 + s.seed * 0.013) * 0.4 * cs()
    const dy = Math.sin(s.angle) * Math.sin(t * 0.00055 + s.seed * 0.011) * 0.4 * cs()
    const orig = { x: s.x, y: s.y, angle: s.angle }
    s.x += dx; s.y += dy; s.angle += da
    drawStroke(c, s)
    s.x = orig.x; s.y = orig.y; s.angle = orig.angle
  }
}

/* ==================== Layer 4: 星星 ==================== */
interface StarDef { x: number; y: number; r: number; tier: 1 | 2 | 3 }
const starDefs: StarDef[] = [
  { x: 0.12, y: 0.10, r: 55, tier: 1 }, { x: 0.82, y: 0.12, r: 50, tier: 1 },
  { x: 0.18, y: 0.70, r: 48, tier: 1 }, { x: 0.38, y: 0.07, r: 28, tier: 2 },
  { x: 0.60, y: 0.36, r: 26, tier: 2 }, { x: 0.74, y: 0.16, r: 27, tier: 2 },
  { x: 0.14, y: 0.42, r: 25, tier: 2 }, { x: 0.06, y: 0.24, r: 9, tier: 3 },
  { x: 0.85, y: 0.34, r: 8, tier: 3 }, { x: 0.48, y: 0.55, r: 7, tier: 3 },
]

function buildStars(): HTMLCanvasElement {
  const [c, cx] = mc(W, H); let sid = 30000
  for (const sd of starDefs) {
    const sx = sd.x * W, sy = sd.y * H, sr2 = sd.r * cs(), tier = sd.tier
    // 跳过中心区
    const dcx = sx - W * 0.5, dcy = sy - H * 0.42
    if (Math.sqrt(dcx * dcx + dcy * dcy) < W * 0.08) continue

    if (tier <= 2) {
      const n = tier === 1 ? 28 : 14
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (sr(sid + i) - 0.5) * 0.35
        const r0 = sr2 * (tier === 1 ? 3.5 : 2.5) + sr(sid + i + 200) * sr2 * 1.5
        const ax = sx + Math.cos(a) * r0, ay = sy + Math.sin(a) * r0
        const sl = sr2 * (tier === 1 ? 2.5 : 1.5) + sr(sid + i + 400) * sr2 * 3
        drawStroke(cx, ms(ax, ay, a + (sr(sid + i + 600) - 0.5) * 1.0, sl / cs(),
          1.2 + sr(sid + i + 800) * 2, pick(STAR_OUTER), 0.08 + sr(sid + i + 1000) * 0.10, sid + i))
      }
    }

    if (tier <= 2) {
      const n = tier === 1 ? 55 : 32
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (sr(sid + i + 2000) - 0.5) * 0.4
        const ringR = sr2 * (tier === 1 ? 1.7 : 1.4) + sr(sid + i + 2200) * sr2 * 1.4
        const sl = sr2 * 0.65 + sr(sid + i + 2400) * sr2 * 0.95
        const tang = a + Math.PI * 0.5 + (sr(sid + i + 2600) - 0.5) * 0.7
        const pool = sr(sid + i + 2800) < 0.35 ? STAR_MINT : STAR_CR
        drawStroke(cx, ms(sx + Math.cos(a) * ringR, sy + Math.sin(a) * ringR, tang, sl / cs(),
          2.5 + sr(sid + i + 3000) * 3.5, pick(pool), 0.45 + sr(sid + i + 3200) * 0.25, sid + i + 2000))
      }
    }

    if (tier <= 2) {
      const n = tier === 1 ? 30 : 18
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (sr(sid + i + 4000) - 0.5) * 0.3
        const ringR = sr2 * (tier === 1 ? 0.6 : 0.4) + sr(sid + i + 4200) * sr2 * 0.5
        const sl = sr2 * 0.3 + sr(sid + i + 4400) * sr2 * 0.4
        const tang = a + Math.PI * 0.5 + (sr(sid + i + 4600) - 0.5) * 0.8
        drawStroke(cx, ms(sx + Math.cos(a) * ringR, sy + Math.sin(a) * ringR, tang, sl / cs(),
          1.8 + sr(sid + i + 4800) * 2.5, pick(STAR_CR), 0.50 + sr(sid + i + 5000) * 0.25, sid + i + 4000))
      }
    }

    const nCore = tier === 1 ? 30 : tier === 2 ? 18 : 12
    for (let i = 0; i < nCore; i++) {
      const oa = sr(sid + i + 6000) * Math.PI * 2, od = sr(sid + i + 6200) * sr2 * 0.4
      drawStroke(cx, ms(sx + Math.cos(oa) * od, sy + Math.sin(oa) * od, sr(sid + i + 6400) * Math.PI * 2,
        (sr2 * 0.2 + sr(sid + i + 6600) * sr2 * 0.55) / cs(), 3 + sr(sid + i + 6800) * 4,
        pick(STAR_CORE), 0.55 + sr(sid + i + 7000) * 0.2, sid + i + 6000))
    }

    if (tier === 3) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, R = sr2 * 3.5
        drawStroke(cx, ms(sx + Math.cos(a) * R, sy + Math.sin(a) * R, a,
          sr2 * 2.5 / cs(), 1, pick(STAR_OUTER), 0.12, sid + i + 8000))
      }
    }
    sid += 9000
  }
  return c
}

/* ==================== Layer 5: 弯月（暴力可见版） ==================== */
function buildMoon(): HTMLCanvasElement {
  const [c, cx] = mc(W, H)
  const mx = W * 0.86, my = H * 0.07, mr = 80 * cs()
  let sid = 50000

  // 外层广域光晕
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2
    const r = mr * (3.0 + Math.sin(i * 2.1) * 0.8 + sr(sid + i) * 1.5)
    drawStroke(cx, ms(mx + Math.cos(a) * r, my + Math.sin(a) * r * 0.6, a + Math.PI * 0.5,
      14 + sr(sid + i + 50) * 14, 2.5 + sr(sid + i + 100) * 3, pick(MOON_HALO), 0.18 + sr(sid + i + 200) * 0.12, sid + i))
  }

  // 中层光晕
  for (let i = 0; i < 80; i++) {
    const a = (i / 80) * Math.PI * 2
    const r = mr * (1.5 + Math.sin(i * 2.8) * 0.5 + sr(sid + i + 300) * 0.7)
    drawStroke(cx, ms(mx + Math.cos(a) * r, my + Math.sin(a) * r * 0.65, a + Math.PI * 0.5,
      12 + sr(sid + i + 350) * 12, 3 + sr(sid + i + 400) * 3.5, pick(MOON_HALO), 0.28 + sr(sid + i + 500) * 0.14, sid + i + 500))
  }

  // 月牙本体（密集厚涂）
  for (let i = 0; i < 130; i++) {
    const a = sr(sid + i + 600) * Math.PI * 2
    const r = sr(sid + i + 700) * mr * 0.75
    drawStroke(cx, ms(mx + Math.cos(a) * r, my + Math.sin(a) * r, a + Math.PI * 0.5,
      8 + sr(sid + i + 800) * 14, 3.5 + sr(sid + i + 900) * 4.5,
      pick(MOON_BODY), 0.75 + sr(sid + i + 1000) * 0.22, sid + i + 600))
  }

  // 内核亮区
  for (let i = 0; i < 55; i++) {
    const a = sr(sid + i + 1100) * Math.PI * 2
    const r = sr(sid + i + 1200) * mr * 0.35
    drawStroke(cx, ms(mx + Math.cos(a) * r, my + Math.sin(a) * r, a + Math.PI * 0.5,
      6 + sr(sid + i + 1300) * 10, 3 + sr(sid + i + 1400) * 3,
      MOON_CORE, 0.85 + sr(sid + i + 1500) * 0.13, sid + i + 1100))
  }

  // 切口暗部
  const cutX = mx + mr * 0.35, cutY = my - mr * 0.15
  for (let i = 0; i < 30; i++) {
    const a = sr(sid + i + 1600) * Math.PI * 2
    const r = sr(sid + i + 1700) * mr * 0.5
    drawStroke(cx, ms(cutX + Math.cos(a) * r, cutY + Math.sin(a) * r, a,
      5 + sr(sid + i + 1800) * 8, 2 + sr(sid + i + 1900) * 2,
      '#0a1438', 0.6 + sr(sid + i + 2000) * 0.2, sid + i + 1600))
  }
  return c
}

/* ==================== Layer 6: 纹理 ==================== */
function buildTexture(): HTMLCanvasElement {
  const [c, cx] = mc(W, H)
  const imgData = cx.createImageData(W, H)
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 24
    imgData.data[i] = v; imgData.data[i + 1] = v
    imgData.data[i + 2] = v + Math.random() * 6; imgData.data[i + 3] = 255
  }
  cx.putImageData(imgData, 0, 0)
  return c
}

/* ==================== Layer 7: 暗角 ==================== */
function buildVignette(): HTMLCanvasElement {
  const [c, cx] = mc(W, H)
  const g = cx.createRadialGradient(W / 2, H * 0.46, Math.min(W, H) * 0.06, W / 2, H * 0.46, Math.max(W, H) * 0.72)
  g.addColorStop(0, 'transparent'); g.addColorStop(0.25, 'transparent')
  g.addColorStop(1, 'rgba(5,8,20,0.45)')
  cx.fillStyle = g; cx.fillRect(0, 0, W, H)
  return c
}

/* ==================== 初始化 ==================== */
function buildAllLayers() {
  cacheVillage = buildVillage()
  cacheSky = buildSky()
  buildVortexStrokes()
  cacheStars = buildStars()
  cacheMoon = buildMoon()
  cacheTexture = buildTexture()
  cacheVignette = buildVignette()
}

/* ==================== 动画循环 ==================== */
function animate() {
  if (!ctx) return
  time++
  ctx.clearRect(0, 0, W, H)
  fillBg(ctx)

  if (cacheVillage) ctx.drawImage(cacheVillage, 0, 0)
  if (cacheSky) ctx.drawImage(cacheSky, 0, 0)
  drawVortex(ctx, time)
  if (cacheStars) {
    ctx.globalAlpha = 0.78 + 0.22 * Math.sin(time * 0.008)
    ctx.drawImage(cacheStars, 0, 0)
    ctx.globalAlpha = 1
  }
  if (cacheMoon) ctx.drawImage(cacheMoon, 0, 0)
  if (cacheTexture) {
    ctx.globalAlpha = 0.18
    ctx.drawImage(cacheTexture, 0, 0)
    ctx.globalAlpha = 1
  }
  if (cacheVignette) ctx.drawImage(cacheVignette, 0, 0)
  animId = requestAnimationFrame(animate)
}

/* ==================== 计时器 ==================== */
function pad(n: number): string { return String(n).padStart(2, '0') }
function calcUptime(startDateStr: string) {
  const now = new Date(); const start = new Date(startDateStr + 'T00:00:00')
  let cursor = new Date(start); let years = 0, months = 0
  while (true) { const ny = new Date(cursor); ny.setFullYear(ny.getFullYear() + 1); if (ny > now) break; years++; cursor = ny }
  while (true) { const nm = new Date(cursor); const pd = nm.getDate(); nm.setMonth(nm.getMonth() + 1); if (nm.getDate() !== pd) nm.setDate(0); if (nm > now) break; months++; cursor = nm }
  const dms = now.getTime() - cursor.getTime()
  return { years, months, days: Math.floor(dms / 86400000), hours: Math.floor((dms % 86400000) / 3600000), minutes: Math.floor((dms % 3600000) / 60000), seconds: Math.floor((dms % 60000) / 1000) }
}

const units = ['年', '月', '天', '时', '分', '秒']
function renderTimer() {
  const t = calcUptime(START_DATE)
  const v = [t.years, t.months, t.days, t.hours, t.minutes, t.seconds]
  let h = ''
  for (let i = 0; i < v.length; i++) {
    h += `<div class="timer-unit"><span class="timer-num">${pad(v[i])}</span><span class="timer-label">${units[i]}</span></div>`
    if (i < v.length - 1) h += '<span class="timer-colon">:</span>'
  }
  timerHtml.value = h
}

function resize() {
  const canvas = canvasRef.value; if (!canvas) return
  W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight
  ctx = canvas.getContext('2d'); buildAllLayers()
}

let resizeTimer: ReturnType<typeof setTimeout>
function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200) }

onMounted(() => {
  const canvas = canvasRef.value; if (!canvas) return
  W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  buildAllLayers()
  startNote.value = `自 ${new Date(START_DATE + 'T00:00:00').getFullYear()} 年 ${pad(new Date(START_DATE + 'T00:00:00').getMonth() + 1)} 月 ${pad(new Date(START_DATE + 'T00:00:00').getDate())} 日起`
  renderTimer(); timerId = setInterval(renderTimer, 1000); animate()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId); if (timerId) clearInterval(timerId)
  clearTimeout(resizeTimer); window.removeEventListener('resize', onResize)
})
</script>

<style>
.uptime-page { position: fixed; inset: 0; background: #0a1630; font-family: Georgia,'Times New Roman','Noto Serif SC',serif; overflow: hidden; cursor: default; }
canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; }
.content { position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.back-link { position: fixed; top: clamp(1rem,2.5vh,2rem); left: clamp(1rem,2.5vw,2rem); z-index: 11; font-size: clamp(.75rem,1.5vw,.9rem); color: #d4c291; text-decoration: none; letter-spacing: .06em; text-shadow: 0 0 10px rgba(242,208,126,.3),0 1px 4px rgba(0,0,0,.6); opacity: 0.7; transition: opacity .3s; }
.back-link:hover { opacity: 1; }
.timer-title { font-size: clamp(1.6rem,4.5vw,3rem); font-weight: bold; color: #f2d07e; letter-spacing: .18em; text-shadow: 0 0 14px rgba(242,208,126,.45),0 2px 8px rgba(0,0,0,.6); margin-bottom: .5rem; }
.timer-subtitle { font-size: clamp(.8rem,1.8vw,1.15rem); color: #d4c291; font-weight: 300; letter-spacing: .14em; margin-bottom: 2.8rem; opacity: 0.70; text-shadow: 0 0 10px rgba(242,208,126,.25),0 1px 4px rgba(0,0,0,.4); }
.timer-row { display: flex; align-items: flex-end; justify-content: center; gap: clamp(1px,.8vw,6px); margin-bottom: .2rem; }
.timer-unit { display: flex; flex-direction: column; align-items: center; min-width: clamp(2.8rem,8vw,5.5rem); }
.timer-num { font-family: 'Courier New',Consolas,Menlo,'Source Code Pro',monospace; font-size: clamp(2.2rem,7vw,5.5rem); font-weight: bold; color: #f2d07e; line-height: 1.1; text-shadow: 0 0 16px rgba(242,208,126,.5),0 2px 10px rgba(0,0,0,.6); letter-spacing: .04em; }
.timer-colon { font-family: 'Courier New',Consolas,Menlo,monospace; font-size: clamp(1.8rem,6vw,4.5rem); color: #d4c291; padding-bottom: clamp(1rem,2.5vw,1.8rem); text-shadow: 0 0 10px rgba(242,208,126,.25),0 1px 4px rgba(0,0,0,.4); user-select: none; }
.timer-label { font-size: clamp(.65rem,1.5vw,.95rem); color: #d4c291; margin-top: .15rem; letter-spacing: .1em; opacity: 0.72; text-shadow: 0 0 8px rgba(242,208,126,.2),0 1px 3px rgba(0,0,0,.4); }
.start-note { font-size: clamp(.7rem,1.5vw,.9rem); color: #d4c291; margin-top: 2.8rem; letter-spacing: .08em; opacity: 0.70; text-shadow: 0 0 8px rgba(242,208,126,.2),0 1px 3px rgba(0,0,0,.4); }
.footer-quote { font-size: clamp(.7rem,1.5vw,.85rem); color: #d4c291; position: fixed; bottom: clamp(1.5rem,3vh,2.5rem); left: 50%; transform: translateX(-50%); z-index: 10; letter-spacing: .1em; font-style: italic; white-space: nowrap; opacity: 0.72; text-shadow: 0 0 8px rgba(242,208,126,.2),0 1px 3px rgba(0,0,0,.4); }
@media (max-width: 480px) { .timer-unit{min-width:2.4rem}.timer-row{gap:0} .timer-colon{font-size:clamp(1.4rem,5vw,2.5rem)} }
</style>
