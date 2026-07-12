<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <SiteNav />

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">📬 留言栏</h1>
      <p class="text-center text-gray-500 dark:text-gray-400 mb-8">欢迎留下你的足迹，可选关联任意已发布文章</p>

      <!-- 提交表单 -->
      <div class="card p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">写一条留言</h2>
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="form.author_name"
              type="text"
              placeholder="昵称 *（不超过 32 字）"
              maxlength="32"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500"
            />
            <input
              v-model="form.author_email"
              type="email"
              placeholder="邮箱（选填）"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <select
            v-model="form.referenced_post_id"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500"
          >
            <option :value="null">📌 不关联文章（普通留言）</option>
            <option v-for="p in postOptions" :key="p.id" :value="p.id">
              @ {{ p.title }}
            </option>
          </select>
          <textarea
            v-model="form.content"
            placeholder="说点什么…（1000 字以内）"
            maxlength="1000"
            rows="5"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500"
          ></textarea>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ form.content.length }} / 1000</span>
            <button
              :disabled="submitting"
              @click="submit"
              class="px-5 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >{{ submitting ? '提交中…' : '提交留言' }}</button>
          </div>
        </div>
      </div>

      <!-- 留言列表 -->
      <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
      <div v-else-if="!messages.length" class="text-center py-12 text-gray-500 dark:text-gray-400">
        <p class="text-4xl mb-2">💭</p>
        <p>还没有留言，来说第一句吧～</p>
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="m in messages"
          :key="m.id"
          class="card p-5"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-ocean-100 dark:bg-ocean-900 text-ocean-600 dark:text-ocean-300 flex items-center justify-center text-base font-semibold flex-shrink-0">
              {{ (m.author_name || '?').slice(0, 1).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap text-sm">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ m.author_name }}</span>
                <span class="text-gray-400 text-xs">{{ formatTime(m.created_at) }}</span>
                <router-link
                  v-if="m.referenced_post"
                  :to="`/post/${m.referenced_post.slug}`"
                  class="ml-auto text-xs px-2 py-0.5 rounded-md bg-ocean-100 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 hover:bg-ocean-200"
                >@ {{ m.referenced_post.title }}</router-link>
              </div>
              <p class="mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">{{ m.content }}</p>
            </div>
          </div>
        </div>
        <div v-if="total > perPage" class="flex justify-center gap-2 pt-2">
          <button
            :disabled="page <= 1"
            @click="page--; load()"
            class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
          >上一页</button>
          <span class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">{{ page }} / {{ Math.ceil(total / perPage) }}</span>
          <button
            :disabled="page * perPage >= total"
            @click="page++; load()"
            class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
          >下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { http } from '../utils/http'
import SiteNav from '../components/SiteNav.vue'

interface Message {
  id: number
  author_name: string
  author_email: string | null
  content: string
  referenced_post_id: number | null
  referenced_post: { id: number; title: string; slug: string } | null
  created_at: string
}

const messages = ref<Message[]>([])
const total = ref(0)
const page = ref(1)
const perPage = 20
const loading = ref(false)
const submitting = ref(false)
const postOptions = ref<{ id: number; title: string; slug: string }[]>([])

const form = reactive({
  author_name: '',
  author_email: '',
  content: '',
  referenced_post_id: null as number | null,
})

const formatTime = (iso: string) => {
  try { return new Date(iso).toLocaleString('zh-CN') } catch { return '' }
}

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>(`/guestbook/messages?page=${page.value}&per_page=${perPage}`)
    if (r?.success) {
      messages.value = r.data.items || []
      total.value = r.data.total || 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadPostOptions = async () => {
  try {
    const r = await http.get<any>('/guestbook/posts-for-mention')
    if (r?.success && Array.isArray(r.data)) {
      postOptions.value = r.data
    }
  } catch (e) {
    console.error(e)
  }
}

const submit = async () => {
  if (submitting.value) return
  if (!form.author_name.trim()) {
    alert('请填写昵称')
    return
  }
  if (!form.content.trim()) {
    alert('请填写留言内容')
    return
  }
  submitting.value = true
  try {
    const r = await http.post<any>('/guestbook/messages', {
      author_name: form.author_name.trim(),
      author_email: form.author_email.trim() || null,
      content: form.content.trim(),
      referenced_post_id: form.referenced_post_id,
    })
    if (r?.success) {
      alert(r.message || '留言已提交，等待审核')
      form.content = ''
      form.referenced_post_id = null
    } else {
      alert(r?.message || '提交失败')
    }
  } catch (e: any) {
    alert(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(), loadPostOptions()])
})
</script>
