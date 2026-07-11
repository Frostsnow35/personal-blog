<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
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

    <div class="max-w-3xl sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="px-6 sm:px-10 py-10">
          <header class="text-center pb-8 border-b border-gray-100 dark:border-gray-700">
            <img
              :src="profileStore.displayAvatar"
              :alt="profileStore.displayName"
              class="inline-block w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200 dark:bg-gray-700 object-cover"
            />

            <div class="mt-6 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {{ profileStore.displayName }}
            </div>
            <div class="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {{ profileStore.displayBio }}
            </div>

            <div class="mt-6 flex items-center justify-center">
              <PublicSocialLinks :links="profileStore.publicSocialLinks" :rss-url="rssUrl" />
            </div>

            <div v-if="profileStore.profile.email || profileStore.profile.location" class="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a v-if="profileStore.profile.email" :href="`mailto:${profileStore.profile.email}`" class="hover:text-gray-900 dark:hover:text-white">
                {{ profileStore.profile.email }}
              </a>
              <span v-if="profileStore.profile.location">{{ profileStore.profile.location }}</span>
            </div>
          </header>

          <div class="mt-8 space-y-12">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">关于我</h2>
              <div class="text-gray-600 dark:text-gray-300 leading-relaxed" v-html="aboutHtml"></div>
            </div>

            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">博客内容</h2>
              <div class="text-gray-600 dark:text-gray-300 leading-relaxed" v-html="blogContentHtml"></div>
            </div>

            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">我的理念</h2>
              <div class="text-gray-600 dark:text-gray-300 leading-relaxed" v-html="philosophyHtml"></div>
            </div>

            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">我目前正在做</h2>
              <ul class="text-gray-600 dark:text-gray-300 leading-relaxed" v-html="nowHtml"></ul>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div v-if="profileStore.profile.skills?.length" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">擅长</div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span v-for="skill in profileStore.profile.skills" :key="skill" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                    {{ skill }}
                  </span>
                </div>
              </div>

              <div v-if="profileStore.profile.interests?.length" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">兴趣</div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span v-for="interest in profileStore.profile.interests" :key="interest" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                    {{ interest }}
                  </span>
                </div>
              </div>
            </div>

            <template v-if="siteNoticeHtml">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">站点声明</h2>
                <div class="text-gray-600 dark:text-gray-300 leading-relaxed text-sm" v-html="siteNoticeHtml"></div>
              </div>
            </template>

            <div class="pt-8 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>管理</span>
                <router-link v-if="!isAuthenticated" to="/admin-login" class="hover:text-gray-900 dark:hover:text-white">管理员登录</router-link>
                <div v-else class="flex items-center gap-4">
                  <router-link to="/admin/posts" class="hover:text-gray-900 dark:hover:text-white">文章管理</router-link>
                  <router-link to="/profile" class="hover:text-gray-900 dark:hover:text-white">编辑资料</router-link>
                  <button type="button" class="hover:text-gray-900 dark:hover:text-white" @click="logout">退出</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import PublicSocialLinks from '../components/PublicSocialLinks.vue'
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
  const md = profileStore.profile.blogContentMarkdown || '这里主要记录我的技术学习笔记、项目实践经验和个人思考。涵盖前端开发、后端技术、系统设计等多个领域。'
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const philosophyHtml = computed(() => {
  const md = profileStore.profile.philosophyMarkdown || '坚持持续学习，相信技术的力量可以改变世界。追求简洁优雅的解决方案，注重代码质量和用户体验。'
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const nowHtml = computed(() => {
  const md = profileStore.profile.nowMarkdown || '- 正在学习 Vue 3 和 TypeScript\n- 开发个人博客系统\n- 阅读技术书籍'
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

const siteNoticeHtml = computed(() => {
  const md = profileStore.profile.siteNoticeMarkdown || ''
  const trimmed = String(md).trim()
  return trimmed ? render_markdown_html(trimmed) : ''
})

onMounted(async () => {
  await profileStore.loadProfile()
})
</script>
