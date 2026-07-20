<template>
  <div class="post-interaction flex items-center gap-6 py-4 border-t border-gray-200 dark:border-gray-700">
    <button
      @click="handleLike"
      :class="[
        'flex items-center gap-2 transition-all duration-300 group',
        liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
      ]"
    >
      <svg
        :class="[
          'w-6 h-6 transition-transform duration-300',
          liked ? 'scale-110' : 'group-hover:scale-110'
        ]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          :d="liked ? 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' : 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'"
          :fill="liked ? 'currentColor' : 'none'"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
      <span class="text-sm font-medium">{{ formatNumber(likeCount) }}</span>
    </button>

    <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span class="text-sm font-medium">{{ formatNumber(views) }}</span>
    </div>

    <div class="flex-1"></div>

    <div class="flex items-center gap-3">
      <div class="relative">
        <button
          @click="showShareMenu = !showShareMenu"
          class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span class="text-sm">分享</span>
        </button>

        <div
          v-if="showShareMenu"
          class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          <div class="p-2">
            <button
              v-for="platform in sharePlatforms"
              :key="platform.name"
              @click="shareToPlatform(platform)"
              class="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" :fill="platform.color" viewBox="0 0 24 24">
                <path :d="platform.icon" />
              </svg>
              <span>{{ platform.label }}</span>
            </button>
            <hr class="my-2 border-gray-200 dark:border-gray-700" />
            <button
              @click="copyLink"
              class="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>复制链接</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showShareMenu"
    @click="showShareMenu = false"
    class="fixed inset-0 z-40"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'

const props = defineProps<{
  postId: number
  likes: number
  views: number
  title: string
}>()

const liked = ref(false)
const likeCount = ref(props.likes)
const showShareMenu = ref(false)

const sharePlatforms = [
  {
    name: 'wechat',
    label: '微信',
    color: '#07c160',
    icon: 'M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.322-1.223a.582.582 0 01.171-.655C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z'
  },
  {
    name: 'weibo',
    label: '微博',
    color: '#e6162d',
    icon: 'M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-3.224.303-6.086-.964-6.291-3.21-.206-2.252 2.353-4.229 5.577-4.532 3.223-.303 6.086.964 6.291 3.21.206 2.252-2.354 4.229-5.577 4.532zm1.048-3.099c-2.473.258-4.696-.81-4.858-2.507-.163-1.698 1.79-3.263 4.263-3.521 2.473-.258 4.696.81 4.858 2.507.163 1.698-1.79 3.263-4.263 3.521zm1.396-2.992c-.699.071-1.362-.206-1.5-.761-.138-.555.278-1.089.977-1.161.699-.072 1.362.205 1.5.761.138.555-.278 1.089-.977 1.161zm.286-2.173c-.083-.007-.166-.027-.245-.05-.078-.023-.142-.056-.195-.098-.053-.042-.09-.093-.106-.15-.016-.057-.011-.117.014-.166.025-.049.07-.086.128-.103.131-.035.287-.014.39.068.103.082.172.201.193.341.021.14.001.285-.06.402-.061.117-.162.212-.295.267-.071.028-.15.042-.231.042zm.013-1.037c-.083-.007-.166-.027-.245-.05-.078-.023-.142-.056-.195-.098-.053-.042-.09-.093-.106-.15-.016-.057-.011-.117.014-.166.025-.049.07-.086.128-.103.131-.035.287-.014.39.068.103.082.172.201.193.341.021.14.001.285-.06.402-.061.117-.162.212-.295.267-.071.028-.15.042-.231.042z'
  },
  {
    name: 'qq',
    label: 'QQ',
    color: '#12b7f5',
    icon: 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z'
  },
  {
    name: 'twitter',
    label: 'Twitter',
    color: '#1da1f2',
    icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z'
  }
]

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const handleLike = async () => {
  try {
    const res = await http.post<{ success: boolean; data: { liked: boolean; count: number } }>(`/posts/${props.postId}/like`)
    if (res.success) {
      liked.value = res.data.liked
      likeCount.value = res.data.count
    }
  } catch {
    console.error('点赞失败')
  }
}

const checkLikeStatus = async () => {
  try {
    const res = await http.get<{ success: boolean; data: { liked: boolean; count: number } }>(`/posts/${props.postId}/like`)
    if (res.success) {
      liked.value = res.data.liked
      likeCount.value = res.data.count
    }
  } catch {
    console.error('获取点赞状态失败')
  }
}

const shareToPlatform = (platform: { name: string }) => {
  const url = window.location.href
  const title = props.title
  
  let shareUrl = ''
  switch (platform.name) {
    case 'wechat':
      showShareMenu.value = false
      toast.info('分享提示', '请使用浏览器分享功能或复制链接发送给好友')
      return
    case 'weibo':
      shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
      break
    case 'qq':
      shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
      break
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      break
    default:
      return
  }
  
  window.open(shareUrl, '_blank', 'width=600,height=400')
  showShareMenu.value = false
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    showShareMenu.value = false
    toast.success('链接已复制')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = window.location.href
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showShareMenu.value = false
    toast.success('链接已复制')
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showShareMenu.value = false
  }
}

onMounted(() => {
  checkLikeStatus()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.post-interaction {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
