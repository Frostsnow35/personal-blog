import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration: number
  closable: boolean
}

const toasts = ref<ToastItem[]>([])
let seq = 0

function push(t: Omit<ToastItem, 'id'>) {
  const id = `t${++seq}-${Date.now()}`
  // 去重：1 秒内同 title+message 只保留一条
  const dup = toasts.value.find(
    x => x.title === t.title && x.message === t.message
  )
  if (dup) return dup.id
  toasts.value.push({ id, ...t })
  if (t.duration > 0) {
    setTimeout(() => remove(id), t.duration)
  }
  return id
}

function remove(id: string) {
  const i = toasts.value.findIndex(x => x.id === id)
  if (i !== -1) toasts.value.splice(i, 1)
}

function clear() {
  toasts.value.splice(0, toasts.value.length)
}

export function useToasts() {
  return { toasts, push, remove, clear }
}

// 顶层便捷 API
export const toast = {
  success: (title: string, message?: string, duration = 3500) =>
    push({ type: 'success', title, message, duration, closable: true }),
  error: (title: string, message?: string, duration = 6000) =>
    push({ type: 'error', title, message, duration, closable: true }),
  warning: (title: string, message?: string, duration = 4500) =>
    push({ type: 'warning', title, message, duration, closable: true }),
  info: (title: string, message?: string, duration = 3500) =>
    push({ type: 'info', title, message, duration, closable: true }),
}
