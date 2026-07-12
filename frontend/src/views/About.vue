<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <SiteNav />

    <div class="max-w-3xl sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="relative">
        <div class="absolute -inset-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-xl blur opacity-30 dark:opacity-20"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg">
          <div class="px-6 sm:px-10 py-10">
            <header class="text-center pb-8 border-b border-gray-100/80 dark:border-gray-700/80">
              <div class="relative inline-block">
                <div class="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-purple-400/20 rounded-full blur-xl"></div>
                <img
                  :src="profileStore.displayAvatar"
                  :alt="profileStore.displayName"
                  class="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200 dark:bg-gray-700 object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
              </div>

              <div class="mt-6 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
                {{ profileStore.displayName }}
              </div>
              <div class="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {{ profileStore.displayBio }}
              </div>

              <div class="mt-6 flex items-center justify-center">
                <PublicSocialLinks :links="profileStore.publicSocialLinks" :rss-url="rssUrl" />
              </div>

              <div v-if="profileStore.profile.email || profileStore.profile.location" class="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <a v-if="profileStore.profile.email" :href="`mailto:${profileStore.profile.email}`" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {{ profileStore.profile.email }}
                </a>
                <span v-if="profileStore.profile.location">{{ profileStore.profile.location }}</span>
              </div>
            </header>

            <div class="mt-8 space-y-10">
              <section class="group">
                <h2 class="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                  <span class="w-8 h-px bg-gradient-to-r from-blue-500 to-cyan-500"></span>
                  关于我
                </h2>
                <div class="text-gray-600 dark:text-gray-300 leading-relaxed pl-12 border-l-2 border-gray-200/60 dark:border-gray-700/60 hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-colors">
                  <span class="drop-cap">{{ profileStore.displayBio }}</span>
                </div>
              </section>

              <section class="group">
                <h2 class="text-xl font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                  <span class="w-8 h-px bg-gradient-to-r from-cyan-500 to-teal-500"></span>
                  博客内容
                </h2>
                <div class="text-gray-600 dark:text-gray-300 leading-relaxed pl-12 border-l-2 border-gray-200/60 dark:border-gray-700/60 hover:border-cyan-400/60 dark:hover:border-cyan-500/60 transition-colors">
                  <span class="drop-cap">{{ profileStore.profile.blogContentMarkdown || '这里主要记录我的技术学习笔记、项目实践经验和个人思考。涵盖前端开发、后端技术、系统设计等多个领域。' }}</span>
                </div>
              </section>

              <section class="group">
                <h2 class="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                  <span class="w-8 h-px bg-gradient-to-r from-purple-500 to-pink-500"></span>
                  我的理念
                </h2>
                <div class="text-gray-600 dark:text-gray-300 leading-relaxed pl-12 border-l-2 border-gray-200/60 dark:border-gray-700/60 hover:border-purple-400/60 dark:hover:border-purple-500/60 transition-colors">
                  <span class="drop-cap">{{ profileStore.profile.philosophyMarkdown || '坚持持续学习，相信技术的力量可以改变世界。追求简洁优雅的解决方案，注重代码质量和用户体验。' }}</span>
                </div>
              </section>

              <section class="group">
                <h2 class="text-xl font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-4 flex items-center gap-3">
                  <span class="w-8 h-px bg-gradient-to-r from-amber-500 to-orange-500"></span>
                  我目前正在做
                </h2>
                <div class="pl-12">
                  <ul class="space-y-3">
                    <li v-for="(item, index) in nowItems" :key="index" class="flex items-start gap-3 group/item">
                      <span class="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 mt-2 transition-transform group-hover/item:scale-150"></span>
                      <span class="text-gray-600 dark:text-gray-300">{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </section>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div v-if="profileStore.profile.skills?.length" class="relative group">
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="relative bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-5 border border-gray-200/60 dark:border-gray-700/60">
                    <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">擅长</div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span v-for="skill in profileStore.profile.skills" :key="skill" class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200/60 dark:border-gray-600/60 shadow-sm hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/60 hover:-translate-y-0.5 transition-all duration-200">
                        {{ skill }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="profileStore.profile.interests?.length" class="relative group">
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="relative bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-5 border border-gray-200/60 dark:border-gray-700/60">
                    <div class="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">兴趣</div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span v-for="interest in profileStore.profile.interests" :key="interest" class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200/60 dark:border-gray-600/60 shadow-sm hover:shadow-md hover:border-purple-400/60 dark:hover:border-purple-500/60 hover:-translate-y-0.5 transition-all duration-200">
                        {{ interest }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <template v-if="siteNoticeHtml">
                <section class="group">
                  <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-3">
                    <span class="w-8 h-px bg-gray-300 dark:bg-gray-600"></span>
                    站点声明
                  </h2>
                  <div class="text-gray-600 dark:text-gray-300 leading-relaxed text-sm pl-12 border-l-2 border-gray-200/60 dark:border-gray-700/60">
                    <span v-html="siteNoticeHtml"></span>
                  </div>
                </section>
              </template>

              <div class="pt-8 border-t border-gray-100/80 dark:border-gray-700/80">
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>管理</span>
                  <router-link v-if="!isAuthenticated" to="/admin-login" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">管理员登录</router-link>
                  <div v-else class="flex items-center gap-4">
                    <router-link to="/admin/posts" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">文章管理</router-link>
                    <router-link to="/profile" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">编辑资料</router-link>
                    <button type="button" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" @click="logout">退出</button>
                  </div>
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
import SiteNav from '../components/SiteNav.vue'

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

const nowItems = computed(() => {
  const md = profileStore.profile.nowMarkdown || '- 正在学习 Vue 3 和 TypeScript\n- 开发个人博客系统\n- 阅读技术书籍'
  return md.split('\n').map(line => line.replace(/^[-*+]\s*/, '').trim()).filter(Boolean)
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

<style scoped>
.drop-cap:first-letter {
  float: left;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 0.85;
  margin-right: 0.3em;
  margin-top: 0.1em;
  color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .drop-cap:first-letter {
  color: #60a5fa;
  background: linear-gradient(135deg, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
