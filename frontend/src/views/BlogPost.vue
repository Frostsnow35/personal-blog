<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 导航栏 -->
    <SiteNav />

    <!-- 加载状态 -->
    <div v-if="loading" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">正在加载文章...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">文章加载失败</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <router-link 
          to="/home"
          class="inline-flex items-center px-6 py-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
        >
          返回首页
        </router-link>
      </div>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="post" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article class="card">
        <!-- 文章头部 -->
        <div class="p-8 border-b border-gray-200 dark:border-gray-700">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{{ post.title }}</h1>
          
          <!-- 文章元信息 -->
          <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div class="flex items-center space-x-4">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
                {{ formatDate(post.published_at || post.created_at) }}
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ post.read_time }} 分钟阅读
              </span>
            </div>
            
            <!-- 分类标签 -->
            <span v-if="post.category" class="px-3 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full text-xs font-medium">
              {{ post.category }}
            </span>
          </div>
          
          <!-- 标签 -->
          <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2">
            <span 
              v-for="tag in post.tags" 
              :key="tag"
              class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-ocean-100 dark:hover:bg-ocean-900/30 hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors cursor-pointer"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
        
        <!-- 文章内容 -->
        <div class="p-8">
          <div class="prose prose-lg prose-slate dark:prose-invert max-w-none leading-relaxed" ref="articleRef">
            <div v-html="formattedContent"></div>
          </div>
        </div>
        
        <!-- 互动区域 -->
        <div class="px-8 pb-8">
          <PostInteraction 
            :post-id="post.id" 
            :likes="post.likes || 0" 
            :views="post.views || 0"
            :title="post.title"
            :slug="post.slug"
          />
        </div>
      </article>

      <div class="mt-10 card p-6">
        <div class="flex items-start gap-4">
          <img
            :src="profileStore.displayAvatar"
            :alt="profileStore.displayName"
            class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700"
          />
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-gray-900 dark:text-gray-100">{{ profileStore.displayName }}</div>
            <div class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ profileStore.displayBio }}</div>
            <div class="mt-4">
              <PublicSocialLinks :links="profileStore.publicSocialLinks" :rss-url="rssUrl" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="prev_post || next_post" class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <router-link
          v-if="prev_post"
          :to="`/post/${prev_post.slug}`"
          class="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">上一篇</div>
          <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ prev_post.title }}</div>
        </router-link>
        <div v-else class="hidden md:block"></div>
        <router-link
          v-if="next_post"
          :to="`/post/${next_post.slug}`"
          class="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">下一篇</div>
          <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ next_post.title }}</div>
        </router-link>
      </div>

      <div v-if="related_posts.length" class="mt-10">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">继续阅读</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <router-link
            v-for="p in related_posts"
            :key="p.slug"
            :to="`/post/${p.slug}`"
            class="card p-5 hover:shadow-lg transition-shadow"
          >
            <div class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ p.title }}</div>
            <div v-if="p.excerpt" class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ p.excerpt }}</div>
          </router-link>
        </div>
      </div>
      
      <!-- 返回按钮 -->
      <div class="mt-8 text-center">
        <router-link 
          to="/home"
          class="inline-flex items-center px-6 py-3 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { render_markdown_html } from '../utils/markdown'
import { useProfileStore } from '../stores/profile'
import PublicSocialLinks from '../components/PublicSocialLinks.vue'
import SiteNav from '../components/SiteNav.vue'
import PostInteraction from '../components/PostInteraction.vue'

interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: string
  cover_url?: string
  category?: string
  tags: string[]
  read_time: number
  published_at?: string
  created_at: string
  updated_at: string
  views?: number
  likes?: number
}

const route = useRoute()
const profileStore = useProfileStore()
const rssUrl = computed(() => (import.meta.env.DEV ? 'http://localhost:5000/rss.xml' : '/rss.xml'))
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const articleRef = ref<HTMLElement | null>(null)
const all_posts = ref<Post[]>([])
const prev_post = ref<Post | null>(null)
const next_post = ref<Post | null>(null)
const related_posts = ref<Post[]>([])

