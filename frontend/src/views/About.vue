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
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">关于我</h1>
          <div class="w-20"></div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧个人信息 -->
        <div class="lg:col-span-1">
          <div class="card sticky top-24">
            <div class="p-6 text-center">
              <img 
                :src="profileStore.displayAvatar" 
                :alt="profileStore.displayName"
                class="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-ocean-200 dark:border-ocean-700"
              />
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {{ profileStore.displayName }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ profileStore.displayBio }}
              </p>
              
              <!-- 联系信息 -->
              <div class="space-y-2 text-sm">
                <div v-if="profileStore.profile.email" class="flex items-center justify-center space-x-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-400">{{ profileStore.profile.email }}</span>
                </div>
                <div v-if="profileStore.profile.location" class="flex items-center justify-center space-x-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="text-gray-600 dark:text-gray-400">{{ profileStore.profile.location }}</span>
                </div>
              </div>

              <!-- 社交链接 -->
              <div class="flex flex-wrap justify-center gap-3 mt-4">
                <!-- GitHub -->
                <a v-if="getSocialLink('github')" :href="getSocialLink('github')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="GitHub">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                
                <!-- Bilibili -->
                <a v-if="getSocialLink('bilibili')" :href="getSocialLink('bilibili')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Bilibili">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.51.556-2.769 1.56-3.773s2.262-1.524 3.773-1.56h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.147.187.227h4.267a.836.836 0 0 1 .16-.227l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .653.124.92.373.249.267.373.573.373.92 0 .347-.124.653-.373.92zM5.333 6.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.764-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 17.347V10.72l6.667 3.313z"/>
                  </svg>
                </a>
                
                <!-- Twitter/X -->
                <a v-if="getSocialLink('twitter')" :href="getSocialLink('twitter')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Twitter/X">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                
                <!-- Email -->
                <a v-if="getSocialLink('email')" :href="getSocialLink('email')?.url" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Email">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                
                <!-- Website -->
                <a v-if="profileStore.profile.website" :href="profileStore.profile.website" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="个人网站">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0-9c-2.485 0-4.5 2.015-4.5 4.5S9.515 12 12 12s4.5-2.015 4.5-4.5S14.485 3 12 3z" />
                  </svg>
                </a>
                
                <!-- QQ -->
                <a v-if="getSocialLink('qq')" :href="getSocialLink('qq')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="QQ">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 13.795 3.55 15.95c0 .975.324 1.624.324 1.624.324 1.624 1.624 1.624 1.624 1.624 0 0 .975.324 1.624.324 0 0 .975 0 1.624-.324 0 0 .975-.324 1.624-1.624 0 0 .324-.649.324-1.624 0-2.155-2.163-6.43-2.163-6.43V9.325C12.003 3.364 12.003 2 12.003 2z"/>
                  </svg>
                </a>
                
                <!-- WeChat -->
                <a v-if="getSocialLink('wechat')" :href="getSocialLink('wechat')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="微信">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.212 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.932 6.134-.5.198-.23.373-.485.524-.754.423-.766.676-1.676.676-2.688 0-4.053-3.806-7.53-8.691-7.53zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.903 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/>
                  </svg>
                </a>
                
                <!-- LinkedIn -->
                <a v-if="getSocialLink('linkedin')" :href="getSocialLink('linkedin')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="LinkedIn">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                
                <!-- YouTube -->
                <a v-if="getSocialLink('youtube')" :href="getSocialLink('youtube')?.url" target="_blank" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="YouTube">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
              <!-- 操作按钮与登录入口：独立一行避免挤占图标空间 -->
              <div class="flex flex-wrap justify-center gap-2 mt-4">
                <router-link v-if="isAuthenticated" to="/profile" class="px-3 py-1 bg-ocean-600 text-white rounded-full text-sm hover:bg-ocean-700 transition-colors">编辑资料</router-link>
                <router-link v-else to="/admin-login" class="px-3 py-1 bg-ocean-600 text-white rounded-full text-sm hover:bg-ocean-700 transition-colors">管理员登录</router-link>
                <button v-if="isAuthenticated" @click="logout" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">退出</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧详细内容 -->
        <div class="lg:col-span-2 space-y-8">
          <!-- 个人简介 -->
          <div class="card">
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">个人简介</h3>
              <div class="bg-gradient-to-r from-ocean-50 to-sea-50 dark:from-ocean-900/20 dark:to-sea-900/20 rounded-lg p-4 border border-ocean-200 dark:border-ocean-700">
                <p class="text-gray-700 dark:text-gray-200 leading-relaxed text-lg">
                  {{ profileStore.displayBio || '这个人很神秘，还没有留下个人简介...' }}
                </p>
              </div>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                我热爱技术，喜欢探索新事物，希望通过这个博客分享我的学习心得和生活感悟。
                在这里，我会记录技术学习的过程，分享有趣的发现，也会写一些关于生活、哲学和自然的思考。
              </p>
            </div>
          </div>

          <!-- 技能 -->
          <div class="card">
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">技能专长</h3>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="skill in profileStore.profile.skills" 
                  :key="skill"
                  class="px-3 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-sm"
                >
                  {{ skill }}
                </span>
              </div>
            </div>
          </div>

          <!-- 兴趣 -->
          <div class="card">
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">兴趣爱好</h3>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="interest in profileStore.profile.interests" 
                  :key="interest"
                  class="px-3 py-1 bg-sea-100 dark:bg-sea-900/30 text-sea-800 dark:text-sea-200 rounded-full text-sm"
                >
                  {{ interest }}
                </span>
              </div>
            </div>
          </div>

          <!-- 教育和工作 -->
          <div class="card">
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">教育和工作</h3>
              <div class="space-y-4">
                <div v-if="profileStore.profile.education">
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">教育背景</h4>
                  <p class="text-gray-600 dark:text-gray-400">{{ profileStore.profile.education }}</p>
                </div>
                <div v-if="profileStore.profile.occupation">
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">职业</h4>
                  <p class="text-gray-600 dark:text-gray-400">{{ profileStore.profile.occupation }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 博客介绍 -->
          <div class="card">
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">关于这个博客</h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                这个博客是我个人学习和思考的记录平台。我会在这里分享：
              </p>
              <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 mt-3 space-y-1">
                <li>技术学习笔记和心得</li>
                <li>项目开发经验和总结</li>
                <li>对生活和哲学的思考</li>
                <li>有趣的发现和感悟</li>
                <li>个人成长的心路历程</li>
              </ul>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                希望通过分享和交流，能够与志同道合的朋友一起成长，也希望能够为他人提供一些有用的信息和启发。
              </p>
              
              <!-- 性能监控链接 -->
              <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">🔧 开发者工具</h4>
                <p class="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  如果你是开发者或对技术感兴趣，可以查看博客的性能监控信息：
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    @click="showPerformanceMonitor"
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm transition-colors"
                  >
                    📊 显示性能监控
                  </button>
                  <button
                    @click="hidePerformanceMonitor"
                    class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full text-sm transition-colors"
                  >
                    🚫 隐藏性能监控
                  </button>
                  <span class="text-xs text-blue-600 dark:text-blue-400 self-center">
                    快捷键: Ctrl+Shift+P
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProfileStore } from '../stores/profile'

