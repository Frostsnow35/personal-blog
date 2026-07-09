<template>
  <div class="comment-section mt-8">
    <div class="card">
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">评论</h2>
        
        <div v-if="commentsEnabled" ref="giscusContainer" class="giscus-container"></div>
        
        <div v-else-if="commentsProvider === 'off'" class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">评论功能已关闭</div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-500">感谢你的关注，欢迎通过其他方式与我交流</p>
        </div>
        
        <div v-else class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">评论功能配置未完成</div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-500">请在环境变量中配置评论系统</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps<{
  slug: string
  title: string
}>()

const giscusContainer = ref<HTMLElement | null>(null)

const commentsProvider = computed(() => import.meta.env.VITE_COMMENTS_PROVIDER || 'off')
const commentsEnabled = computed(() => commentsProvider.value === 'giscus')

const loadGiscus = () => {
  if (!commentsEnabled.value || !giscusContainer.value) return
  
  const existingScript = document.querySelector('script[src*="giscus"]')
  if (existingScript) {
    renderGiscus()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', import.meta.env.VITE_GISCUS_REPO || '')
  script.setAttribute('data-repo-id', import.meta.env.VITE_GISCUS_REPO_ID || '')
  script.setAttribute('data-category', import.meta.env.VITE_GISCUS_CATEGORY || '')
  script.setAttribute('data-category-id', import.meta.env.VITE_GISCUS_CATEGORY_ID || '')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'preferred_color_scheme')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  script.onload = renderGiscus
  script.onerror = () => {
    console.error('Giscus 加载失败')
  }
  document.body.appendChild(script)
}

const renderGiscus = () => {
  if (!giscusContainer.value) return
  
  giscusContainer.value.innerHTML = ''
  
  const iframeContainer = document.createElement('div')
  iframeContainer.className = 'giscus-frame'
  
  const giscusWidget = document.createElement('div')
  giscusWidget.setAttribute('data-giscus-widget', '')
  giscusWidget.setAttribute('data-repo', import.meta.env.VITE_GISCUS_REPO || '')
  giscusWidget.setAttribute('data-repo-id', import.meta.env.VITE_GISCUS_REPO_ID || '')
  giscusWidget.setAttribute('data-category', import.meta.env.VITE_GISCUS_CATEGORY || '')
  giscusWidget.setAttribute('data-category-id', import.meta.env.VITE_GISCUS_CATEGORY_ID || '')
  giscusWidget.setAttribute('data-mapping', 'pathname')
  giscusWidget.setAttribute('data-reactions-enabled', '1')
  giscusWidget.setAttribute('data-emit-metadata', '0')
  giscusWidget.setAttribute('data-input-position', 'bottom')
  giscusWidget.setAttribute('data-theme', 'preferred_color_scheme')
  giscusWidget.setAttribute('data-lang', 'zh-CN')
  
  iframeContainer.appendChild(giscusWidget)
  giscusContainer.value.appendChild(iframeContainer)
  
  if ((window as any).giscus) {
    (window as any).giscus.render()
  }
}

onMounted(() => {
  loadGiscus()
})

watch(() => props.slug, () => {
  if (commentsEnabled.value) {
    renderGiscus()
  }
})
</script>

<style scoped>
.comment-section {
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
