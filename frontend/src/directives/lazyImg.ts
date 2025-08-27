import type { DirectiveBinding } from 'vue'

const loadImage = (el: HTMLImageElement, src: string) => {
  const img = new Image()
  img.onload = () => {
    el.src = src
    el.dataset.loaded = 'true'
  }
  img.onerror = () => {
    // 保持原 src，不打扰渲染
  }
  img.src = src
}

const createObserver = (el: HTMLImageElement, src: string) => {
  if (!('IntersectionObserver' in window)) {
    loadImage(el, src)
    return
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage(el, src)
        observer.unobserve(el)
      }
    })
  }, { rootMargin: '100px' })
  observer.observe(el)
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const target = el as HTMLImageElement
    const src = binding.value || target.getAttribute('data-src') || ''
    if (!src) return
    // 使用占位透明像素，避免布局抖动
    if (!target.getAttribute('src')) {
      target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    }
    target.setAttribute('loading', 'lazy')
    createObserver(target, src)
  }
}