const profileStore = useProfileStore()
onMounted(() => {
  profileStore.loadProfile()
})
const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))

const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('auth_user')
  window.location.href = '/about'
}

const getSocialLink = (platform: 'github' | 'bilibili' | 'email' | 'website' | 'twitter' | 'qq' | 'wechat' | 'linkedin' | 'youtube') => {
  return profileStore.profile.socialLinks?.find(link => link.platform === platform)
}

// 性能监控控制函数
const showPerformanceMonitor = () => {
  // 通过URL参数触发性能监控显示
  const currentUrl = new URL(window.location.href)
  currentUrl.searchParams.set('showMonitor', 'true')
  window.history.replaceState({}, '', currentUrl.toString())
  
  // 触发性能监控显示
  window.dispatchEvent(new CustomEvent('showPerformanceMonitor'))
  
  // 显示成功提示
  alert('性能监控已显示！你也可以使用快捷键 Ctrl+Shift+P 来切换显示状态。')
}

const hidePerformanceMonitor = () => {
  // 通过URL参数触发性能监控隐藏
  const currentUrl = new URL(window.location.href)
  currentUrl.searchParams.delete('showMonitor')
  window.history.replaceState({}, '', currentUrl.toString())
  
  // 触发性能监控隐藏
  window.dispatchEvent(new CustomEvent('hidePerformanceMonitor'))
  
  alert('性能监控已隐藏！')
}
</script>
