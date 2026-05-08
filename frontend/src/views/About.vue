<template>
  <div
    class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
  >
    <nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gradient">个人博客</h1>
          </div>
          <div class="hidden md:flex items-center space-x-8">
            <router-link to="/home" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">首页</router-link>
            <router-link to="/search" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">搜索</router-link>
            <router-link to="/archive" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">归档</router-link>
            <router-link to="/category" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">分类</router-link>
            <router-link to="/tag" class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">标签</router-link>
            <router-link to="/about" class="text-ocean-600 dark:text-ocean-400 font-medium">作者</router-link>
          </div>
        </div>
      </div>
    </nav>

    <div class="relative">
      <AmbientBackdrop />

      <div class="max-w-3xl sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl shadow-xl">
          <div class="absolute inset-0 opacity-40 dark:opacity-60 bg-[radial-gradient(1000px_circle_at_20%_0%,rgba(14,165,233,0.12),transparent_60%),radial-gradient(900px_circle_at_90%_15%,rgba(217,70,239,0.10),transparent_55%),radial-gradient(900px_circle_at_40%_110%,rgba(20,184,166,0.10),transparent_60%)]" />

          <div class="relative px-6 sm:px-10 py-10">
            <header class="text-center">
              <div class="inline-flex items-center justify-center">
                <div class="relative">
                  <div class="absolute -inset-6 rounded-full bg-gradient-to-br from-ocean-500/30 via-fuchsia-500/12 to-transparent blur-2xl"></div>
                  <div class="relative rounded-full bg-gradient-to-br from-ocean-500/70 via-sea-500/25 to-fuchsia-500/60 p-[2px]">
                    <img
                      :src="profileStore.displayAvatar"
                      :alt="profileStore.displayName"
                      class="block w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gray-100 dark:bg-gray-800 object-cover ring-1 ring-white/15"
                    />
                  </div>
                </div>
              </div>

              <div class="mt-6 text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
                {{ profileStore.displayName }}
              </div>
              <div
                class="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
              >
                {{ profileStore.displayBio }}
              </div>

              <div class="mt-6 flex items-center justify-center">
                <PublicSocialLinks :links="profileStore.publicSocialLinks" :rss-url="rssUrl" />
              </div>

              <div v-if="profileStore.profile.email || profileStore.profile.location" class="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <a v-if="profileStore.profile.email" :href="`mailto:${profileStore.profile.email}`" class="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  {{ profileStore.profile.email }}
                </a>
                <span v-if="profileStore.profile.location">{{ profileStore.profile.location }}</span>
              </div>
            </header>

            <div class="mt-10 border-t border-gray-200/70 dark:border-white/10 pt-10 space-y-12">
              <section id="about" class="scroll-mt-28">
                <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">ABOUT</div>
                <h2 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">关于我</h2>
                <div class="mt-6 prose prose-slate dark:prose-invert max-w-none" v-html="aboutHtml"></div>
              </section>

              <section v-if="profileStore.profile.skills?.length || profileStore.profile.interests?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div v-if="profileStore.profile.skills?.length" class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6">
                  <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">SKILLS</div>
                  <div class="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">擅长</div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span v-for="skill in profileStore.profile.skills" :key="skill" class="px-3 py-1 rounded-full text-sm bg-gray-100/80 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200/70 dark:border-white/10">
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div v-if="profileStore.profile.interests?.length" class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6">
                  <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">INTERESTS</div>
                  <div class="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">兴趣</div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span v-for="interest in profileStore.profile.interests" :key="interest" class="px-3 py-1 rounded-full text-sm bg-gray-100/80 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200/70 dark:border-white/10">
                      {{ interest }}
                    </span>
                  </div>
                </div>
              </section>

              <section id="works" class="scroll-mt-28">
                <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">WORKS</div>
                <div class="mt-2 flex items-end justify-between gap-6">
                  <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">精选文章</h2>
                  <router-link to="/archive" class="text-sm text-gray-600 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">查看归档</router-link>
                </div>

                <div v-if="featuredPosts.length" class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <router-link
                    v-for="p in featuredPosts"
                    :key="p.id"
                    :to="`/post/${p.slug}`"
                    class="group rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6 hover:shadow-lg transition-all"
                  >
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                      {{ p.title }}
                    </div>
                    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(p.published_at || p.created_at) }} · {{ p.read_time }} 分钟阅读
                      <span v-if="p.category" class="ml-2">· {{ p.category }}</span>
                    </div>
                    <div v-if="p.excerpt" class="mt-3 text-sm text-gray-600 dark:text-gray-300 overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                      {{ p.excerpt }}
                    </div>
                  </router-link>
                </div>
                <div v-else class="mt-6 text-sm text-gray-500 dark:text-gray-400">暂无精选文章</div>
              </section>

              <section id="latest" class="scroll-mt-28">
                <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">LATEST</div>
                <h2 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">最新文章</h2>

                <div v-if="latestPosts.length" class="mt-6 divide-y divide-gray-200/70 dark:divide-white/10">
                  <div v-for="p in latestPosts" :key="p.id" class="py-4 flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <router-link :to="`/post/${p.slug}`" class="text-gray-900 dark:text-gray-100 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                        {{ p.title }}
                      </router-link>
                      <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(p.published_at || p.created_at) }} · {{ p.read_time }} 分钟阅读
                      </div>
                    </div>
                    <div v-if="p.category" class="shrink-0 text-xs text-gray-500 dark:text-gray-400">{{ p.category }}</div>
                  </div>
                </div>
                <div v-else class="mt-6 text-sm text-gray-500 dark:text-gray-400">暂无文章</div>
              </section>

              <section id="contact" class="scroll-mt-28">
                <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">CONTACT</div>
                <h2 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">联系与合作</h2>

                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div v-if="contactHtml" class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6">
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">联系</div>
                    <div class="mt-4 prose prose-slate dark:prose-invert max-w-none" v-html="contactHtml"></div>
                  </div>
                  <div v-if="cooperationHtml" class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6">
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">合作</div>
                    <div class="mt-4 prose prose-slate dark:prose-invert max-w-none" v-html="cooperationHtml"></div>
                  </div>
                  <div v-if="!contactHtml && !cooperationHtml" class="text-sm text-gray-500 dark:text-gray-400">暂无联系与合作说明</div>
                </div>
              </section>

              <section id="notice" class="scroll-mt-28">
                <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">NOTICE</div>
                <h2 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">站点声明</h2>
                <div v-if="siteNoticeHtml" class="mt-6 prose prose-slate dark:prose-invert max-w-none" v-html="siteNoticeHtml"></div>
                <div v-else class="mt-6 text-sm text-gray-500 dark:text-gray-400">暂无站点声明</div>
              </section>

              <section class="border-t border-gray-200/70 dark:border-white/10 pt-8">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>管理</span>
                  <router-link v-if="!isAuthenticated" to="/admin-login" class="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">管理员登录</router-link>
                  <div v-else class="flex items-center gap-4">
                    <router-link to="/admin/posts" class="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">文章管理</router-link>
                    <router-link to="/profile" class="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">编辑资料</router-link>
                    <button type="button" class="hover:text-gray-900 dark:hover:text-gray-100 transition-colors" @click="logout">退出</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import PublicSocialLinks from '../components/PublicSocialLinks.vue'
