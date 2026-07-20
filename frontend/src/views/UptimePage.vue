<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />
    
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ocean-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-4">
          ⏱️ 博客运行时间
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-lg">
          记录博客从第一篇文章发布至今的运行时长
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <BlogUptime />
      </div>

      <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-ocean-500 to-cyan-500 rounded-xl p-4 text-center text-white">
          <div class="text-3xl font-bold">{{ stats.totalPosts }}</div>
          <div class="text-sm opacity-80">已发布文章</div>
        </div>
        <div class="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-center text-white">
          <div class="text-3xl font-bold">{{ stats.totalDrafts }}</div>
          <div class="text-sm opacity-80">草稿数量</div>
        </div>
        <div class="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-center text-white">
          <div class="text-3xl font-bold">{{ stats.totalComments }}</div>
          <div class="text-sm opacity-80">审核通过留言</div>
        </div>
        <div class="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-center text-white">
          <div class="text-3xl font-bold">{{ stats.totalAlbums }}</div>
          <div class="text-sm opacity-80">相册数量</div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          🚀 感谢您的访问，期待与您一起见证博客的成长
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SiteNav from '../components/SiteNav.vue'
import BlogUptime from '../components/BlogUptime.vue'
import { http } from '../utils/http'

const stats = ref({
  totalPosts: 0,
  totalDrafts: 0,
  totalComments: 0,
  totalAlbums: 0
})

const loadStats = async () => {
  try {
    const result = await http.get<any>('/blog/stats')
    if (result.success && result.data) {
      stats.value = {
        totalPosts: result.data.total_posts || 0,
        totalDrafts: result.data.total_drafts || 0,
        totalComments: result.data.total_comments || 0,
        totalAlbums: result.data.total_albums || 0
      }
    }
  } catch {
    console.error('加载博客统计失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>