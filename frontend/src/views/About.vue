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
                  <div class="absolute -inset-8 rounded-full bg-gradient-to-br from-ocean-500/25 via-fuchsia-500/10 to-sea-500/20 blur-3xl animate-pulse"></div>
                  <div class="relative rounded-full bg-gradient-to-br from-ocean-500/70 via-sea-500/25 to-fuchsia-500/60 p-[2px]">
                    <img
                      :src="profileStore.displayAvatar"
                      :alt="profileStore.displayName"
                      class="block w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gray-100 dark:bg-gray-800 object-cover ring-1 ring-white/15"
                    />
                  </div>
                </div>
              </div>

              <div class="mt-6 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-ocean-600 via-sea-500 to-fuchsia-500 bg-clip-text text-transparent">
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

            <div class="mt-10 border-t border-gray-200/70 dark:border-white/10 pt-10 space-y-16">
              <SectionHeading eyebrow="ABOUT" title="关于我" :icon="aboutIcon" />
              <section class="prose-content">
                <div class="prose prose-slate dark:prose-invert max-w-none" v-html="aboutHtml"></div>
              </section>

              <template v-if="blogContentHtml">
                <SectionHeading eyebrow="BLOG" title="博客内容" :icon="blogIcon" />
                <section class="prose-content">
                  <div class="prose prose-slate dark:prose-invert max-w-none" v-html="blogContentHtml"></div>
                </section>
              </template>

              <template v-if="philosophyHtml">
                <SectionHeading eyebrow="PHILOSOPHY" title="我的理念" :icon="philosophyIcon" />
                <section class="prose-content">
                  <div class="prose prose-slate dark:prose-invert max-w-none" v-html="philosophyHtml"></div>
                </section>
              </template>

              <template v-if="nowHtml">
                <SectionHeading eyebrow="NOW" title="我目前正在做" :icon="nowIcon" />
                <section class="rounded-xl border border-ocean-200/60 dark:border-ocean-500/20 bg-gradient-to-br from-ocean-50/80 to-sea-50/60 dark:from-ocean-500/5 dark:to-sea-500/5 backdrop-blur p-6">
                  <div class="flex items-start gap-3">
                    <div class="shrink-0 mt-1 w-2 h-2 rounded-full bg-ocean-500 animate-pulse"></div>
                    <div class="prose prose-slate dark:prose-invert max-w-none" v-html="nowHtml"></div>
                  </div>
                </section>
              </template>

              <section v-if="profileStore.profile.skills?.length || profileStore.profile.interests?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div v-if="profileStore.profile.skills?.length" class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">SKILLS</div>
                  <div class="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">擅长</div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span v-for="skill in profileStore.profile.skills" :key="skill" class="px-3 py-1 rounded-full text-sm bg-ocean-50 dark:bg-ocean-500/10 text-ocean-700 dark:text-ocean-300 border border-ocean-200/60 dark:border-ocean-500/20 hover:bg-ocean-100 dark:hover:bg-ocean-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div v-if="profileStore.profile.interests?.length" class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <div class="text-xs tracking-widest text-gray-500 dark:text-gray-400">INTERESTS</div>
                  <div class="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">兴趣</div>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span v-for="interest in profileStore.profile.interests" :key="interest" class="px-3 py-1 rounded-full text-sm bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/60 dark:border-fuchsia-500/20 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                      {{ interest }}
                    </span>
                  </div>
                </div>
              </section>

              <template v-if="contactHtml">
                <SectionHeading eyebrow="CONTACT" title="联系方式" :icon="contactIcon" />
                <section class="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-6">
                  <div class="prose prose-slate dark:prose-invert max-w-none" v-html="contactHtml"></div>
                </section>
              </template>

              <template v-if="siteNoticeHtml">
                <SectionHeading eyebrow="NOTICE" title="站点声明" :icon="noticeIcon" />
                <section class="prose-content">
                  <div class="prose prose-slate dark:prose-invert max-w-none text-sm" v-html="siteNoticeHtml"></div>
                </section>
              </template>

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
import { computed, h, onMounted } from 'vue'
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

const rssUrl = computed(() => (import.meta.env.DEV ? 'http://localhost:5000/rss.xml' : '/rss.xml'))

const aboutHtml = computed(() => {
  const bio = profileStore.profile.bio || '这里会放置作者的自我介绍。'
  return render_markdown_html(bio)
})

const blogContentHtml = computed(() => {
  const md = profileStore.profile.blogContentMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const philosophyHtml = computed(() => {
  const md = profileStore.profile.philosophyMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const nowHtml = computed(() => {
  const md = profileStore.profile.nowMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const contactHtml = computed(() => {
  const md = profileStore.profile.contactMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const siteNoticeHtml = computed(() => {
  const md = profileStore.profile.siteNoticeMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const SectionHeading = {
  props: {
    eyebrow: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String, default: '' }
  },
  setup(props: { eyebrow: string; title: string; icon: string }) {
    return () => h('div', { class: 'flex items-center gap-3' }, [
      h('div', {
        class: 'shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500/20 to-fuchsia-500/20 dark:from-ocean-500/30 dark:to-fuchsia-500/30 flex items-center justify-center',
        innerHTML: props.icon
      }),
      h('div', [
        h('div', { class: 'text-xs tracking-widest text-gray-500 dark:text-gray-400' }, props.eyebrow),
        h('h2', { class: 'mt-0.5 text-2xl font-semibold text-gray-900 dark:text-gray-100' }, props.title)
      ])
    ])
  }
}

const aboutIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ocean-500"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`
const blogIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sea-500"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>`
const philosophyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-fuchsia-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
const nowIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ocean-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
const contactIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sea-500"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
const noticeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500 dark:text-gray-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`

onMounted(async () => {
  await profileStore.loadProfile()
})
</script>

<style scoped>
.prose-content {
  padding-left: 3.5rem;
  border-left: 2px solid;
  border-image: linear-gradient(to bottom, rgba(14, 165, 233, 0.3), rgba(217, 70, 239, 0.15), transparent) 1;
}

@media (max-width: 640px) {
  .prose-content {
    padding-left: 1rem;
    border-left: 1px solid rgba(14, 165, 233, 0.2);
  }
}
</style>
