<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />
    
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-ocean-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-4">
          🗃️ 百宝箱
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-lg">
          收集我喜爱的一切，记录生活中的美好瞬间
        </p>
      </div>

      <div class="mb-8">
        <BlogUptime />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link
          to="/treasure/music"
          class="card p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div class="flex flex-col items-center text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-10 h-10 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">🎵 个人喜爱音乐</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">分享我收藏的音乐，感受旋律的魅力</p>
          </div>
        </router-link>

        <router-link
          to="/treasure/movies"
          class="card p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div class="flex flex-col items-center text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">🎬 喜爱电影</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">记录看过的好电影，回味精彩剧情</p>
          </div>
        </router-link>

        <router-link
          to="/treasure/friends"
          class="card p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div class="flex flex-col items-center text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">🔗 友链</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">友情链接，连接志同道合的朋友</p>
          </div>
        </router-link>
      </div>

      <div class="mt-8 card p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📊 博客统计</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-2xl font-bold text-ocean-600 dark:text-ocean-400">{{ stats.totalPosts }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">文章数</div>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{{ stats.totalDrafts }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">草稿数</div>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ stats.totalComments }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">留言数</div>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-2xl font-bold text-pink-600 dark:text-pink-400">{{ stats.totalAlbums }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">相册数</div>
          </div>
        </div>
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

onMounted(async () => {
  await loadStats()
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark .card {
  background: rgba(31, 41, 55, 0.5);
  border-color: rgba(255, 255, 255, 0.05);
}

.card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>