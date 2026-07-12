<template>
  <div class="mt-10 card p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">评论 ({{ total }})</h3>

    <!-- 评论列表 -->
    <div v-if="loading" class="py-4 text-center text-gray-500 text-sm">加载中...</div>
    <div v-else-if="!items.length" class="py-4 text-center text-gray-500 text-sm">还没有评论，来抢沙发吧</div>
    <ul v-else class="space-y-5">
      <li v-for="c in items" :key="c.id" class="border-b border-gray-100 dark:border-gray-800 pb-5 last:border-b-0">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-ocean-100 dark:bg-ocean-900 text-ocean-600 dark:text-ocean-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {{ initial(c.author_name) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-sm">
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ c.author_name }}</span>
              <span class="text-gray-400 text-xs">{{ formatTime(c.created_at) }}</span>
            </div>
            <p class="mt-1 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">{{ c.content }}</p>
            <button
              v-if="!replyTo || replyTo !== c.id"
              @click="replyTo = c.id; replyToName = c.author_name"
              class="mt-2 text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
            >回复</button>
            <button
              v-else
              @click="replyTo = null; replyToName = ''"
              class="mt-2 text-xs text-gray-500 hover:underline"
            >取消回复</button>
          </div>
        </div>
        <!-- 嵌套回复 -->
        <ul v-if="c.replies && c.replies.length" class="mt-4 ml-12 space-y-3">
          <li v-for="r in c.replies" :key="r.id" class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xs flex-shrink-0">
              {{ initial(r.author_name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ r.author_name }}</span>
                <span class="text-gray-400 text-xs">{{ formatTime(r.created_at) }}</span>
              </div>
              <p class="mt-1 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">{{ r.content }}</p>
            </div>
          </li>
        </ul>
      </li>
    </ul>

    <!-- 评论表单 -->
    <form class="mt-6 space-y-3" @submit.prevent="submit">
      <div v-if="replyTo" class="text-xs text-ocean-600 dark:text-ocean-400">
        回复 @{{ replyToName }}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          v-model="form.author_name"
          type="text"
          placeholder="昵称（必填，最多 32 字符）"
          maxlength="32"
          required
          class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
        />
        <input
          v-model="form.author_email"
          type="email"
          placeholder="邮箱（可选，不公开）"
          maxlength="120"
          class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
        />
      </div>
      <textarea
        v-model="form.content"
        placeholder="说点什么吧..."
        rows="3"
        maxlength="1000"
        required
        class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
      ></textarea>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>{{ form.content.length }} / 1000</span>
        <button
          type="submit"
          :disabled="submitting"
          class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
        >
          {{ submitting ? '提交中...' : '提交评论' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Comment {
  id: number
  post_id: number
  parent_id: number | null
  author_name: string
  content: string
  created_at: string
  replies: Comment[]
}

const props = defineProps<{ slug: string; title?: string }>()
const route = useRoute()

const items = ref<Comment[]>([])
const total = ref(0)
const loading = ref(false)
const submitting = ref(false)
const replyTo = ref<number | null>(null)
const replyToName = ref('')
const form = ref({ author_name: '', author_email: '', content: '', parent_id: null as number | null })

const initial = (name: string) => (name || '?').slice(0, 1).toUpperCase()

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso)
    const now = Date.now()
    const diff = (now - d.getTime()) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
    return d.toLocaleDateString('zh-CN')
  } catch { return '' }
}

const postIdFromSlug = async (): Promise<number | null> => {
  // 通过 slug 解析 postId：使用全局 path 或者从父组件传入
  // 这里我们通过 slug 调接口获取
  try {
    const { http } = await import('../utils/http')
    const r = await http.get<any>(`/posts/slug/${props.slug.replace(/^\/post\//, '')}`)
    return r?.data?.id ?? null
  } catch {
    return null
  }
}

const fetchComments = async (postId: number) => {
  loading.value = true
  try {
    const { http } = await import('../utils/http')
    const r = await http.get<any>(`/posts/${postId}/comments?page=1&per_page=20`)
    if (r?.success) {
      items.value = r.data.items || []
      total.value = r.data.total || 0
    }
  } catch {} finally { loading.value = false }
}

const submit = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    const postId = await postIdFromSlug()
    if (!postId) {
      alert('文章信息获取失败')
      return
    }
    const payload: any = {
      author_name: form.value.author_name.trim(),
      author_email: form.value.author_email.trim() || undefined,
      content: form.value.content,
    }
    if (replyTo.value) payload.parent_id = replyTo.value
    const { http } = await import('../utils/http')
    const r = await http.post<any>(`/posts/${postId}/comments`, payload)
    if (r?.success) {
      alert('评论已提交，等待审核后显示')
      form.value = { author_name: form.value.author_name, author_email: '', content: '', parent_id: null }
      replyTo.value = null
      replyToName.value = ''
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
  const postId = await postIdFromSlug()
  if (postId) await fetchComments(postId)
})

watch(() => route.fullPath, async () => {
  const postId = await postIdFromSlug()
  if (postId) await fetchComments(postId)
})
</script>
