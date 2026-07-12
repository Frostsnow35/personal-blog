<template>
  <div class="min-h-screen py-10 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">相册管理</h1>
        <button @click="openCreate" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg">+ 新建相册</button>
      </div>

      <div v-if="loading" class="text-center py-10 text-gray-500">加载中…</div>
      <div v-else-if="!albums.length" class="text-center py-10 text-gray-500">暂无相册</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="a in albums" :key="a.id" class="card p-4">
          <div class="relative w-full bg-gray-200 dark:bg-gray-700 rounded mb-3" style="aspect-ratio: 4/3;">
            <img v-if="a.cover_url" :src="a.cover_url" :alt="a.name" class="absolute inset-0 w-full h-full object-cover rounded" />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400 text-3xl">📷</div>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ a.name }}</h3>
          <p v-if="a.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{{ a.description }}</p>
          <p class="text-xs text-gray-400 mt-1">📸 {{ a.photo_count }} 张</p>
          <div class="mt-3 flex gap-2 flex-wrap">
            <button @click="openEdit(a)" class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">编辑</button>
            <button @click="openManagePhotos(a)" class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded">管理照片</button>
            <button @click="del(a)" class="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">删除</button>
          </div>
        </div>
      </div>

      <!-- 新建/编辑 相册 Modal -->
      <div v-if="editing !== null" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="editing = null">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ editing.id ? '编辑相册' : '新建相册' }}</h2>
          <div class="space-y-3">
            <input v-model="editing.name" placeholder="名称 *" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <textarea v-model="editing.description" placeholder="描述" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"></textarea>
            <input v-model="editing.cover_url" placeholder="封面 URL（可留空，将自动取第一张）" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            <input v-model.number="editing.sort_order" type="number" placeholder="排序" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button @click="editing = null" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">取消</button>
            <button @click="saveAlbum" class="px-4 py-2 text-sm bg-ocean-600 hover:bg-ocean-700 text-white rounded">保存</button>
          </div>
        </div>
      </div>

      <!-- 照片管理 Modal -->
      <div v-if="photoMgr" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" @click.self="photoMgr = null">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">管理照片 - {{ photoMgr.name }}</h2>

          <!-- 上传 -->
          <div class="mb-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
            <label class="cursor-pointer block text-center">
              <input type="file" accept="image/*" multiple @change="onFilePick" class="hidden" />
              <span class="text-sm text-ocean-600 hover:text-ocean-700">📤 点击选择图片上传（可多选）</span>
              <p class="text-xs text-gray-500 mt-1">上传中… {{ uploading ? '是' : '否' }}</p>
            </label>
          </div>

          <div v-if="!photoMgr.photos?.length" class="text-center text-gray-500 py-6">暂无照片</div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <div v-for="p in photoMgr.photos" :key="p.id" class="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden group">
              <img :src="p.url" class="absolute inset-0 w-full h-full object-cover" />
              <button @click="delPhoto(p)" class="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <button @click="photoMgr = null" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">完成</button>
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

interface Album {
  id: number
  name: string
  slug: string
  description: string | null
  cover_url: string | null
  photo_count: number
}

interface Photo {
  id: number
  url: string
}

const albums = ref<Album[]>([])
const loading = ref(false)
const editing = ref<any>(null)
const photoMgr = ref<any>(null)
const uploading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await http.get<any>('/albums')
    if (r?.success) albums.value = r.data || []
  } finally { loading.value = false }
}

const openCreate = () => { editing.value = { name: '', description: '', cover_url: '', sort_order: 0 } }
const openEdit = (a: Album) => { editing.value = { id: a.id, name: a.name, description: a.description || '', cover_url: a.cover_url || '', sort_order: 0 } }

const saveAlbum = async () => {
  if (!editing.value?.name?.trim()) { toast.warning('请输入名称'); return }
  try {
    const payload = {
      name: editing.value.name,
      description: editing.value.description,
      cover_url: editing.value.cover_url,
      sort_order: editing.value.sort_order,
    }
    const r = editing.value.id
      ? await http.put<any>(`/admin/albums/${editing.value.id}`, payload)
      : await http.post<any>('/admin/albums', payload)
    if (r?.success) { editing.value = null; await load() }
    else toast.error('保存失败', r?.message)
  } catch (e: any) { toast.error('保存失败', e?.message) }
}

const del = async (a: Album) => {
  if (!confirm(`删除相册「${a.name}」？所有照片也会被删除。`)) return
  try {
    const r = await http.delete<any>(`/admin/albums/${a.id}`)
    if (r?.success) { toast.success('已删除'); await load() }
    else toast.error('删除失败', r?.message)
  } catch (e: any) { toast.error('删除失败', e?.message) }
}

const openManagePhotos = async (a: Album) => {
  try {
    const r = await http.get<any>(`/albums/${a.id}`)
    if (r?.success) photoMgr.value = r.data
  } catch (e) { console.error(e) }
}

const onFilePick = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length || !photoMgr.value) return
  uploading.value = true
  try {
    const uploaded: { url: string }[] = []
    for (const f of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', f)
      const r = await http.upload<any>('/admin/upload', fd)
      if (r?.success && r.data?.url) {
        uploaded.push({ url: r.data.url })
      }
    }
    if (uploaded.length) {
      const r2 = await http.post<any>(`/admin/albums/${photoMgr.value.id}/photos`, { photos: uploaded })
      if (r2?.success) {
        // 刷新当前相册
        const r3 = await http.get<any>(`/albums/${photoMgr.value.id}`)
        if (r3?.success) photoMgr.value = r3.data
        await load()
      }
    }
  } catch (e: any) {
    toast.error('上传失败', e?.message)
  } finally {
    uploading.value = false
    (e.target as HTMLInputElement).value = ''
  }
}

const delPhoto = async (p: Photo) => {
  if (!confirm('删除这张照片？')) return
  try {
    const r = await http.delete<any>(`/admin/photos/${p.id}`)
    if (r?.success && photoMgr.value) {
      photoMgr.value.photos = photoMgr.value.photos.filter((x: Photo) => x.id !== p.id)
    }
  } catch (e: any) { toast.error('删除失败', e?.message) }
}

onMounted(load)
</script>
