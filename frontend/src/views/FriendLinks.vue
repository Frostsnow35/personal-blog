<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🔗 今日友链</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">每日精选 · 今日博主推荐</p>

      <!-- 申请提示 -->
      <div v-if="contactEmail" class="card p-5 mb-8 bg-gradient-to-r from-ocean-50 to-sea-50 dark:from-gray-800 dark:to-gray-800 border border-ocean-200 dark:border-ocean-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">📨 申请友链</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          如果你也想交换友链，请发送邮件至
          <a :href="`mailto:${contactEmail}`" class="text-ocean-600 dark:text-ocean-400 font-medium hover:underline">{{ contactEmail }}</a>
          ，附上：站点名称、链接、Logo、简介。
        </p>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-500">加载中…</div>
      <div v-else-if="!item" class="text-center py-16 text-gray-500 dark:text-gray-400">
        <p class="text-5xl mb-2">🔗</p>
        <p>暂无友链</p>
        <p class="text-sm mt-2">管理员可在后台添加友链</p>
      </div>
      <div v-else class="flex justify-center">
        <a :href="item.url" target="_blank" rel="noopener" class="max-w-sm w-full card p-6 hover:shadow-xl transition-all group">
          <div class="flex flex-col items-center text-center">
            <img v-if="item.logo_url" :src="item.logo_url" :alt="item.name" class="w-24 h-24 rounded-xl object-cover bg-gray-100 dark:bg-gray-700 mb-4" />
            <div v-else class="w-24 h-24 rounded-xl bg-gradient-to-br from-ocean-500 to-sea-500 flex items-center justify-center text-white text-3xl font-semibold mb-4">{{ (item.name || '?').slice(0, 1) }}</div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ item.name }}</h2>
            <p v-if="item.description" class="text-gray-500 dark:text-gray-400 mt-3">{{ item.description }}</p>
            <p class="text-sm text-gray-400 mt-2">{{ item.url }}</p>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Friend {
  id: number
  name: string
  url: string
  logo_url: string | null
  description: string | null
  is_featured: boolean
}

const item = ref<Friend | null>(null)
const loading = ref(false)
const contactEmail = ref('')

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/friend-links/daily')
    if (r?.success) item.value = r.data || null
  } finally { loading.value = false }
}

const loadEmail = async () => {
  try {
    const r = await http.get<any>('/profile')
    // /api/profile 直接返回 profile 对象（非 {success, data} 包装）
    if (r?.email) contactEmail.value = r.email
  } catch (e) { /* ignore */ }
}

onMounted(async () => {
  await Promise.all([load(), loadEmail()])
})
</script>
