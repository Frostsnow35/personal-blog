<template>
  <div class="avatar-manager">
    <!-- 当前头像显示 -->
    <div class="current-avatar-section mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">当前头像</h3>
      <div class="flex items-center space-x-4">
        <div class="relative">
          <img 
            :src="currentAvatar" 
            :alt="profileName"
            class="w-24 h-24 rounded-full border-4 border-ocean-200 dark:border-ocean-700 shadow-lg object-cover"
          />
          <div class="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <button
              type="button"
              @click="showUploadDialog = true"
              class="opacity-0 hover:opacity-100 transition-opacity duration-200 text-white font-medium text-sm"
            >
              更换头像
            </button>
          </div>
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            点击头像或"更换头像"按钮来更新你的头像
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
            支持 JPG、PNG 格式，建议尺寸 200x200 像素以上
          </p>
        </div>
      </div>
    </div>

    <!-- 头像上传对话框 -->
    <div v-if="showUploadDialog" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">更换头像</h3>
            <button
              type="button"
              @click="closeUploadDialog"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 上传区域 -->
          <div v-if="!selectedFile" class="upload-area">
            <div
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
              class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-ocean-400 dark:hover:border-ocean-500 transition-colors"
            >
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-gray-600 dark:text-gray-400 mb-2">
                点击选择文件或拖拽文件到此处
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500">
                支持 JPG、PNG 格式，最大 5MB
              </p>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="handleFileSelect"
              class="hidden"
            />
          </div>

          <!-- 文件预览 -->
          <div v-else class="file-preview">
            <div class="mb-4">
              <img 
                :src="previewUrl" 
                alt="预览"
                class="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex space-x-3">
              <button
                type="button"
                @click="resetSelection"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                重新选择
              </button>
              <button
                type="button"
                @click="applyAvatar"
                :disabled="isProcessing"
                class="flex-1 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="isProcessing">处理中...</span>
                <span v-else>应用头像</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useProfileStore } from '../stores/profile'
import { showSuccess, showError } from '../utils/notifications'
import { http } from '../utils/http'

// Props
interface Props {
  profileName: string
}

const props = defineProps<Props>()

// Store
const profileStore = useProfileStore()

// 响应式状态
const showUploadDialog = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const isProcessing = ref(false)
const fileInput = ref<HTMLInputElement>()

// 计算属性
const currentAvatar = computed(() => profileStore.displayAvatar)

// 方法
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processSelectedFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      processSelectedFile(file)
    }
  }
}

const processSelectedFile = (file: File) => {
  // 验证文件类型
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    showError('文件格式错误', '请选择 JPG、PNG 或 WebP 格式的图片')
    return
  }

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError('文件过大', '图片大小不能超过 5MB')
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const resetSelection = () => {
  selectedFile.value = null
  previewUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const applyAvatar = async () => {
  if (!selectedFile.value) return

  try {
    isProcessing.value = true

    // 上传到后端，获取可访问的 URL
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    const res = await http.upload<{ success: boolean; data: { url: string } }>(`/admin/upload`, formData)
    const newAvatarUrl = res.data.url

    // 更新Store中的头像（使用后端返回的URL）
    profileStore.updateProfile({
      avatar: newAvatarUrl,
      avatarInfo: {
        current: newAvatarUrl,
        original: newAvatarUrl,
        thumbnail: newAvatarUrl,
        lastUpdated: new Date().toISOString()
      }
    })

    showSuccess('头像更新成功', '你的头像已经成功更新')
    closeUploadDialog()
    resetSelection()
    
  } catch (error) {
    showError('头像更新失败', '上传头像时出现错误，请重试')
    console.error('Avatar update error:', error)
  } finally {
    isProcessing.value = false
  }
}

const closeUploadDialog = () => {
  showUploadDialog.value = false
  resetSelection()
}

// 生命周期
onUnmounted(() => {
  // 清理预览URL
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<style scoped>
.avatar-manager {
  /* 组件样式 */
}

.upload-area {
  /* 上传区域样式 */
}

.file-preview {
  /* 文件预览样式 */
}

/* 响应式设计 */
@media (max-width: 640px) {
  .current-avatar-section .flex {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .current-avatar-section .flex-1 {
    margin-top: 1rem;
  }
}
</style>
