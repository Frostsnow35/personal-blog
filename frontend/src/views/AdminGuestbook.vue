<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">留言管理</h1>
        <div class="flex gap-2">
          <button
            v-for="f in filters" :key="f.value"
            @click="setFilter(f.value)"
            :class="[
              'px-3 py-1.5 rounded text-sm transition-colors',
              filter === f.value
                ? 'bg-ocean-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            ]"
          >{{ f.label }}</button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-500">暂无留言</div>
      <div v-else class="space-y-3">
        <div
          v-for="m in items" :key="m.id"
          class="card p-4"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-full bg-ocean-100 dark:bg-ocean-900 text-ocean-600 dark:text-ocean-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {{ (m.author_name || '?').slice(0, 1).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-sm flex-wrap">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ m.author_name }}</span>
                <span v-if="m.author_email" class="text-gray-400 text-xs">{{ m.author_email }}</span>
                <span v-if="m.referenced_post" class="text-xs text-ocean-600 dark:text-ocean-400">@ {{ m.referenced_post.title }}</span>
                <span v-if="m.is_approved" class="text-xs text-green-600">已通过</span>
                <span v-else class="text-xs text-amber-600">待审核</span>
                <span class="text-gray-400 text-xs ml-auto">{{ formatTime(m.created_at) }}</span>
              </div>
              <p class="mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">{{ m.content }}</p>
              <div class="mt-3 flex gap-2">
                <button
                  v-if="!m.is_approved"
                  @click="approve(m)"
                  class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                >通过</button>
                <button
                  @click="del(m)"
                  class="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                >删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > perPage" class="mt-6 flex justify-center gap-2">
        <button :disabled="page <= 1" @click="page--; load()" class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50">上一页</button>
        <span class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">{{ page }} / {{ Math.ceil(total / perPage) }}</span>
        <button :disabled="page * perPage >= total" @click="page++; load()" class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'
import { blogCache } from '../utils/cache'

interface Message {
  id: number
  author_name: string
  author_email: string | null
  content: string
  referenced_post_id: number | null
  referenced_post: { id: number; title: string; slug: string } | null
  is_approved: boolean
  created_at: string
}

const items = ref<Message[]>([])
const total = ref(0)
const page = ref(1)
const perPage = 20
const loading = ref(false)
const filter = ref<string>('')

const filters = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'false' },
  { label: '已通过', value: 'true' },
]

const setFilter = (v: string) => { filter.value = v; page.value = 1; load() }

const formatTime = (iso: string) => {
  try { return new Date(iso).toLocaleString('zh-CN') } catch { return '' }
}

const load = async () => {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: String(page.value), per_page: String(perPage) })
    if (filter.value) qs.set('is_approved', filter.value)
    const r = await http.get<any>(`/admin/guestbook/messages?${qs.toString()}`)
    if (r?.success) {
      items.value = r.data.items || []
      total.value = r.data.total || 0
    }
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
}

const approve = async (m: Message) => {
  if (!confirm(`通过 "${m.author_name}" 的留言？`)) return
  try {
    const r = await http.put<any>(`/admin/guestbook/messages/${m.id}/approve`)
    if (r?.success) {
      toast.success('已通过')
      await load()
      
      try {
        blogCache.clearCommentsCache()
      } catch {
        // 缓存清理失败不影响主流程
      }
    } else {
      toast.error('操作失败', r?.message)
    }
  } catch (e: any) {
    toast.error('操作失败', e?.message)
  }
}

const del = async (m: Message) => {
  if (!confirm(`删除 "${m.author_name}" 的留言？此操作不可恢复。`)) return
  try {
    const r = await http.delete<any>(`/admin/guestbook/messages/${m.id}`)
    if (r?.success) {
      toast.success('已删除')
      await load()
      
      try {
        blogCache.clearCommentsCache()
      } catch {
        // 缓存清理失败不影响主流程
      }
    } else {
      toast.error('删除失败', r?.message)
    }
  } catch (e: any) {
    toast.error('删除失败', e?.message)
  }
}

onMounted(load)
</script>
