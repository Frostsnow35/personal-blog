<template>
  <div class="social-links-manager">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">社交媒体链接</h3>
      <button
        type="button"
        @click="showAddDialog = true"
        class="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors text-sm"
      >
        添加链接
      </button>
    </div>

    <!-- 现有链接列表 -->
    <div v-if="socialLinks.length > 0" class="space-y-3 mb-6">
      <div
        v-for="(link, index) in socialLinks"
        :key="index"
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center space-x-3">
          <span class="text-2xl">{{ link.icon }}</span>
          <div>
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ link.displayName }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ link.url }}
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span
            :class="[
              'px-2 py-1 text-xs rounded-full',
              link.isPublic 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            ]"
          >
            {{ link.isPublic ? '公开' : '私密' }}
          </span>
          <button
            type="button"
            @click="editLink(index)"
            class="p-2 text-gray-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            @click="removeLink(index)"
            class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
      <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <p class="text-lg font-medium mb-2">还没有添加社交媒体链接</p>
      <p class="text-sm">点击"添加链接"按钮来添加你的社交媒体账号</p>
    </div>

    <!-- 添加/编辑链接对话框 -->
    <div v-if="showAddDialog || showEditDialog" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ isEditing ? '编辑链接' : '添加链接' }}
            </h3>
            <button
              @click="closeDialog"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveLink" class="space-y-4">
            <!-- 平台选择 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                平台 *
              </label>
              <select
                v-model="editingLink.platform"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                required
              >
                <option value="">请选择平台</option>
                <option value="github">🐙 GitHub</option>
                <option value="bilibili">📺 Bilibili</option>
                <option value="email">📧 邮箱</option>
                <option value="website">🌐 个人网站</option>
                <option value="twitter">🐦 Twitter</option>
              </select>
            </div>

            <!-- 链接地址 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                链接地址 *
              </label>
              <input
                v-model="editingLink.url"
                type="url"
                placeholder="请输入链接地址"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <!-- 显示名称 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                显示名称
              </label>
              <input
                v-model="editingLink.displayName"
                type="text"
                placeholder="显示名称"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
              />
            </div>

            <!-- 公开设置 -->
            <div class="flex items-center">
              <input
                v-model="editingLink.isPublic"
                type="checkbox"
                id="isPublic"
                class="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
              />
              <label for="isPublic" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                公开显示此链接
              </label>
            </div>

            <!-- 操作按钮 -->
            <div class="flex space-x-3 pt-4">
              <button
                type="button"
                @click="closeDialog"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="!isValidLink"
                class="flex-1 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isEditing ? '更新' : '添加' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProfileStore } from '../stores/profile'
import { toast } from '../composables/useToast'
import type { SocialLink } from '../types'

// Store
const profileStore = useProfileStore()

// 响应式状态
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingIndex = ref(-1)
const editingLink = ref<SocialLink>({
  platform: 'github',
  url: '',
  displayName: '',
  icon: '',
  isPublic: true
})

// 平台图标映射
const platformIcons = {
  github: '🐙',
  bilibili: '📺',
  email: '📧',
  website: '🌐',
  twitter: '🐦'
}

// 计算属性
const socialLinks = computed(() => profileStore.profile.socialLinks || [])
const isEditing = computed(() => showEditDialog.value)
const isValidLink = computed(() => {
  return editingLink.value.platform && editingLink.value.url.trim()
})

// 监听平台变化，自动设置图标和显示名称
watch(() => editingLink.value.platform, (newPlatform) => {
  if (newPlatform && platformIcons[newPlatform as keyof typeof platformIcons]) {
    editingLink.value.icon = platformIcons[newPlatform as keyof typeof platformIcons]
    if (!editingLink.value.displayName) {
      editingLink.value.displayName = getPlatformName(newPlatform)
    }
  }
})

// 方法
const getPlatformName = (platform: string): string => {
  const names = {
    github: 'GitHub',
    bilibili: 'Bilibili',
    email: '邮箱',
    website: '个人网站',
    twitter: 'Twitter'
  }
  return names[platform as keyof typeof names] || platform
}

const editLink = (index: number) => {
  editingIndex.value = index
  editingLink.value = { ...socialLinks.value[index] }
  showEditDialog.value = true
}

const removeLink = async (index: number) => {
  if (confirm('确定要删除这个链接吗？')) {
    try {
      const newLinks = [...socialLinks.value]
      newLinks.splice(index, 1)
      
      // 更新本地状态
      profileStore.updateProfile({ socialLinks: newLinks })
      
      // 保存到后端
      await profileStore.saveProfile()
      
      toast.success('链接已删除', '社交媒体链接已成功删除')
    } catch (error) {
      toast.error('删除失败', '删除链接时出现错误，请重试')
    }
  }
}

const saveLink = async () => {
  if (!isValidLink.value) return

  try {
    const newLinks = [...socialLinks.value]
    
    if (isEditing.value && editingIndex.value >= 0) {
      // 编辑现有链接
      newLinks[editingIndex.value] = { ...editingLink.value }
    } else {
      // 添加新链接
      newLinks.push({ ...editingLink.value })
    }
    
    // 更新本地状态
    profileStore.updateProfile({ socialLinks: newLinks })
    
    // 保存到后端
    await profileStore.saveProfile()
    
    // 显示成功消息
    if (isEditing.value) {
      toast.success('链接已更新', '社交媒体链接已成功更新')
    } else {
      toast.success('链接已添加', '新的社交媒体链接已成功添加')
    }
    
    closeDialog()
    
  } catch (error) {
    toast.error('操作失败', '保存链接时出现错误，请重试')
  }
}

const closeDialog = () => {
  showAddDialog.value = false
  showEditDialog.value = false
  editingIndex.value = -1
  editingLink.value = {
    platform: 'github',
    url: '',
    displayName: '',
    icon: '',
    isPublic: true
  }
}
</script>
