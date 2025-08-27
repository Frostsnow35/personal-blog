import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'

// 加载状态管理工具
export class LoadingManager {
  private static instance: LoadingManager
  private loadingStates: Map<string, boolean> = new Map()
  private listeners: Set<(key: string, loading: boolean) => void> = new Set()
  
  private constructor() {}
  
  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager()
    }
    return LoadingManager.instance
  }
  
  // 设置加载状态
  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading)
    this.notifyListeners(key, loading)
  }
  
  // 获取加载状态
  getLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }
  
  // 检查是否有任何加载状态
  hasAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading)
  }
  
  // 获取所有加载状态
  getAllLoadingStates(): Map<string, boolean> {
    return new Map(this.loadingStates)
  }
  
  // 添加监听器
  addListener(listener: (key: string, loading: boolean) => void) {
    this.listeners.add(listener)
  }
  
  // 移除监听器
  removeListener(listener: (key: string, loading: boolean) => void) {
    this.listeners.delete(listener)
  }
  
  // 通知所有监听器
  private notifyListeners(key: string, loading: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(key, loading)
      } catch (error) {
        console.error('Loading listener error:', error)
      }
    })
  }
  
  // 批量设置加载状态
  setBatchLoading(states: Record<string, boolean>) {
    Object.entries(states).forEach(([key, loading]) => {
      this.setLoading(key, loading)
    })
  }
  
  // 清除所有加载状态
  clearAll() {
    this.loadingStates.clear()
    this.notifyListeners('all', false)
  }
  
  // 获取加载状态摘要
  getLoadingSummary(): { total: number; loading: number; completed: number } {
    const states = Array.from(this.loadingStates.values())
    const total = states.length
    const loading = states.filter(state => state).length
    const completed = total - loading
    
    return { total, loading, completed }
  }
}

// 导出单例实例
export const loadingManager = LoadingManager.getInstance()

// 便捷函数
export const setLoading = (key: string, loading: boolean) => {
  loadingManager.setLoading(key, loading)
}

export const getLoading = (key: string): boolean => {
  return loadingManager.getLoading(key)
}

export const hasAnyLoading = (): boolean => {
  return loadingManager.hasAnyLoading()
}

// Vue 组合式函数
export function useLoading() {
  const loadingStates = ref<Map<string, boolean>>(new Map())
  
  const setLoading = (key: string, loading: boolean) => {
    loadingManager.setLoading(key, loading)
  }
  
  const getLoading = (key: string): boolean => {
    return loadingManager.getLoading(key)
  }
  
  const isLoading = computed(() => loadingManager.hasAnyLoading())
  
  // 监听加载状态变化
  onMounted(() => {
    const listener = (key: string, loading: boolean) => {
      loadingStates.value.set(key, loading)
    }
    
    loadingManager.addListener(listener)
    
    // 初始化当前状态
    const allStates = loadingManager.getAllLoadingStates()
    loadingStates.value = new Map(allStates)
    
    onUnmounted(() => {
      loadingManager.removeListener(listener)
    })
  })
  
  return {
    loadingStates: readonly(loadingStates),
    setLoading,
    getLoading,
    isLoading
  }
}
