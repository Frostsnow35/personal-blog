<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
        <div class="space-x-2">
          <button @click="save('draft')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded">保存草稿</button>
          <button @click="save('published')" class="px-4 py-2 bg-ocean-600 text-white rounded">发布</button>
        </div>
      </div>

      <div class="card">
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <button @click="mode='edit'" :class="mode==='edit' ? 'bg-ocean-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'" class="px-3 py-1 rounded">编辑</button>
            <button @click="mode='preview'" :class="mode==='preview' ? 'bg-ocean-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'" class="px-3 py-1 rounded">预览</button>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">标题</label>
            <input v-model="form.title" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Slug</label>
              <input v-model="form.slug" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">分类</label>
              <input v-model="form.category" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
            </div>
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
            <!-- 高级编辑器（EasyMDE）占位 -->
            <div v-if="mode==='edit'">
              <textarea ref="mdeRef" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" rows="12"></textarea>
              <p v-if="!mdeReady" class="mt-2 text-xs text-gray-500 dark:text-gray-400">正在加载编辑器...（若加载失败将自动回退到简易编辑器）</p>
              <div v-if="!mdeReady" class="mt-2">
                <textarea v-model="form.content" rows="10" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"></textarea>
              </div>
            </div>
            <div v-else class="prose dark:prose-invert max-w-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-4 py-3" v-html="previewHtml"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../utils/http'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const form = ref<any>({
  title: '', slug: '', content: '', excerpt: '', status: 'draft', cover_url: '', category: '', tags: [] as string[]
})
const tagsInput = ref('')
const mode = ref<'edit'|'preview'>('edit')
const mdeRef = ref<HTMLTextAreaElement | null>(null)
let mde: any = null
const mdeReady = ref(false)

const load = async () => {
  if (!isEdit.value) return
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
  form.value.status = status
  form.value.tags = tagsInput.value.split(',').map(s => s.trim()).filter(Boolean)
  if (isEdit.value) {
    await http.put(`/admin/posts/${route.params.id}`, form.value)
  } else {
    const r = await http.post<{ success:boolean; data:{ id:number } }>(`/admin/posts`, form.value)
    router.replace(`/admin/posts/${r.data.id}/edit`)
  }
  alert('保存成功')
}

onMounted(load)

// 轻量 Markdown 预览（无外部依赖）：先转义，再做基本替换
const escapeHtml = (s: string) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const renderMarkdown = (md: string) => {
  let html = escapeHtml(md || '')
  // 代码块 ```
  html = html.replace(/```([\s\S]*?)```/g, (_m, p1) => `<pre><code>${p1}</code></pre>`)
  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  // 粗体 **text** 和 斜体 *text*
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  // 标题 # ## ###
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  // 无序列表
  html = html.replace(/^(?:-\s.+(?:\r?\n)?)+/gm, (block) => {
    const items = block.trim().split(/\r?\n/).map(li => li.replace(/^-\s+/, '')).map(li => `<li>${li}</li>`).join('')
    return `<ul>${items}</ul>`
  })
  // 段落
  html = html.replace(/^(?!<h\d>|<ul>|<pre>|<\/)(.+)$/gm, '<p>$1</p>')
  // 链接 http(s)
  html = html.replace(/(https?:\/\/[^\s)]+)(?=\s|$)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  return html
}

const previewHtml = computed(() => renderMarkdown(form.value.content || ''))

// 动态加载 EasyMDE（零安装，无打包风险）：CDN 注入
onMounted(async () => {
  try {
    // 跳过 SSR 场景
    if (typeof window === 'undefined') return
    // 已存在则跳过
    if (!document.getElementById('easymde-css')) {
      const link = document.createElement('link')
      link.id = 'easymde-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/easymde/dist/easymde.min.css'
      document.head.appendChild(link)
    }
    // Font Awesome（用于 EasyMDE 工具栏图标）
    if (!document.getElementById('fa-css')) {
      const fa = document.createElement('link')
      fa.id = 'fa-css'
      fa.rel = 'stylesheet'
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
      document.head.appendChild(fa)
    }
    if (!(window as any).EasyMDE) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/easymde/dist/easymde.min.js'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('加载 EasyMDE 失败'))
        document.body.appendChild(script)
      })
    }
    if (mdeRef.value) {
      const EasyMDE = (window as any).EasyMDE
      mde = new EasyMDE({
        element: mdeRef.value,
        autosave: { enabled: false },
        spellChecker: false,
        placeholder: '在此输入内容（支持 Markdown）',
        initialValue: form.value.content || '',
        autoDownloadFontAwesome: false
      })
      mde.codemirror.on('change', () => {
        form.value.content = mde.value()
      })
      mdeReady.value = true
    }
  } catch (e) {
    mdeReady.value = false
  }
})
</script>


