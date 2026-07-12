<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">评论管理</h1>
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

      <div v-if="loading" class="text-center py-10 text-gray-500">加载中...</div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-500">暂无评论</div>
      <div v-else class="space-y-3">
        <div
          v-for="c in items" :key="c.id"
          class="card p-4"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-full bg-ocean-100 dark:bg-ocean-900 text-ocean-600 dark:text-ocean-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {{ (c.author_name || '?').slice(0,1).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-sm flex-wrap">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ c.author_name }}</span>
                <span v-if="c.author_email" class="text-gray-400 text-xs">{{ c.author_email }}</span>
                <span class="text-gray-400 text-xs">文章 #{{ c.post_id }}</span>
                <span v-if="c.parent_id" class="text-gray-400 text-xs">回复 #{{ c.parent_id }}</span>
                <span v-if="c.is_approved" class="text-xs text-green-600">已通过</span>
                <span v-else class="text-xs text-amber-600">待审核</span>
                <span class="text-gray-400 text-xs ml-auto">{{ formatTime(c.created_at) }}</span>
              </div>
              <p class="mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">{{ c.content }}</p>
              <div class="mt-3 flex gap-2">
                <button
                  v-if="!c.is_approved"
                  @click="approve(c)"
                  class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                >通过</button>
                <button
                  @click="del(c)"
                  class="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                >删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > perPage" class="mt-6 flex justify-center gap-2">
        <button
          :disabled="page <= 1" @click="page--; load()"
          class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
        >上一页</button>
        <span class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">{{ page }} / {{ Math.ceil(total / perPage) }}</span>
        <button
          :disabled="page * perPage >= total" @click="page++; load()"
          class="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
        >下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Comment {
  id: number
  post_id: number
  parent_id: number | null
  author_name: string
  author_email: string | null
  content: string
  is_approved: boolean
  created_at: string
}

const items = ref<Comment[]>([])
const total = ref(0)
const page = ref(1)
const perPage = 20
const loading = ref(false)
const filter = ref<string>('')  // '', 'true', 'false'

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
    const { http } = await import('../utils/http')
    const qs = new URLSearchParams({ page: String(page.value), per_page: String(perPage) })
    if (filter.value) qs.set('is_approved', filter.value)
    const r = await http.get<any>(`/admin/comments?${qs.toString()}`)
    if (r?.success) {
      items.value = r.data.items || []
      total.value = r.data.total || 0
    }
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
}

const approve = async (c: Comment) => {
  if (!confirm(`确认通过评论 #${c.id}？`)) return
  try {
    const { http } = await import('../utils/http')
    const r = await http.put<any>(`/admin/comments/${c.id}/approve`, {})
    if (r?.success) { await load() } else { alert(r?.message || '操作失败') }
  } catch (e: any) { alert(e?.message || '操作失败') }
}

const del = async (c: Comment) => {
  if (!confirm(`确认删除评论 #${c.id}？此操作不可恢复`)) return
  try {
    const { http } = await import('../utils/http')
    const r = await http.delete<any>(`/admin/comments/${c.id}`)
    if (r?.success) { await load() } else { alert(r?.message || '操作失败') }
  } catch (e: any) { alert(e?.message || '操作失败') }
}

onMounted(load)
</script>
