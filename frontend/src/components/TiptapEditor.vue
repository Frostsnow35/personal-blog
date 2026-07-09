<template>
  <div class="tiptap-editor-wrapper">
    <div class="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <button
        v-for="tool in tools"
        :key="tool.name"
        type="button"
        @click="tool.action && tool.action()"
        @mousedown.prevent
        :class="[
          'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
          tool.active ? 'bg-ocean-100 dark:bg-ocean-900/50 text-ocean-600 dark:text-ocean-400' : 'text-gray-600 dark:text-gray-400'
        ]"
        :title="tool.title"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path :d="tool.icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
      </button>
      <div class="flex-1"></div>
      <button
        @click="toggleMarkdownMode"
        :class="[
          'px-3 py-1 text-sm rounded transition-colors',
          markdownMode ? 'bg-ocean-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        ]"
      >
        {{ markdownMode ? '富文本' : 'Markdown' }}
      </button>
    </div>

    <div v-if="markdownMode" class="border border-gray-200 dark:border-gray-700 rounded-b-lg">
      <textarea
        v-model="markdownContent"
        @input="onMarkdownChange"
        class="w-full h-80 px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-none resize-none focus:outline-none font-mono text-sm"
        placeholder="在此输入 Markdown..."
      ></textarea>
    </div>

    <div v-else class="border border-gray-200 dark:border-gray-700 rounded-b-lg min-h-[320px]">
      <editor-content :editor="editor" class="prose dark:prose-invert" />
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleImageUpload"
    />

    <div v-if="saveStatus" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      {{ saveStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { http } from '../utils/http'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}>()

const editor = ref<any>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const markdownMode = ref(false)
const markdownContent = ref(props.modelValue)
const saveStatus = ref('')

const markdown = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
  }
})

