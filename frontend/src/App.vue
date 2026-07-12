<template>
  <div id="app">
    <router-view v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </router-view>
    <ThemeToggle />
    <CursorEffect v-if="showEffects" />
    <MusicPlayer v-if="showMusic" />
    <PerformanceMonitor v-if="showPerformance" />
    <TopLoadingBar />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './stores/theme'
import ThemeToggle from './components/ThemeToggle.vue'
import CursorEffect from './components/CursorEffect.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import PerformanceMonitor from './components/PerformanceMonitor.vue'
import TopLoadingBar from './components/TopLoadingBar.vue'
import ToastContainer from './components/ToastContainer.vue'

const themeStore = useThemeStore()
const route = useRoute()

const showEffects = computed(() => route.path === '/')
const showMusic = computed(() => route.path === '/')
const showPerformance = computed(() => import.meta.env.DEV)

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700;
}

.text-gradient {
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
