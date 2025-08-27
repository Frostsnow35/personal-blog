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
      console.error('数据加载测试失败:', error)
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
  
  // 生成性能报告
  generateReport() {
    const report: {
      timestamp: string
      totalDuration: number
      metrics: Record<string, any>
      memory: any
      recommendations: string[]
    } = {
      timestamp: new Date().toISOString(),
      totalDuration: performance.now() - this.startTime,
      metrics: {},
      memory: this.measureMemoryUsage(),
      recommendations: []
    }
    
    // 分析各项指标
    for (const [key, values] of this.metrics) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      report.metrics[key] = { 
        avg: Math.round(avg * 100) / 100, 
        min: Math.round(min * 100) / 100, 
        max: Math.round(max * 100) / 100, 
        samples: values.length 
      }
      
      // 生成优化建议
      if (key === 'threejs_render' && avg > 16) {
        report.recommendations.push('Three.js 渲染性能较低，建议优化粒子数量或使用 LOD')
      }
      
      if (key === 'data_loading' && avg > 500) {
        report.recommendations.push('数据加载较慢，建议实现缓存机制')
      }
      
      if (key === 'fps' && avg < 50) {
        report.recommendations.push('帧率较低，建议优化动画和渲染逻辑')
      }
    }
    
    return report
  }
  
  // 保存报告到本地存储
  saveReport(report: any) {
    try {
      localStorage.setItem('performance-benchmark', JSON.stringify(report))
      // console.log('性能报告已保存到本地存储')
    } catch (error) {
      console.error('保存性能报告失败:', error)
    }
  }
}

// 使用示例
export const runBenchmark = async () => {
  // console.log('🚀 开始性能基准测试...')
  
  const benchmark = new PerformanceBenchmark()
  
  try {
    // 测试 Three.js 性能
    // console.log('📊 测试 Three.js 渲染性能...')
    const threeJS = benchmark.measureThreeJS()
    // console.log(`Three.js 渲染耗时: ${threeJS.toFixed(2)}ms`)
    
    // 测试数据加载性能
    // console.log('📊 测试数据加载性能...')
    const dataLoading = await benchmark.measureDataLoading()
    // console.log(`数据加载耗时: ${dataLoading.toFixed(2)}ms`)
    
    // 测试组件渲染性能
    // console.log('📊 测试组件渲染性能...')
    const componentRender = benchmark.measureComponentRender('PostCard')
    // console.log(`组件渲染耗时: ${componentRender.toFixed(2)}ms`)
    
    // 测试帧率
    // console.log('📊 测试帧率...')
    const fps = await benchmark.measureFrameRate(2000) // 测试2秒
    // console.log(`平均帧率: ${fps} FPS`)
    
    // 生成报告
    const report = benchmark.generateReport()
    // console.log('📋 性能测试报告:', report)
    
    // 保存报告
    benchmark.saveReport(report)
    
    return report
    
  } catch (error) {
    console.error('性能测试失败:', error)
    return null
  }
}

// 导出便捷函数
export const quickBenchmark = () => {
  console.log('⚡ 快速性能测试...')
  return runBenchmark()
}