const tools = computed(() => {
  if (!editor.value) return []
  return [
    { name: 'h1', title: '标题1', icon: 'M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m2 4h6m2 4H9m-8 4h10', action: () => editor.value.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.value.isActive('heading', { level: 1 }) },
    { name: 'h2', title: '标题2', icon: 'M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m2 4h6m2 4H9m-8 4h10', action: () => editor.value.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.value.isActive('heading', { level: 2 }) },
    { name: 'h3', title: '标题3', icon: 'M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m2 4h6m2 4H9m-8 4h10', action: () => editor.value.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.value.isActive('heading', { level: 3 }) },
    { name: 'bold', title: '粗体', icon: 'M14 17h5m-5 4v-5m-5 4h5m-1 5v-1a3 3 0 01-3-3H6a3 3 0 01-3-3V8a3 3 0 013-3h7a3 3 0 013 3v8a3 3 0 01-3 3h-1', action: () => editor.value.chain().focus().toggleBold().run(), active: editor.value.isActive('bold') },
    { name: 'italic', title: '斜体', icon: 'M14 17h5m-5 4v-5m-5 4h5m-1 5v-1a3 3 0 01-3-3H6a3 3 0 01-3-3V8a3 3 0 013-3h7a3 3 0 013 3v8a3 3 0 01-3 3h-1', action: () => editor.value.chain().focus().toggleItalic().run(), active: editor.value.isActive('italic') },
    { name: 'strike', title: '删除线', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', action: () => editor.value.chain().focus().toggleStrike().run(), active: editor.value.isActive('strike') },
    { name: 'bullet', title: '无序列表', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', action: () => editor.value.chain().focus().toggleBulletList().run(), active: editor.value.isActive('bulletList') },
    { name: 'numbered', title: '有序列表', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', action: () => editor.value.chain().focus().toggleOrderedList().run(), active: editor.value.isActive('orderedList') },
    { name: 'blockquote', title: '引用', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => editor.value.chain().focus().toggleBlockquote().run(), active: editor.value.isActive('blockquote') },
    { name: 'code', title: '代码', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', action: () => editor.value.chain().focus().toggleCode().run(), active: editor.value.isActive('code') },
    { name: 'codeblock', title: '代码块', icon: 'M14 5l7 7m0 0l-7 7m7-7H3', action: () => editor.value.chain().focus().toggleCodeBlock().run(), active: editor.value.isActive('codeBlock') },
    { name: 'image', title: '插入图片', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', action: () => fileInput.value?.click() },
    { name: 'link', title: '插入链接', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14', action: () => {
      const previousUrl = editor.value.getAttributes('link').href
      const url = window.prompt('请输入链接地址', previousUrl)
      if (url === null) return
      if (url === '') {
        editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, active: editor.value.isActive('link') },
    { name: 'hr', title: '分割线', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', action: () => editor.value.chain().focus().setHorizontalRule().run() },
    { name: 'undo', title: '撤销', icon: 'M3 10h10a5 5 0 015 5v2M3 10l6 6m-6-6l6-6', action: () => editor.value.chain().focus().undo().run() },
    { name: 'redo', title: '重做', icon: 'M21 10h-10a5 5 0 00-5 5v2M21 10l-6 6m6-6l-6-6', action: () => editor.value.chain().focus().redo().run() },
  ]
})

const toggleMarkdownMode = () => {
  markdownMode.value = !markdownMode.value
  if (!markdownMode.value && editor.value) {
    editor.value.commands.setContent(markdownContent.value)
  }
}

const onMarkdownChange = () => {
  emit('update:modelValue', markdownContent.value)
  emit('save')
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  saveStatus.value = '正在上传图片...'
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await http.upload<{ success: boolean; data: { url: string } }>('/admin/upload', fd)
    if (res.success && res.data?.url) {
      editor.value.chain().focus().setImage({ src: res.data.url }).run()
      saveStatus.value = '图片上传成功'
    } else {
      saveStatus.value = '图片上传失败'
    }
  } catch {
    saveStatus.value = '图片上传失败'
  }
  setTimeout(() => { saveStatus.value = '' }, 3000)
  input.value = ''
}

onMounted(() => {
  editor.value = useEditor({
    content: props.modelValue,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
      }),
      Placeholder.configure({
        placeholder: '在此输入内容...',
      }),
      Markdown.configure({
        html: true,
      }),
    ],
    onUpdate: ({ editor }) => {
      if (!markdownMode.value) {
        const markdownStorage = (editor.storage as any).markdown
        if (markdownStorage?.getMarkdown) {
          markdown.value = markdownStorage.getMarkdown()
        } else {
          markdown.value = editor.getHTML()
        }
        emit('save')
      }
    },
  })
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && !markdownMode.value) {
    const current = editor.value.getMarkdown()
    if (newValue !== current) {
      editor.value.commands.setContent(newValue)
    }
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.tiptap-editor-wrapper :deep(.ProseMirror) {
  outline: none;
  min-height: 320px;
  padding: 1rem;
  background: white;
  color: #1f2937;
}

.tiptap-editor-wrapper :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

.tiptap-editor-wrapper :deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.5em 0;
}

.tiptap-editor-wrapper :deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.5em 0;
}

.tiptap-editor-wrapper :deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: bold;
  margin: 0.5em 0;
}

.tiptap-editor-wrapper :deep(.ProseMirror p) {
  margin: 0.5em 0;
  line-height: 1.6;
}

.tiptap-editor-wrapper :deep(.ProseMirror ul, .ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.tiptap-editor-wrapper :deep(.ProseMirror blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #6b7280;
}

.tiptap-editor-wrapper :deep(.ProseMirror code) {
  background: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-family: monospace;
}

.tiptap-editor-wrapper :deep(.ProseMirror pre) {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
}

.tiptap-editor-wrapper :deep(.ProseMirror pre code) {
  background: transparent;
  padding: 0;
}

.tiptap-editor-wrapper :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5em;
}

.tiptap-editor-wrapper :deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1em 0;
}

.dark .tiptap-editor-wrapper :deep(.ProseMirror) {
  background: #111827;
  color: #f9fafb;
}

.dark .tiptap-editor-wrapper :deep(.ProseMirror code) {
  background: #374151;
}

.dark .tiptap-editor-wrapper :deep(.ProseMirror blockquote) {
  color: #9ca3af;
}
</style>
