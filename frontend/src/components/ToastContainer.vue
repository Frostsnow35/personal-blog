<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'pointer-events-auto min-w-[260px] max-w-sm rounded-lg shadow-lg border-l-4 px-4 py-3 flex items-start gap-2 backdrop-blur',
            typeClass(t.type)
          ]"
          role="alert"
        >
          <div class="shrink-0 mt-0.5">
            <svg v-if="t.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="t.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else-if="t.type === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm">{{ t.title }}</div>
            <div v-if="t.message" class="text-sm mt-0.5 opacity-90 break-words">{{ t.message }}</div>
          </div>
          <button
            v-if="t.closable"
            class="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            @click="remove(t.id)"
            aria-label="关闭"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToasts, type ToastType } from '../composables/useToast'

const { toasts, remove } = useToasts()

function typeClass(t: ToastType): string {
  switch (t) {
    case 'success':
      return 'bg-green-50/95 dark:bg-green-900/90 border-green-500 text-green-800 dark:text-green-100'
    case 'error':
      return 'bg-red-50/95 dark:bg-red-900/90 border-red-500 text-red-800 dark:text-red-100'
    case 'warning':
      return 'bg-yellow-50/95 dark:bg-yellow-900/90 border-yellow-500 text-yellow-800 dark:text-yellow-100'
    default:
      return 'bg-blue-50/95 dark:bg-blue-900/90 border-blue-500 text-blue-800 dark:text-blue-100'
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
