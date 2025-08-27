<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
        <router-link to="/admin/posts/new" class="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700">新建文章</router-link>
      </div>

      <div class="card mb-6">
        <div class="p-4 flex flex-wrap gap-3 items-center">
          <input v-model="q" type="text" placeholder="搜索标题/摘要/内容" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-72"/>
          <select v-model="status" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
          <button @click="load()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">查询</button>
        </div>
      </div>

      <div class="card">
        <div class="p-0 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">标题</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">分类</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">更新时间</th>
                <th class="px-4 py-3"/>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              <tr v-for="p in items" :key="p.id">
                <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ p.title }}</td>
                <td class="px-4 py-3">
                  <span :class="p.status==='published' ? 'text-green-600' : 'text-yellow-600'">{{ p.status }}</span>
                </td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ p.category || '-' }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ formatTime(p.updated_at) }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <router-link :to="`/admin/posts/${p.id}/edit`" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">编辑</router-link>
                  <button @click="publish(p.id)" class="px-3 py-1 bg-ocean-600 text-white rounded" v-if="p.status!=='published'">发布</button>
                  <button @click="unpublish(p.id)" class="px-3 py-1 bg-yellow-600 text-white rounded" v-else>撤回</button>
                  <button @click="remove(p.id)" class="px-3 py-1 bg-red-600 text-white rounded">删除</button>
                </td>
              </tr>
              <tr v-if="items.length===0">
                <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-4 flex justify-end items-center gap-3">
          <button :disabled="page<=1" @click="page--; load()" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50">上一页</button>
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ page }}/{{ pages }}</span>
          <button :disabled="page>=pages" @click="page++; load()" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import { useRouter } from 'vue-router'

const items = ref<any[]>([])
const page = ref(1)
const pages = ref(1)
const q = ref('')
const status = ref('')
const router = useRouter()

const load = async () => {
  const res = await http.get<{ data: { items:any[]; total:number; page:number; pages:number } }>(`/admin/posts?page=${page.value}&per_page=10&q=${encodeURIComponent(q.value)}&status=${status.value}`)
  items.value = res.data.items
  pages.value = res.data.pages
}

const publish = async (id: number) => {
  await http.post(`/admin/posts/${id}/publish`)
  await load()
}

const unpublish = async (id: number) => {
  await http.post(`/admin/posts/${id}/unpublish`)
  await load()
}

const remove = async (id: number) => {
  if (!confirm('确认删除该文章？')) return
  await http.delete(`/admin/posts/${id}`)
  await load()
}

const formatTime = (iso: string) => new Date(iso).toLocaleString()

onMounted(load)
</script>


