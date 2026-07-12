<template>
  <div class="flex flex-wrap items-center gap-3">
    <a
      v-for="link in displayLinks"
      :key="`${link.platform}-${link.url}`"
      :href="link.url"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
    >
      <span aria-hidden="true">{{ link.icon }}</span>
      <span class="whitespace-nowrap">{{ link.displayName }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SocialLink } from '../types'

const props = defineProps<{
  links: SocialLink[]
}>()

const displayLinks = computed(() => {
  const map = new Map<SocialLink['platform'], SocialLink>()
  for (const link of props.links || []) {
    if (!map.has(link.platform)) map.set(link.platform, link)
  }
  return Array.from(map.values())
})
</script>
