<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
        <div class="space-x-2">
          <button @click="showDrafts = true" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">草稿管理</button>
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
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">分类</label>
            <select v-model="form.category" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">选择分类</option>
              <option value="技术">技术</option>
              <option value="随记">随记</option>
              <option value="分享">分享</option>
              <option value="经历">经历</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">标签（最多10个，按回车添加）</label>
            <div class="tag-bubbles-container flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 min-h-[42px] focus-within:ring-2 focus-within:ring-ocean-400/50 transition-shadow">
              <span v-for="(tag, i) in tagBubbles" :key="i" class="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-ocean-100 dark:bg-ocean-900/50 text-ocean-700 dark:text-ocean-300 border border-ocean-200 dark:border-ocean-800">
                {{ tag }}
                <button type="button" @click="removeTag(i)" class="tag-remove hover:text-red-500 dark:hover:text-red-400 transition-colors leading-none text-base">&times;</button>
              </span>
              <input v-if="tagBubbles.length < 10" ref="tagInputRef" v-model="tagInputText" @keydown.enter.prevent="addTag" @keydown.,.prevent="addTag" @blur="addTagOnBlur" type="text" placeholder="输入标签..." class="tag-input flex-1 min-w-[100px] border-none bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-1"/>
            </div>
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

      <div v-if="showDrafts" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showDrafts = false">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">草稿管理</h2>
            <button @click="showDrafts = false" class="text-gray-500 hover:text-gray-700">&times;</button>
          </div>
          
          <div v-if="drafts.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
            暂无自动保存的草稿
          </div>
          
          <div v-else class="space-y-3 max-h-80 overflow-y-auto">
            <div v-for="draft in drafts" :key="draft.key" class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">{{ draft.title }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ draft.postId ? `文章ID: ${draft.postId}` : '新文章' }} · {{ formatDraftTime(draft.timestamp) }}
                  </div>
                  <div v-if="draft.isExpired" class="text-xs text-red-500 mt-1">已过期（30分钟以上）</div>
                </div>
                <div class="flex space-x-2">
                  <button @click="restoreDraft(draft)" class="px-2 py-1 text-xs bg-ocean-600 text-white rounded">恢复</button>
                  <button @click="deleteDraft(draft.key)" class="px-2 py-1 text-xs bg-red-600 text-white rounded">删除</button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="drafts.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button @click="clearAllDrafts" class="w-full py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">清除所有草稿</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../utils/http'
import { toast } from '../composables/useToast'
import { blogCache } from '../utils/cache'
import TiptapEditor from '../components/TiptapEditor.vue'
import LoadingButton from '../components/LoadingButton.vue'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id

const form = ref<any>({
  title: '', content: '', excerpt: '', status: 'draft', cover_url: '', category: '', tags: [] as string[]
})
const tagBubbles = ref<string[]>([])
const tagInputText = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)
const MAX_TAGS = 10

function addTag() {
  const t = tagInputText.value.trim()
  if (!t) return
  if (tagBubbles.value.length >= MAX_TAGS) return
  if (tagBubbles.value.includes(t)) {
    tagInputText.value = ''
    return
  }
  tagBubbles.value.push(t)
  tagInputText.value = ''
  nextTick(() => tagInputRef.value?.focus())
}

function addTagOnBlur() {
  // 只在输入框有内容时添加；空输入框不处理
  if (tagInputText.value.trim()) addTag()
}

function removeTag(index: number) {
  tagBubbles.value.splice(index, 1)
  nextTick(() => tagInputRef.value?.focus())
}
const saving = ref(false)
const showDrafts = ref(false)
const drafts = ref<any[]>([])

const loadDrafts = () => {
  drafts.value = blogCache.getAutoSaveDrafts()
}

const restoreDraft = (draft: any) => {
  const saved = localStorage.getItem(draft.key)
  if (!saved) return
  
  try {
    const data = JSON.parse(saved)
    form.value.title = data.title
    form.value.content = data.content
    form.value.excerpt = data.excerpt
    form.value.category = data.category
    tagBubbles.value = data.tagBubbles || []
    showDrafts.value = false
    toast.success('已恢复', '草稿已成功恢复')
  } catch {
    toast.error('恢复失败', '草稿数据损坏')
  }
}

const deleteDraft = (key: string) => {
  if (!confirm('确认删除此草稿？')) return
  blogCache.clearAutoSaveDraft(key)
  loadDrafts()
  toast.success('已删除', '草稿已删除')
}

const clearAllDrafts = () => {
  if (!confirm('确认清除所有草稿？此操作不可撤销。')) return
  blogCache.clearAllAutoSaveDrafts()
  drafts.value = []
  toast.success('已清除', '所有草稿已清除')
}

const formatDraftTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return date.toLocaleString()
}



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
  tagBubbles.value = d.tags || []
  checkAutoSave()
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
    form.value.tags = [...tagBubbles.value]
    if (isEdit) {
      await http.put<{ success:boolean; data:any }>(`/admin/posts/${route.params.id}`, form.value)
    } else {
      await http.post<{ success:boolean; data:{ id:number } }>(`/admin/posts`, form.value)
    }
    clearAutoSave()
    
    try {
      blogCache.clearBlogRelatedCache()
    } catch {
      // 缓存清理失败不影响主流程
    }
    
    const msg = status === 'published' ? '文章已成功发布' : '文章已成功保存'
    toast.success(status === 'published' ? '已发布' : '已保存', msg)
    
    setTimeout(() => {
      router.push('/admin/posts')
    }, 800)
  } catch (err: any) {
    toast.error('保存失败', err.message || '未知错误')
  } finally {
    saving.value = false
  }
}

const getAutoSaveKey = () => {
  const id = route.params.id || 'new'
  return `blog_post_autosave_${id}`
}

const saveToLocalStorage = () => {
  const data = {
    postId: route.params.id || null,
    title: form.value.title,
    content: form.value.content,
    excerpt: form.value.excerpt,
    category: form.value.category,
    tagBubbles: tagBubbles.value,
    timestamp: Date.now()
  }
  localStorage.setItem(getAutoSaveKey(), JSON.stringify(data))
}

const checkAutoSave = () => {
  const saved = localStorage.getItem(getAutoSaveKey())
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
        tagBubbles.value = data.tagBubbles || []
      }
    }
  } catch {
    localStorage.removeItem(getAutoSaveKey())
  }
}

const clearAutoSave = () => {
  localStorage.removeItem(getAutoSaveKey())
}

const handleAutoSave = () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = window.setTimeout(saveToLocalStorage, 3000)
}

watch(showDrafts, (val) => {
  if (val) {
    loadDrafts()
  }
})

onMounted(() => {
  load()
})

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>
