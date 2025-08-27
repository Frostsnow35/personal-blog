import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'

// 性能监控系统
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private observers: PerformanceObserver[] = []
  private isMonitoring = false
  
  private constructor() {}
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  // 启动性能监控
  start() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.initObservers()
    this.startMetricsCollection()
    
    // console.log('🚀 性能监控已启动')
  }
  
  // 停止性能监控
  stop() {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    this.cleanupObservers()
    
    // console.log('⏹️ 性能监控已停止')
  }
  
  // 初始化性能观察器
  private initObservers() {
    if ('PerformanceObserver' in window) {
      // 监控长任务
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              // console.warn('⚠️ 检测到长任务:', entry)
              this.recordMetric('long_tasks', entry.duration)
            }
          })
        })
        
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        // console.warn('长任务监控不可用')
      }
      
      // 监控导航时间
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.recordNavigationMetrics(navEntry)
            }
          })
        })
        
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)
      } catch (e) {
        // console.warn('导航时间监控不可用')
      }
    }
  }
  
  // 记录导航指标
  private recordNavigationMetrics(navEntry: PerformanceNavigationTiming) {
    const metrics = {
      'navigation_dns': navEntry.domainLookupEnd - navEntry.domainLookupStart,
      'navigation_tcp': navEntry.connectEnd - navEntry.connectStart,
      'navigation_ttfb': navEntry.responseStart - navEntry.requestStart,
      'navigation_download': navEntry.responseEnd - navEntry.responseStart,
      'navigation_dom_ready': navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
      'navigation_load': navEntry.loadEventEnd - navEntry.loadEventStart
    }
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (value > 0) {
        this.recordMetric(key, value)
      }
    })
  }
  
  // 开始指标收集
  private startMetricsCollection() {
    // 定期收集内存使用情况
    setInterval(() => {
      this.collectMemoryMetrics()
    }, 5000)
    
    // 收集页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('visibility_change', Date.now())
    })
    
    // 收集窗口大小变化
    let resizeTimeout: number
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(() => {
        this.recordMetric('window_resize', Date.now())
      }, 250)
    })
  }
  
  // 收集内存指标
  private collectMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.recordMetric('memory_used', memory.usedJSHeapSize)
      this.recordMetric('memory_total', memory.totalJSHeapSize)
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit)
    }
  }
  
  // 测量函数执行时间
  measure(name: string, fn: () => void) {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    
    this.recordMetric(name, duration)
    return duration
  }
  
  // 异步测量
  async measureAsync(name: string, fn: () => Promise<any>) {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}_error`, duration)
      throw error
    }
  }
  
  // 记录性能指标
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // 只保留最近100个值
    if (values.length > 100) {
      values.shift()
    }
  }
  
  // 获取指标统计
  getMetricStats(name: string) {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) {
      return null
    }
    
    const sorted = [...values].sort((a, b) => a - b)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    
    return {
      name,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(avg * 100) / 100,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    }
  }
  
  // 获取所有指标
  getAllMetrics() {
    const result: Record<string, any> = {}
    
    for (const [key] of this.metrics) {
      const stats = this.getMetricStats(key)
      if (stats) {
        result[key] = stats
      }
    }
    
    return result
  }
  
  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getAllMetrics(),
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations()
    }
    
    return report
  }
  
  // 生成性能摘要
  private generateSummary() {
    const metrics = this.getAllMetrics()
    
    return {
      totalMetrics: Object.keys(metrics).length,
      criticalIssues: this.countCriticalIssues(metrics),
      performanceScore: this.calculatePerformanceScore(metrics)
    }
  }
  
  // 计算性能分数
  private calculatePerformanceScore(metrics: Record<string, any>): number {
    let score = 100
    
    // 检查关键指标
    const criticalMetrics = ['navigation_ttfb', 'navigation_dom_ready', 'long_tasks']
    
    criticalMetrics.forEach(metricName => {
      const metric = metrics[metricName]
      if (metric) {
        if (metricName === 'navigation_ttfb' && metric.avg > 600) score -= 20
        if (metricName === 'navigation_dom_ready' && metric.avg > 2000) score -= 20
        if (metricName === 'long_tasks' && metric.count > 0) score -= 30
      }
    })
    
    return Math.max(0, score)
  }
  
  // 计算关键问题数量
  private countCriticalIssues(metrics: Record<string, any>): number {
    let count = 0
    
    Object.values(metrics).forEach((metric: any) => {
      if (metric.name === 'long_tasks' && metric.count > 0) count++
      if (metric.name === 'navigation_ttfb' && metric.avg > 600) count++
      if (metric.name === 'navigation_dom_ready' && metric.avg > 2000) count++
    })
    
    return count
  }
  
  // 生成优化建议
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = this.getAllMetrics()
    
    // 基于指标生成建议
    if (metrics.long_tasks && metrics.long_tasks.count > 0) {
      recommendations.push('检测到长任务，建议优化JavaScript执行时间')
    }
    
    if (metrics.navigation_ttfb && metrics.navigation_ttfb.avg > 600) {
      recommendations.push('首字节时间过长，建议优化服务器响应速度')
    }
    
    if (metrics.memory_used && metrics.memory_used.avg > 50 * 1024 * 1024) {
      recommendations.push('内存使用较高，建议检查内存泄漏')
    }
    
    return recommendations
  }
  
  // 清理观察器
  private cleanupObservers() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
  
  // 导出数据
  exportData() {
    const data = {
      metrics: this.getAllMetrics(),
      report: this.generateReport(),
      timestamp: new Date().toISOString()
    }
    
    return data
  }
  
  // 保存到本地存储
  saveToLocalStorage() {
    try {
      const data = this.exportData()
      localStorage.setItem('performance-metrics', JSON.stringify(data))
      // console.log('📊 性能数据已保存到本地存储')
    } catch (error) {
      console.error('保存性能数据失败:', error)
    }
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()

// Vue 组合式函数
export function usePerformanceMonitor() {
  const isMonitoring = ref(false)
  const currentMetrics = ref<Record<string, any>>({})
  
  const startMonitoring = () => {
    performanceMonitor.start()
    isMonitoring.value = true
  }
  
  const stopMonitoring = () => {
    performanceMonitor.stop()
    isMonitoring.value = false
  }
  
  const getMetrics = () => {
    currentMetrics.value = performanceMonitor.getAllMetrics()
    return currentMetrics.value
  }
  
  const generateReport = () => {
    return performanceMonitor.generateReport()
  }
  
  const saveData = () => {
    performanceMonitor.saveToLocalStorage()
  }
  
  // 自动启动监控
  onMounted(() => {
    startMonitoring()
  })
  
  // 定期更新指标
  onMounted(() => {
    const interval = setInterval(() => {
      if (isMonitoring.value) {
        getMetrics()
      }
    }, 5000)
    
    onUnmounted(() => {
      clearInterval(interval)
    })
  })
  
  return {
    isMonitoring: readonly(isMonitoring),
    currentMetrics: readonly(currentMetrics),
    startMonitoring,
    stopMonitoring,
    getMetrics,
    generateReport,
    saveData
  }
}
