// 性能基准测试工具
export class PerformanceBenchmark {
  private metrics: Map<string, number[]> = new Map()
  private startTime: number = 0
  
  constructor() {
    this.startTime = performance.now()
  }
  
  // 测试 Three.js 渲染性能
  measureThreeJS() {
    const start = performance.now()
    
    // 模拟 1000 个粒子的渲染计算
    const testParticles = 1000
    const positions = new Float32Array(testParticles * 3)
    const colors = new Float32Array(testParticles * 3)
    
    for (let i = 0; i < testParticles; i++) {
      positions[i * 3] = Math.random()
      positions[i * 3 + 1] = Math.random()
      positions[i * 3 + 2] = Math.random()
      
      colors[i * 3] = Math.random()
      colors[i * 3 + 1] = Math.random()
      colors[i * 3 + 2] = Math.random()
    }
    
    const end = performance.now()
    const duration = end - start
    
    this.recordMetric('threejs_render', duration)
    return duration
  }
  
  // 测试数据加载性能
  async measureDataLoading() {
    const start = performance.now()
    
    try {
      const response = await fetch('/api/posts/published')
      await response.json()
    } catch (error) {
      return 0
    }
    
    const end = performance.now()
    const duration = end - start
    
    this.recordMetric('data_loading', duration)
    return duration
  }
  
  // 测试组件渲染性能
  measureComponentRender(componentName: string) {
    const start = performance.now()
    
    // 模拟组件渲染计算
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      title: `测试文章 ${i}`,
      content: `这是测试内容 ${i}`.repeat(10)
    }))
    
    // 模拟过滤和渲染逻辑
    const filtered = testData.filter(item => 
      item.title.includes('测试') || item.content.includes('测试')
    )
    
    const end = performance.now()
    const duration = end - start
    
    this.recordMetric(`component_${componentName}`, duration)
    return duration
  }
  
  // 测试内存使用
  measureMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    return null
  }
  
  // 测试帧率
  measureFrameRate(duration = 1000) {
    return new Promise<number>((resolve) => {
      let frameCount = 0
      const startTime = performance.now()
      
      const countFrame = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrame)
        } else {
          const fps = Math.round((frameCount * 1000) / duration)
          this.recordMetric('fps', fps)
          resolve(fps)
        }
      }
      
      requestAnimationFrame(countFrame)
    })
  }
  
  // 记录性能指标
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }
  
  // 计算有效指标（去掉最高最低值后的平均值）
  private calculateValidMetric(values: number[]): { avg: number; min: number; max: number; median: number; samples: number; validSamples: number; droppedHigh: number; droppedLow: number } {
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, median: 0, samples: 0, validSamples: 0, droppedHigh: 0, droppedLow: 0 }
    }
    
    const sorted = [...values].sort((a, b) => a - b)
    const totalSamples = sorted.length
    
    let validValues = sorted
    let droppedHigh = 0
    let droppedLow = 0
    
    if (totalSamples >= 3) {
      validValues = sorted.slice(1, -1)
      droppedHigh = sorted[sorted.length - 1]
      droppedLow = sorted[0]
    }
    
    const validSamples = validValues.length
    const sum = validValues.reduce((a, b) => a + b, 0)
    const avg = validSamples > 0 ? sum / validSamples : 0
    const min = validSamples > 0 ? Math.min(...validValues) : 0
    const max = validSamples > 0 ? Math.max(...validValues) : 0
    
    let median = 0
    if (validSamples > 0) {
      const mid = Math.floor(validSamples / 2)
      median = validSamples % 2 === 0 
        ? (validValues[mid - 1] + validValues[mid]) / 2 
        : validValues[mid]
    }
    
    return {
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      median: Math.round(median * 100) / 100,
      samples: totalSamples,
      validSamples,
      droppedHigh: Math.round(droppedHigh * 100) / 100 || 0,
      droppedLow: Math.round(droppedLow * 100) / 100 || 0
    }
  }
  
  // 生成性能报告
  generateReport() {
    const report: {
      timestamp: string
      totalDuration: number
      metrics: Record<string, any>
      memory: any
      recommendations: string[]
      testRuns: number
    } = {
      timestamp: new Date().toISOString(),
      totalDuration: performance.now() - this.startTime,
      metrics: {},
      memory: this.measureMemoryUsage(),
      recommendations: [],
      testRuns: 5
    }
    
    // 分析各项指标
    for (const [key, values] of this.metrics) {
      const result = this.calculateValidMetric(values)
      report.metrics[key] = result
      
      // 生成优化建议
      if (key === 'threejs_render' && result.avg > 16) {
        report.recommendations.push('Three.js 渲染性能较低，建议优化粒子数量或使用 LOD')
      }
      
      if (key === 'data_loading' && result.avg > 500) {
        report.recommendations.push('数据加载较慢，建议实现缓存机制')
      }
      
      if (key === 'fps' && result.avg < 50) {
        report.recommendations.push('帧率较低，建议优化动画和渲染逻辑')
      }
    }
    
    return report
  }
  
  // 保存报告到本地存储
  saveReport(report: any) {
    try {
      localStorage.setItem('performance-benchmark', JSON.stringify(report))
    } catch (error) {
      // 静默处理错误
    }
  }
}

// 运行完整基准测试（5次测试）
export const runBenchmark = async () => {
  const benchmark = new PerformanceBenchmark()
  const testRuns = 5
  
  try {
    for (let i = 0; i < testRuns; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      benchmark.measureThreeJS()
      await benchmark.measureDataLoading()
      benchmark.measureComponentRender('PostCard')
      await benchmark.measureFrameRate(500)
    }
    
    const report = benchmark.generateReport()
    benchmark.saveReport(report)
    
    return report
    
  } catch (error) {
    return null
  }
}

// 快速测试（3次测试）
export const quickBenchmark = async () => {
  const benchmark = new PerformanceBenchmark()
  const testRuns = 3
  
  try {
    for (let i = 0; i < testRuns; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      benchmark.measureThreeJS()
      await benchmark.measureDataLoading()
      benchmark.measureComponentRender('PostCard')
      await benchmark.measureFrameRate(300)
    }
    
    const report = benchmark.generateReport()
    benchmark.saveReport(report)
    
    return report
    
  } catch (error) {
    return null
  }
}