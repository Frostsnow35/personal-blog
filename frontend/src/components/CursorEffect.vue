<template>
  <div ref="container" class="fixed inset-0 pointer-events-none z-40"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const container = ref<HTMLDivElement>()

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let particles: THREE.Points
let mouse = new THREE.Vector2()

const initThree = () => {
  if (!container.value) return
  
  try {
    // 低性能设备直接禁用，提升流畅性
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isLowEndDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
      (navigator.deviceMemory && (navigator as any).deviceMemory <= 4) || prefersReducedMotion
    if (isLowEndDevice) {
      if (container.value) container.value.style.display = 'none'
      return
    }
    // 创建场景
    scene = new THREE.Scene()
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    container.value.appendChild(renderer.domElement)
    
    // 创建海洋粒子
    createOceanParticles()
    
    // 添加鼠标事件
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('resize', onWindowResize)
    
    // 开始动画
    animate()
  } catch (error) {
    console.error('Three.js初始化失败:', error)
    // 如果Three.js失败，隐藏容器
    if (container.value) {
      container.value.style.display = 'none'
    }
  }
}

const createOceanParticles = () => {
  // 根据设备性能动态调整粒子数量
  const isMobile = window.innerWidth < 768
  const isLowEnd = navigator.hardwareConcurrency < 4
  
  let particleCount = 1000
  if (isMobile) particleCount = 300
  if (isLowEnd) particleCount = 150
  
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    // 随机位置
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    
    // 海洋颜色
    colors[i * 3] = 0.1 + Math.random() * 0.3     // R
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.5 // G
    colors[i * 3 + 2] = 0.8 + Math.random() * 0.2 // B
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
  
  particles = new THREE.Points(geometry, material)
  scene.add(particles)
}

const onMouseMove = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  
  // 让粒子跟随鼠标移动
  if (particles) {
    particles.rotation.x += mouse.y * 0.01
    particles.rotation.y += mouse.x * 0.01
  }
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// 性能监控和帧率控制
let lastFrameTime = 0
const targetFPS = 60
const frameInterval = 1000 / targetFPS

const animate = () => {
  const currentTime = performance.now()
  
  // 限制帧率
  if (currentTime - lastFrameTime < frameInterval) {
    requestAnimationFrame(animate)
    return
  }
  
  if (particles && particles.geometry) {
    particles.rotation.x += 0.001
    particles.rotation.y += 0.002
    
    // 波浪动画 - 优化性能
    const positions = particles.geometry.attributes.position.array as Float32Array
    const time = Date.now() * 0.001
    
    // 减少计算频率以提高性能
    for (let i = 0; i < positions.length; i += 9) { // 每3个粒子更新一次
      positions[i + 1] += Math.sin(time + positions[i] * 0.5) * 0.001
    }
    
    particles.geometry.attributes.position.needsUpdate = true
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
  
  lastFrameTime = currentTime
  requestAnimationFrame(animate)
}

onMounted(() => {
  initThree()
})

onUnmounted(() => {
  // 动画循环会自动停止，无需手动取消
  document.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onWindowResize)
  
  // 清理Three.js资源
  if (particles && particles.geometry) {
    particles.geometry.dispose()
  }
  if (particles && particles.material && Array.isArray(particles.material)) {
    particles.material.forEach(mat => mat.dispose())
  } else if (particles && particles.material && 'dispose' in particles.material) {
    (particles.material as any).dispose()
  }
  if (renderer) {
    renderer.dispose()
    if (container.value && renderer.domElement) {
      container.value.removeChild(renderer.domElement)
    }
  }
  
  // 清理场景
  if (scene) {
    scene.clear()
  }
})
</script>
