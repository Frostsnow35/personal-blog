<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 导航栏 -->
    <nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <img 
              src="/avatar.jpg" 
              alt="霜雪旧曾谙"
              class="w-10 h-10 rounded-full border-2 border-ocean-200 dark:border-ocean-700"
            />
            <div>
              <h1 class="text-xl font-bold text-gradient">性能测试中心</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">优化前的基准数据收集</p>
            </div>
          </div>
          
          <router-link 
            to="/home" 
            class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
          >
            返回首页
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧测试控制面板 -->
        <div class="lg:col-span-1">
          <div class="card p-6">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">测试控制</h2>
            
            <div class="space-y-4">
              <button
                @click="runFullBenchmark"
                :disabled="isRunning"
                class="w-full bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {{ isRunning ? '测试中...' : '🚀 运行完整测试' }}
              </button>
              
              <button
                @click="runQuickBenchmark"
                :disabled="isRunning"
                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {{ isRunning ? '测试中...' : '⚡ 快速测试' }}
              </button>
              
              <button
                @click="clearResults"
                class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                🗑️ 清除结果
              </button>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-2">测试说明</h3>
              <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 完整测试：包含所有性能指标</li>
                <li>• 快速测试：基础性能检查</li>
                <li>• 测试结果会保存到本地存储</li>
                <li>• 建议在优化前后都运行测试</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- 右侧测试结果 -->
        <div class="lg:col-span-2">
          <div class="card p-6">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">测试结果</h2>
            
            <div v-if="isRunning" class="text-center py-8">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto mb-4"></div>
              <p class="text-gray-600 dark:text-gray-400">正在运行性能测试...</p>
            </div>
            
            <div v-else-if="testResults" class="space-y-6">
              <!-- 测试概览 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="text-2xl font-bold text-ocean-600">{{ testResults.metrics?.fps?.avg || 0 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">FPS</div>
                </div>
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">{{ testResults.metrics?.threejs_render?.avg || 0 }}ms</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Three.js</div>
                </div>
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="text-2xl font-bold text-purple-600">{{ testResults.metrics?.data_loading?.avg || 0 }}ms</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">数据加载</div>
                </div>
                <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="text-2xl font-bold text-orange-600">{{ testResults.metrics?.component_PostCard?.avg || 0 }}ms</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">组件渲染</div>
                </div>
              </div>
              
              <!-- 详细指标 -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">详细指标</h3>
                
                <div v-for="(metric, key) in testResults.metrics" :key="key" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ getMetricName(key) }}</span>
                    <span class="text-sm text-gray-500">{{ metric.samples }} 次测试</span>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500">平均值:</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100 ml-2">{{ metric.avg }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">最小值:</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100 ml-2">{{ metric.min }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">最大值:</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100 ml-2">{{ metric.max }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 内存使用 -->
              <div v-if="testResults.memory" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">内存使用</h3>
                <div class="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">已用堆内存:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100 ml-2">{{ formatBytes(testResults.memory.usedJSHeapSize) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">总堆内存:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100 ml-2">{{ formatBytes(testResults.memory.totalJSHeapSize) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">堆内存限制:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100 ml-2">{{ formatBytes(testResults.memory.jsHeapSizeLimit) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 优化建议 -->
              <div v-if="testResults.recommendations?.length" class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 class="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">优化建议</h3>
                <ul class="space-y-2">
                  <li v-for="(rec, index) in testResults.recommendations" :key="index" class="flex items-start">
                    <span class="text-yellow-600 mr-2">💡</span>
                    <span class="text-yellow-800 dark:text-yellow-200">{{ rec }}</span>
                  </li>
                </ul>
              </div>
              
              <!-- 测试信息 -->
              <div class="text-sm text-gray-500 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                测试时间: {{ new Date(testResults.timestamp).toLocaleString() }}<br>
                总耗时: {{ testResults.totalDuration.toFixed(2) }}ms
              </div>
            </div>
            
            <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
              <div class="text-6xl mb-4">📊</div>
              <p>还没有测试结果</p>
              <p class="text-sm mt-2">点击左侧按钮开始性能测试</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { runBenchmark, quickBenchmark } from '../utils/performance-benchmark'

const isRunning = ref(false)
const testResults = ref<any>(null)

// 运行完整测试
const runFullBenchmark = async () => {
  isRunning.value = true
  try {
    const results = await runBenchmark()
    testResults.value = results
    console.log('完整测试完成:', results)
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    isRunning.value = false
  }
}

// 运行快速测试
const runQuickBenchmark = async () => {
  isRunning.value = true
  try {
    const results = await quickBenchmark()
    testResults.value = results
    console.log('快速测试完成:', results)
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    isRunning.value = false
  }
}

// 清除结果
const clearResults = () => {
  testResults.value = null
  localStorage.removeItem('performance-benchmark')
}

// 获取指标名称
const getMetricName = (key: string) => {
  const names: Record<string, string> = {
    'threejs_render': 'Three.js 渲染',
    'data_loading': '数据加载',
    'component_PostCard': '组件渲染',
    'fps': '帧率'
  }
  return names[key] || key
}

// 格式化字节数
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 页面加载时检查是否有保存的测试结果
onMounted(() => {
  const saved = localStorage.getItem('performance-benchmark')
  if (saved) {
    try {
      testResults.value = JSON.parse(saved)
    } catch (error) {
      console.error('解析保存的测试结果失败:', error)
    }
  }
})
</script>
