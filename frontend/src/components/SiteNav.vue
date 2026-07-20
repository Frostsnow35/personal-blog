<template>
  <nav
    ref="navRef"
    class="sticky top-0 z-[100] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <h1 class="text-2xl font-bold text-gradient">个人博客</h1>
        </div>

        <!-- 桌面端菜单 -->
        <div class="hidden md:flex items-center space-x-6">
          <router-link
            v-for="item in topLevelItems"
            :key="item.path"
            :to="item.path"
            class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
            active-class="text-ocean-600 dark:text-ocean-400 font-medium"
          >{{ item.label }}</router-link>

          <!-- 百宝箱 -->
          <div
            class="relative"
          >
            <button
              type="button"
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors flex items-center gap-1"
              :class="{ 'text-ocean-600 dark:text-ocean-400 font-medium': isTreasureActive || treasureOpen }"
              @click="toggleTreasure"
            >
              百宝箱
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': treasureOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Transition name="dropdown">
              <div
                v-if="treasureOpen"
                class="absolute right-0 top-full w-48 z-50"
              >
                <div class="pt-2">
                  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2">
                    <router-link
                      to="/treasure"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >📦 百宝箱首页</router-link>
                    <router-link
                      v-for="item in treasureItems"
                      :key="item.path"
                      :to="item.path"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >{{ item.label }}</router-link>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 后台菜单 -->
          <div
            v-if="isAuthenticated"
            class="relative"
          >
            <button
              type="button"
              class="text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors flex items-center gap-1"
              :class="{ 'text-ocean-600 dark:text-ocean-400 font-medium': isAdminRoute || adminOpen }"
              @click="toggleAdmin"
            >
              后台
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': adminOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Transition name="dropdown">
              <div
                v-if="adminOpen"
                class="absolute right-0 top-full w-48 z-50"
              >
                <div class="pt-2">
                  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2">
                    <router-link
                      to="/admin/dashboard"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >📊 数据统计</router-link>
                    <router-link
                      to="/admin/posts"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >📝 文章管理</router-link>
                    <router-link
                      to="/admin/posts/new"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >➕ 新建文章</router-link>
                    <router-link
                      to="/admin/guestbook"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >💌 留言管理</router-link>
                    <router-link
                      to="/admin/albums"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >🖼 相册管理</router-link>
                    <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <router-link
                      to="/admin/security"
                      class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-ocean-50 dark:hover:bg-gray-700 hover:text-ocean-600"
                      @click="closeAll"
                    >🛡️ 安全管理</router-link>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- 移动端汉堡按钮 -->
        <button
          class="md:hidden p-2 text-gray-700 dark:text-gray-300"
          @click="mobileOpen = !mobileOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 移动端菜单 -->
      <div v-show="mobileOpen" class="md:hidden pb-4 space-y-2">
        <router-link
          v-for="item in topLevelItems"
          :key="item.path"
          :to="item.path"
          class="block py-2 text-gray-700 dark:text-gray-300 hover:text-ocean-600"
          active-class="text-ocean-600 font-medium"
          @click="mobileOpen = false"
        >{{ item.label }}</router-link>
        <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
          <div class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">百宝箱</div>
          <router-link
            v-for="item in treasureItems"
            :key="item.path"
            :to="item.path"
            class="block py-2 pl-4 text-gray-700 dark:text-gray-300 hover:text-ocean-600"
            @click="mobileOpen = false"
          >{{ item.label }}</router-link>
        </div>
        <router-link
          v-if="isAuthenticated"
          to="/admin/dashboard"
          class="block py-2 text-gray-700 dark:text-gray-300"
          @click="mobileOpen = false"
        >后台</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const navRef = ref<HTMLElement | null>(null)
const mobileOpen = ref(false)
const treasureOpen = ref(false)
const adminOpen = ref(false)

const closeAll = () => {
  treasureOpen.value = false
  adminOpen.value = false
  mobileOpen.value = false
}

const toggleTreasure = () => {
  adminOpen.value = false
  treasureOpen.value = !treasureOpen.value
}

const toggleAdmin = () => {
  treasureOpen.value = false
  adminOpen.value = !adminOpen.value
}

const handleClickOutside = (e: MouseEvent) => {
  if (navRef.value && !navRef.value.contains(e.target as Node)) {
    closeAll()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeAll()
  }
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const topLevelItems = [
  { path: '/home', label: '首页' },
  { path: '/search', label: '搜索' },
  { path: '/guestbook', label: '留言栏' },
  { path: '/albums', label: '相册' },
  { path: '/category', label: '分类' },
  { path: '/tag', label: '标签' },
  { path: '/about', label: '作者' },
]

const treasureItems = [
  { path: '/treasure/music', label: '🎵 个人喜爱音乐' },
  { path: '/treasure/movies', label: '🎬 喜爱电影' },
  { path: '/treasure/friends', label: '🔗 友链' },
  { path: '/uptime', label: '⏱️ 运行时间' },
]

const isTreasureActive = computed(() => route.path.startsWith('/treasure'))
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
