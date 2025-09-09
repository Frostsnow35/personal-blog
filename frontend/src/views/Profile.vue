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
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">个人资料管理</h1>
          <div class="w-20"></div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="card">
        <div class="p-6">
          <!-- 头部 -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">个人资料</h2>
            <button
              v-if="isAuthenticated"
              @click="profileStore.toggleEdit"
              class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
            >
              {{ profileStore.isEditing ? '取消编辑' : '编辑资料' }}
            </button>
            <router-link
              v-else
              to="/admin-login"
              class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
            >
              管理员登录
            </router-link>
          </div>

          <!-- 编辑表单 -->
          <form v-if="profileStore.isEditing" @submit.prevent="profileStore.saveProfile" class="space-y-6">
            <!-- 基本信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">头像</label>
                <AvatarManager :profile-name="profileStore.profile.name" />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">姓名</label>
                <input
                  v-model="profileStore.profile.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">个人简介</label>
              <textarea
                v-model="profileStore.profile.bio"
                rows="3"
                placeholder="请介绍一下你自己，比如你的专业、兴趣爱好、人生理念等..."
                maxlength="500"
                class="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              ></textarea>
              <div class="flex justify-between items-center mt-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  个人简介将显示在关于页面和资料卡片中
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ (profileStore.profile.bio || '').length }}/500
                </span>
              </div>
            </div>

            <!-- 联系信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">邮箱</label>
                <input
                  v-model="profileStore.profile.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">位置</label>
                <input
                  v-model="profileStore.profile.location"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">个人网站</label>
                <input
                  v-model="profileStore.profile.website"
                  type="url"
                  class="w-full px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
            </div>

            <!-- 社交媒体链接管理 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">社交媒体链接</label>
              <SocialLinksManager />
            </div>

            <!-- 技能管理 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">技能</label>
              <div class="flex flex-wrap gap-2 mb-3">
                <span 
                  v-for="skill in profileStore.profile.skills" 
                  :key="skill"
                  class="px-3 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{{ skill }}</span>
                  <button
                    @click="profileStore.removeSkill(skill)"
                    type="button"
                    class="text-ocean-600 hover:text-ocean-800"
                  >
                    ×
                  </button>
                </span>
              </div>
              <div class="flex space-x-2">
                <input
                  v-model="newSkill"
                  type="text"
                  placeholder="添加新技能"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
                <button
                  @click="addSkill"
                  type="button"
                  class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            <!-- 兴趣管理 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">兴趣</label>
              <div class="flex flex-wrap gap-2 mb-3">
                <span 
                  v-for="interest in profileStore.profile.interests" 
                  :key="interest"
                  class="px-3 py-1 bg-sea-100 dark:bg-sea-900/30 text-sea-800 dark:text-sea-200 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{{ interest }}</span>
                  <button
                    @click="profileStore.removeInterest(interest)"
                    type="button"
                    class="text-sea-600 hover:text-sea-800"
                  >
                    ×
                  </button>
                </span>
              </div>
              <div class="flex space-x-2">
                <input
                  v-model="newInterest"
                  type="text"
                  placeholder="添加新兴趣"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
                <button
                  @click="addInterest"
                  type="button"
                  class="px-4 py-2 bg-sea-600 hover:bg-sea-700 text-white rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            <!-- 其他信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">教育背景</label>
                <input
                  v-model="profileStore.profile.education"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">职业</label>
                <input
                  v-model="profileStore.profile.occupation"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                />
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="profileStore.cancelEdit"
                type="button"
                class="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="profileStore.isLoading"
                class="px-6 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {{ profileStore.isLoading ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>

          <!-- 只读显示 -->
          <div v-else class="space-y-6">
            <!-- 基本信息 -->
            <div class="flex items-center space-x-6">
              <img 
                :src="profileStore.profile.avatar" 
                :alt="profileStore.profile.name"
                class="w-24 h-24 rounded-full border-4 border-ocean-200 dark:border-ocean-700"
              />
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ profileStore.profile.name }}</h3>
                <p class="text-gray-600 dark:text-gray-400">{{ profileStore.profile.bio }}</p>
              </div>
            </div>

            <!-- 联系信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="profileStore.profile.email">
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">邮箱</h4>
                <p class="text-gray-900 dark:text-gray-100">{{ profileStore.profile.email }}</p>
              </div>
              <div v-if="profileStore.profile.location">
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">位置</h4>
                <p class="text-gray-900 dark:text-gray-100">{{ profileStore.profile.location }}</p>
              </div>
            </div>

            <!-- 网站 + 社交徽章 合并展示 -->
            <div v-if="(profileStore.profile.website) || (resolvedPublicLinks && resolvedPublicLinks.length > 0)" class="mt-2">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">链接</h4>
              <div class="flex flex-wrap gap-2">
                <a
                  v-if="profileStore.profile.website"
                  :href="profileStore.profile.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
                >
                  <span class="mr-1 text-base leading-none">🌐</span>
                  <span>{{ profileStore.profile.website }}</span>
                </a>
                <a
                  v-for="(link, idx) in resolvedPublicLinks"
                  :key="idx"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
                >
                  <span class="mr-1 text-base leading-none">{{ link.icon }}</span>
                  <span>{{ link.displayName || link.platform }}</span>
                </a>
              </div>
            </div>

            <!-- 技能 -->
            <div v-if="profileStore.profile.skills.length > 0">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">技能</h4>
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

            <!-- 兴趣 -->
            <div v-if="profileStore.profile.interests.length > 0">
              <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">兴趣</h4>
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

            <!-- 其他信息 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="profileStore.profile.education">
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">教育背景</h4>
                <p class="text-gray-900 dark:text-gray-100">{{ profileStore.profile.education }}</p>
              </div>
              <div v-if="profileStore.profile.occupation">
                <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">职业</h4>
                <p class="text-gray-900 dark:text-gray-100">{{ profileStore.profile.occupation }}</p>
              </div>
            </div>

            <!-- 更新时间 -->
            <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                最后更新: {{ formatDate(profileStore.profile.updatedAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProfileStore } from '../stores/profile'
import AvatarManager from '../components/AvatarManager.vue'
import SocialLinksManager from '../components/SocialLinksManager.vue'

const profileStore = useProfileStore()
onMounted(() => {
  profileStore.loadProfile()
})
const resolvedPublicLinks = computed(() => {
  const base = (profileStore.publicSocialLinks || []).slice()
  const hasBili = base.some(l => l.platform === 'bilibili')
  const hasGithub = base.some(l => l.platform === 'github')
  const hasEmail = base.some(l => l.platform === 'email')

  if (!hasBili) {
    base.push({
      platform: 'bilibili',
      url: 'https://space.bilibili.com/454395506?spm_id_from=333.1007.0.0',
      displayName: 'Bilibili',
      icon: '📺',
      isPublic: true
    } as any)
  }

  if (!hasGithub) {
    base.push({
      platform: 'github',
      url: 'https://github.com/username',
      displayName: 'GitHub',
      icon: '🐙',
      isPublic: true
    } as any)
  }

  if (!hasEmail && profileStore.profile.email) {
    base.push({
      platform: 'email',
      url: `mailto:${profileStore.profile.email}`,
      displayName: '邮箱',
      icon: '📧',
      isPublic: true
    } as any)
  }

  return base
})

const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))
const newSkill = ref('')
const newInterest = ref('')

const addSkill = async () => {
  if (newSkill.value.trim()) {
    try {
      profileStore.addSkill(newSkill.value.trim())
      await profileStore.saveProfile()
      newSkill.value = ''
    } catch (error) {
      // 静默处理错误
    }
  }
}

const addInterest = async () => {
  if (newInterest.value.trim()) {
    try {
      profileStore.addInterest(newInterest.value.trim())
      await profileStore.saveProfile()
      newInterest.value = ''
    } catch (error) {
      // 静默处理错误
    }
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