const formattedContent = computed(() => {
  if (!post.value?.content) return ''
  return render_markdown_html(post.value.content)
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 动态设置页面标题和 meta 标签
const setPageMeta = () => {
  if (post.value) {
    document.title = `${post.value.title} - 霜雪旧曾谙的个人博客`
    
    // 设置 meta 标签
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', post.value.excerpt || post.value.content.substring(0, 160))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = post.value.excerpt || post.value.content.substring(0, 160)
      document.head.appendChild(meta)
    }
    
    // 设置 Open Graph 标签
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', post.value.title)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      meta.content = post.value.title
      document.head.appendChild(meta)
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) {
      ogDescription.setAttribute('content', post.value.excerpt || post.value.content.substring(0, 160))
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      meta.content = post.value.excerpt || post.value.content.substring(0, 160)
      document.head.appendChild(meta)
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) {
      ogUrl.setAttribute('content', window.location.href)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:url')
      meta.content = window.location.href
      document.head.appendChild(meta)
    }
  }
}

const fetchPost = async (slug: string) => {
  try {
    loading.value = true
    error.value = null

    // 预加载HTTP工具
    const { http } = await import('../utils/http')
    const result = await http.get<any>(`/posts/slug/${slug}`)

    if (result.success) {
      post.value = result.data

      // 浏览量统计：30 分钟内同 ID 不重复
      const postId = post.value?.id
      if (postId) {
        try {
          const key = 'viewed_posts'
          const raw = sessionStorage.getItem(key)
          const map: Record<string, number> = raw ? JSON.parse(raw) : {}
          const last = map[String(postId)] || 0
          if (!last || Date.now() - last > 30 * 60 * 1000) {
            map[String(postId)] = Date.now()
            sessionStorage.setItem(key, JSON.stringify(map))
            // 异步发送，不阻塞
            http.post(`/posts/${postId}/view`).catch(() => {})
          }
        } catch {}
      }

      // 并行执行元数据设置和图片优化
      await Promise.all([
        Promise.resolve().then(() => setPageMeta()),
        nextTick().then(() => enhanceContentImages())
      ])

      await fetchNavigationContext()
    } else {
      error.value = result.message || '文章不存在或未发布'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

const fetchNavigationContext = async () => {
  if (!post.value) return
  try {
    const { http } = await import('../utils/http')
    const res = await http.get<any>(`/posts/published?per_page=1000`)
    const items: Post[] = Array.isArray(res?.data?.items) ? res.data.items : []
    all_posts.value = items.slice()

    const sorted = items.slice().sort((a, b) => {
      const ad = new Date(a.published_at || a.created_at).getTime()
      const bd = new Date(b.published_at || b.created_at).getTime()
      return bd - ad
    })

    const idx = sorted.findIndex(p => p.slug === post.value?.slug)
    prev_post.value = idx >= 0 && idx + 1 < sorted.length ? sorted[idx + 1] : null
    next_post.value = idx > 0 ? sorted[idx - 1] : null

    const current_tags = new Set((post.value?.tags || []).map(t => String(t).toLowerCase()))
    const current_category = (post.value?.category || '').toLowerCase()

    const scored = sorted
      .filter(p => p.slug !== post.value?.slug)
      .map(p => {
        const tags = (p.tags || []).map(t => String(t).toLowerCase())
        const tag_hits = tags.reduce((acc, t) => acc + (current_tags.has(t) ? 1 : 0), 0)
        const category_hit = current_category && (String(p.category || '').toLowerCase() === current_category) ? 2 : 0
        const score = category_hit + tag_hits
        return { p, score }
      })
      .sort((a, b) => b.score - a.score)
      .filter(x => x.score > 0)
      .slice(0, 6)
      .map(x => x.p)

    related_posts.value = scored
  } catch {
    prev_post.value = null
    next_post.value = null
    related_posts.value = []
  }
}

onMounted(() => {
  profileStore.loadProfile()
  const slug = route.params.slug as string
  if (slug) {
    fetchPost(slug)
  }
})

// 监听路由变化
watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    fetchPost(newSlug as string)
  }
})

