<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 导航栏 -->
    <nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link to="/home" class="flex items-center space-x-2 text-ocean-600 hover:text-ocean-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回首页</span>
          </router-link>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">管理员仪表板</h1>
          <button
            @click="logout"
            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- 文章管理 -->
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">文章管理</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">管理博客文章，包括创建、编辑、删除和发布</p>
          <div class="space-y-2">
            <router-link
              to="/admin/posts"
              class="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
            >
              查看文章列表
            </router-link>
            <router-link
              to="/admin/posts/new"
              class="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg transition-colors"
            >
              创建新文章
            </router-link>
          </div>
        </div>

                  <!-- 性能测试 -->
          <div class="card p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">性能测试</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">运行性能基准测试，监控应用性能指标</p>
            <div class="space-y-2">
              <router-link
                to="/performance-test"
                class="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg transition-colors"
              >
                🚀 运行性能测试
              </router-link>
              <button
                @click="showPerformanceMonitor"
                class="block w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-lg transition-colors"
              >
                📊 显示性能监控
              </button>
            </div>
          </div>

          <!-- 音频管理 -->
          <div class="card p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">音频管理</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">管理音频文件、播放列表和音频库</p>
            <div class="space-y-2">
              <router-link
                to="/audio-library"
                class="block w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-center rounded-lg transition-colors"
              >
                🎵 音频库
              </router-link>
            </div>
          </div>

        <!-- 系统状态 -->
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">系统状态</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">查看系统运行状态和性能指标</p>
          <div class="space-y-2">
            <button
              @click="checkSystemStatus"
              class="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg transition-colors"
            >
              检查系统状态
            </button>
            <button
              @click="exportPerformanceData"
              class="block w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-center rounded-lg transition-colors"
            >
              导出性能数据
            </button>
          </div>
        </div>

        <!-- 用户管理 -->
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">用户管理</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">管理用户账户和权限设置</p>
          <div class="space-y-2">
            <router-link
              to="/profile"
              class="block w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-center rounded-lg transition-colors"
            >
              编辑个人资料
            </router-link>
            <button
              @click="changePassword"
              class="block w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-center rounded-lg transition-colors"
            >
              修改密码
            </button>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">数据统计</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">查看博客访问统计和数据分析</p>
          <div class="space-y-2">
            <button
              @click="viewAnalytics"
              class="block w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-center rounded-lg transition-colors"
            >
              查看统计数据
            </button>
            <button
              @click="generateReport"
              class="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
            >
              生成报告
            </button>
          </div>
        </div>

        <!-- 系统设置 -->
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">系统设置</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">配置系统参数和个性化设置</p>
          <div class="space-y-2">
            <button
              @click="openSettings"
              class="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-center rounded-lg transition-colors"
            >
              打开设置
            </button>
            <button
              @click="backupData"
              class="block w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-lg transition-colors"
            >
              备份数据
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 退出登录
const logout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('auth_user')
  router.push('/home')
}

// 显示性能监控
const showPerformanceMonitor = () => {
  window.dispatchEvent(new CustomEvent('showPerformanceMonitor'))
  alert('性能监控已显示！')
}

// 检查系统状态
const checkSystemStatus = () => {
  alert('系统状态检查功能开发中...')
}

// 导出性能数据
const exportPerformanceData = () => {
  // 这里可以调用性能监控系统导出数据
  alert('性能数据导出功能开发中...')
}

// 修改密码
const changePassword = () => {
  alert('修改密码功能开发中...')
}

// 查看统计数据
const viewAnalytics = () => {
  alert('数据统计功能开发中...')
}

// 生成报告
const generateReport = () => {
  alert('报告生成功能开发中...')
}

// 打开设置
const openSettings = () => {
  alert('系统设置功能开发中...')
}

// 备份数据
const backupData = () => {
  alert('数据备份功能开发中...')
}
</script>
