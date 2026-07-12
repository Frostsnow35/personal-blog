<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">🔗 友链管理</h1>
        <button @click="openCreate" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg">+ 新增友链</button>
      </div>

      <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
      <div v-else-if="!items.length" class="text-center py-10 text-gray-500">暂无友链</div>
      <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <tr>
              <th class="px-3 py-2 text-left">名称</th>
              <th class="px-3 py-2 text-left hidden md:table-cell">链接</th>
              <th class="px-3 py-2 text-left hidden lg:table-cell">邮箱</th>
              <th class="px-3 py-2 text-center">特别推荐</th>
              <th class="px-3 py-2 text-center hidden md:table-cell">排序</th>
              <th class="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in items" :key="f.id" class="border-t border-gray-200 dark:border-gray-700">
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <img v-if="f.logo_url" :src="f.logo_url" :alt="f.name" class="w-7 h-7 rounded object-cover bg-gray-100 dark:bg-gray-700" />
                  <div v-else class="w-7 h-7 rounded bg-gradient-to-br from-ocean-500 to-sea-500 flex items-center justify-center text-white text-xs font-semibold">{{ (f.name || '?').slice(0, 1) }}</div>
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{ f.name }}</span>
                </div>
              </td>
              <td class="px-3 py-2 hidden md:table-cell text-gray-500 dark:text-gray-400 truncate max-w-xs">
                <a :href="f.url" target="_blank" class="hover:text-ocean-600 hover:underline">{{ f.url }}</a>
              </td>
              <td class="px-3 py-2 hidden lg:table-cell text-gray-500 dark:text-gray-400">{{ f.email || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span v-if="f.is_featured" class="text-amber-500">⭐</span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-3 py-2 text-center hidden md:table-cell text-gray-500 dark:text-gray-400">{{ f.sort_order }}</td>
              <td class="px-3 py-2 text-right">
                <button @click="openEdit(f)" class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded mr-1">编辑</button>
                <button @click="del(f)" class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 新增/编辑 Modal -->
      <div v-if="editing !== null" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="editing = null">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ editing.id ? '编辑友链' : '新增友链' }}</h2>
          <div class="space-y-3">
            <input v-model="editing.name" placeholder="站点名称 *" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.url" placeholder="链接 URL *" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model="editing.logo_url" placeholder="Logo URL（可留空）" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <textarea v-model="editing.description" placeholder="简介" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"></textarea>
            <input v-model="editing.email" placeholder="联系邮箱（可选）" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input v-model="editing.is_featured" type="checkbox" class="w-4 h-4" />
                特别推荐
              </label>
              <input v-model.number="editing.sort_order" type="number" placeholder="排序" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button @click="editing = null" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">取消</button>
            <button @click="save" class="px-4 py-2 text-sm bg-ocean-600 hover:bg-ocean-700 text-white rounded">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'

interface FriendLink {
  id: number
  name: string
  url: string
  logo_url: string | null
  description: string | null
  email: string | null
  is_featured: boolean
  sort_order: number
}

const items = ref<FriendLink[]>([])
const loading = ref(false)
const editing = ref<any>(null)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/admin/friend-links')
    if (r?.success) items.value = r.data || []
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
}

const openCreate = () => {
  editing.value = { name: '', url: '', logo_url: '', description: '', email: '', is_featured: false, sort_order: 0 }
}

const openEdit = (f: FriendLink) => {
  editing.value = { ...f }
}

const save = async () => {
  if (!editing.value.name?.trim() || !editing.value.url?.trim()) {
    toast.warning('名称和链接必填')
    return
  }
  const payload = {
    name: editing.value.name.trim(),
    url: editing.value.url.trim(),
    logo_url: editing.value.logo_url?.trim() || null,
    description: editing.value.description?.trim() || null,
    email: editing.value.email?.trim() || null,
    is_featured: !!editing.value.is_featured,
    sort_order: editing.value.sort_order || 0
  }
  try {
    let r
    if (editing.value.id) {
      r = await http.put<any>(`/admin/friend-links/${editing.value.id}`, payload)
    } else {
      r = await http.post<any>('/admin/friend-links', payload)
    }
    if (r?.success) { editing.value = null; await load() }
    else toast.error('保存失败', r?.message)
  } catch (e: any) {
    toast.error('保存失败', e?.message)
  }
}

const del = async (f: FriendLink) => {
  if (!confirm(`删除 "${f.name}"？`)) return
  try {
    const r = await http.delete<any>(`/admin/friend-links/${f.id}`)
    if (r?.success) { toast.success('已删除'); await load() }
    else toast.error('删除失败', r?.message)
  } catch (e: any) {
    toast.error('删除失败', e?.message)
  }
}

onMounted(load)
</script>
