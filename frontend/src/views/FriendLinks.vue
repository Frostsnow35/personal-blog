<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">🔗 友链</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">感谢每一段相遇</p>

      <!-- 申请提示 -->
      <div v-if="contactEmail" class="card p-5 mb-8 bg-gradient-to-r from-ocean-50 to-sea-50 dark:from-gray-800 dark:to-gray-800 border border-ocean-200 dark:border-ocean-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">📨 申请友链</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          如果你也想交换友链，请发送邮件至
          <a :href="`mailto:${contactEmail}`" class="text-ocean-600 dark:text-ocean-400 font-medium hover:underline">{{ contactEmail }}</a>
          ，附上：站点名称、链接、Logo、简介。
        </p>
      </div>

      <!-- 特别推荐 -->
      <div v-if="featured.length" class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>⭐ 特别推荐</span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a v-for="f in featured" :key="f.id" :href="f.url" target="_blank" rel="noopener" class="card p-4 hover:shadow-xl transition-all group flex items-center gap-3">
            <img v-if="f.logo_url" :src="f.logo_url" :alt="f.name" class="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700" />
            <div v-else class="w-12 h-12 rounded-lg bg-gradient-to-br from-ocean-500 to-sea-500 flex items-center justify-center text-white font-semibold">{{ (f.name || '?').slice(0, 1) }}</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ f.name }}</h3>
              <p v-if="f.description" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{{ f.description }}</p>
            </div>
          </a>
        </div>
      </div>

      <!-- 全部 -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">所有友链</h2>
        <div v-if="loading" class="text-center py-8 text-gray-500">加载中…</div>
        <div v-else-if="!all.length" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>暂无友链</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a v-for="f in all" :key="f.id" :href="f.url" target="_blank" rel="noopener" class="card p-4 hover:shadow-xl transition-all group flex items-center gap-3">
            <img v-if="f.logo_url" :src="f.logo_url" :alt="f.name" class="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-700" />
            <div v-else class="w-12 h-12 rounded-lg bg-gradient-to-br from-ocean-500 to-sea-500 flex items-center justify-center text-white font-semibold">{{ (f.name || '?').slice(0, 1) }}</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ f.name }}</h3>
              <p v-if="f.description" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{{ f.description }}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

const all = ref<Friend[]>([])
const loading = ref(false)
const contactEmail = ref('')

const featured = computed(() => all.value.filter(f => f.is_featured))

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/friend-links')
    if (r?.success) all.value = r.data || []
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
