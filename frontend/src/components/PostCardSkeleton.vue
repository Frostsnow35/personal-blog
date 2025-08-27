<template>
  <div class="animate-pulse space-y-4">
    <!-- 封面图片骨架 -->
    <div class="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
    
    <!-- 标题骨架 -->
    <div class="space-y-2">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
    
    <!-- 摘要骨架 -->
    <div class="space-y-2">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
    
    <!-- 标签和分类骨架 -->
    <div class="flex space-x-2">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 骨架屏组件，用于文章加载时的占位
defineOptions({
  name: 'PostCardSkeleton'
})
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
