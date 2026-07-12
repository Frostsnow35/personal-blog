<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
        <div class="space-x-2">
          <LoadingButton type="button" variant="secondary" :loading="saving" loading-text="保存中" @click="save('draft')">保存草稿</LoadingButton>
          <LoadingButton type="button" variant="primary" :loading="saving" loading-text="发布中" @click="save('published')">发布</LoadingButton>
        </div>
      </div>

      <div class="card">
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">标题</label>
            <input v-model="form.title" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Slug <span class="text-xs text-gray-500">(根据标题自动生成，可手动编辑)</span></label>
            <input v-model="form.slug" type="text" maxlength="200" :disabled="!isEdit && form.title" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 font-mono text-sm" :title="form.slug" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">分类</label>
            <input v-model="form.category" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">标签（逗号分隔）</label>
            <input v-model="tagsInput" type="text" placeholder="Vue, Flask, Notes" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">封面图</label>
            <div class="flex items-center gap-3">
              <input type="file" @change="onPickCover"/>
              <span v-if="form.cover_url" class="text-sm text-gray-600 dark:text-gray-400">{{ form.cover_url }}</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">摘要</label>
            <textarea v-model="form.excerpt" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">内容（Markdown）</label>
            <TiptapEditor v-model="form.content" @save="handleAutoSave" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'
import TiptapEditor from '../components/TiptapEditor.vue'
import LoadingButton from '../components/LoadingButton.vue'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id

const form = ref<any>({
  title: '', slug: '', content: '', excerpt: '', status: 'draft', cover_url: '', category: '', tags: [] as string[]
})
const tagsInput = ref('')
const saving = ref(false)

function djb2(s: string): number {
  // 32-bit djb2 哈希，与后端 _djb2 保持一致
  let h = 5381
  const bytes = new TextEncoder().encode(s || '')
  for (const b of bytes) {
    h = ((h * 33) + b) & 0xffffffff
  }
  return h >>> 0
}

function slugify(title: string): string {
  // 与后端 _slugify 保持一致：
  // 仅保留 ASCII 字母/数字（剥离中文/全角），其他字符替为 '-'
  let base = (title || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!base) {
    // 全部为非 ASCII（如纯中文），用 djb2 哈希生成稳定的短后缀
    const h = djb2((title || '').trim())
    base = `post-${h.toString(16).padStart(6, '0')}`
  }
  if (base.length > 100) {
    base = base.slice(0, 100).replace(/-+$/, '') || 'post'
  }
  return base
}

watch(() => form.value.title, (newTitle) => {
  if (!isEdit && newTitle && !form.value.slug) {
    form.value.slug = slugify(newTitle)
  }
})

let autoSaveTimer: number | undefined

const load = async () => {
  if (!isEdit) {
    checkAutoSave()
    return
  }
  const id = Number(route.params.id)
  const res = await http.get<{ success:boolean; data:any }>(`/admin/posts/${id}`)
  const d = res.data
  form.value = { ...form.value, ...d }
  tagsInput.value = (d.tags || []).join(', ')
}

const onPickCover = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  const res = await http.upload<{ success:boolean; data:{ url:string } }>(`/admin/upload`, fd)
  form.value.cover_url = res.data.url
}

const save = async (status: 'draft'|'published') => {
  saving.value = true
  try {
    form.value.status = status
    form.value.tags = tagsInput.value.split(',').map(s => s.trim()).filter(Boolean)
    if (isEdit) {
      await http.put(`/admin/posts/${route.params.id}`, form.value)
    } else {
      const r = await http.post<{ success:boolean; data:{ id:number } }>(`/admin/posts`, form.value)
      router.replace(`/admin/posts/${r.data.id}/edit`)
    }
    clearAutoSave()
    toast.success('已保存', '文章已成功保存')
  } catch (err: any) {
    toast.error('保存失败', err.message || '未知错误')
  } finally {
    saving.value = false
  }
}

const AUTO_SAVE_KEY = 'blog_post_autosave'

const saveToLocalStorage = () => {
  const data = {
    title: form.value.title,
    content: form.value.content,
    excerpt: form.value.excerpt,
    category: form.value.category,
    tagsInput: tagsInput.value,
    timestamp: Date.now()
  }
  localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data))
}

const checkAutoSave = () => {
  const saved = localStorage.getItem(AUTO_SAVE_KEY)
  if (!saved) return
  
  try {
    const data = JSON.parse(saved)
    const age = Date.now() - data.timestamp
    if (age < 30 * 60 * 1000) {
      if (confirm('检测到未保存的草稿，是否恢复？')) {
        form.value.title = data.title
        form.value.content = data.content
        form.value.excerpt = data.excerpt
        form.value.category = data.category
        tagsInput.value = data.tagsInput
      }
    }
  } catch {
    localStorage.removeItem(AUTO_SAVE_KEY)
  }
}

const clearAutoSave = () => {
  localStorage.removeItem(AUTO_SAVE_KEY)
}

const handleAutoSave = () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = window.setTimeout(saveToLocalStorage, 3000)
}

onMounted(() => {
  load()
})

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>