import AmbientBackdrop from '../components/AmbientBackdrop.vue'
import { render_markdown_html } from '../utils/markdown'

const profileStore = useProfileStore()
const router = useRouter()
const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))

const logout = () => {
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
  } catch {}
  router.push('/home')
}

interface PublishedPost {
  id: number
  title: string
  slug: string
  excerpt: string
  category?: string
  tags: string[]
  cover_url?: string
  read_time: number
  published_at?: string
  created_at: string
}

const latestPosts = ref<PublishedPost[]>([])
const featuredPosts = ref<PublishedPost[]>([])
const rssUrl = computed(() => (import.meta.env.DEV ? 'http://localhost:5000/rss.xml' : '/rss.xml'))

const aboutHtml = computed(() => {
  const bio = profileStore.profile.bio || '这里会放置作者的自我介绍。'
  return render_markdown_html(bio)
})

const contactHtml = computed(() => {
  const md = profileStore.profile.contactMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const cooperationHtml = computed(() => {
  const md = profileStore.profile.cooperationMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const siteNoticeHtml = computed(() => {
  const md = profileStore.profile.siteNoticeMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchLatestPosts = async () => {
  try {
    const { http } = await import('../utils/http')
    const res = await http.get<any>('/posts/published?page=1&per_page=5')
    latestPosts.value = Array.isArray(res?.data?.items) ? res.data.items : []
  } catch {
    latestPosts.value = []
  }
}

const fetchFeaturedPosts = async () => {
  try {
    const slugs = (profileStore.profile.featuredSlugs || []).map(s => String(s).trim()).filter(Boolean)
    if (!slugs.length) {
      featuredPosts.value = []
      return
    }
    const { http } = await import('../utils/http')
    const res = await http.get<any>('/posts/published?page=1&per_page=1000')
    const items: PublishedPost[] = Array.isArray(res?.data?.items) ? res.data.items : []
    const map = new Map(items.map(p => [p.slug, p]))
    featuredPosts.value = slugs.map(s => map.get(s)).filter(Boolean) as PublishedPost[]
  } catch {
    featuredPosts.value = []
  }
}

onMounted(async () => {
  await profileStore.loadProfile()
  await Promise.allSettled([fetchFeaturedPosts(), fetchLatestPosts()])
})
</script>