// 为正文中的图片统一添加懒加载与占位
const enhanceContentImages = () => {
  const root = articleRef.value
  if (!root) return
  const imgs = root.querySelectorAll('img')
  imgs.forEach(img => {
    // 占位透明像素，避免布局抖动
    if (!img.getAttribute('src')) {
      img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==')
    }
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
  })
}

// 灯箱增强：支持 Esc 关闭 与 ←/→ 切换
let articleImages: HTMLImageElement[] = []
let lightboxOverlay: HTMLDivElement | null = null
let lightboxImg: HTMLImageElement | null = null
let currentImageIndex = 0

const ensureImagesList = () => {
  const root = articleRef.value
  if (!root) return
  articleImages = Array.from(root.querySelectorAll('img'))
}

const showImageAt = (index: number) => {
  if (!lightboxImg || articleImages.length === 0) return
  const clamped = Math.max(0, Math.min(index, articleImages.length - 1))
  currentImageIndex = clamped
  const src = articleImages[clamped].src
  lightboxImg.src = src
}

const onLightboxKeydown = (e: KeyboardEvent) => {
  if (!lightboxOverlay) return
  if (e.key === 'Escape') {
    e.preventDefault()
    closeLightbox()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    showImageAt(currentImageIndex - 1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    showImageAt(currentImageIndex + 1)
  }
}

const closeLightbox = () => {
  if (!lightboxOverlay) return
  window.removeEventListener('keydown', onLightboxKeydown)
  document.body.style.overflow = ''
  document.body.removeChild(lightboxOverlay)
  lightboxOverlay = null
  lightboxImg = null
}

const openLightbox = (index: number) => {
  if (lightboxOverlay) return
  ensureImagesList()
  lightboxOverlay = document.createElement('div')
  lightboxOverlay.style.position = 'fixed'
  lightboxOverlay.style.inset = '0'
  lightboxOverlay.style.background = 'rgba(0,0,0,0.82)'
  lightboxOverlay.style.zIndex = '1000'
  lightboxOverlay.style.display = 'flex'
  lightboxOverlay.style.alignItems = 'center'
  lightboxOverlay.style.justifyContent = 'center'

  const container = document.createElement('div')
  container.style.position = 'relative'

  lightboxImg = document.createElement('img') as HTMLImageElement
  lightboxImg.style.maxWidth = '92vw'
  lightboxImg.style.maxHeight = '92vh'
  lightboxImg.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)'
  lightboxImg.style.borderRadius = '12px'
  lightboxImg.style.userSelect = 'none'
  container.appendChild(lightboxImg)

  // 关闭交互（点击背景关闭）
  lightboxOverlay.addEventListener('click', (ev) => {
    if (ev.target === lightboxOverlay) closeLightbox()
  })

  // 键盘导航
  window.addEventListener('keydown', onLightboxKeydown)
  document.body.style.overflow = 'hidden'

  lightboxOverlay.appendChild(container)
  document.body.appendChild(lightboxOverlay)
  showImageAt(index)
}

// 兼容旧调用：从被点击的元素定位索引并打开灯箱
const createLightbox = (el: HTMLImageElement) => {
  ensureImagesList()
  const idx = articleImages.findIndex(n => n === el)
  openLightbox(idx >= 0 ? idx : 0)
}

// 为正文图片绑定点击灯箱
watch(articleRef, () => {
  const root = articleRef.value
  if (!root) return
  root.querySelectorAll('img').forEach((img) => {
    img.style.cursor = 'zoom-in'
    if (!(img as any)._lightboxBound) {
      ;(img as any)._lightboxBound = true
      img.addEventListener('click', () => createLightbox(img as HTMLImageElement))
    }
  })
})
</script>

