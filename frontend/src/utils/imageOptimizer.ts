// 图片优化工具
export class ImageOptimizer {
  // 根据设备性能选择图片质量
  static getOptimalQuality() {
    const connection = (navigator as any).connection
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      return 60
    } else if (connection?.effectiveType === '3g') {
      return 80
    }
    return 90
  }
  
  // 生成响应式图片URL
  static getResponsiveImageUrl(src: string, width: number, format = 'webp') {
    const quality = this.getOptimalQuality()
    const dpr = window.devicePixelRatio || 1
    const optimizedWidth = Math.round(width * dpr)
    
    return `${src}?w=${optimizedWidth}&q=${quality}&format=${format}`
  }
  
  // 预加载关键图片
  static preloadImages(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
  
  // 懒加载图片
  static lazyLoadImage(img: HTMLImageElement, src: string) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src
          observer.unobserve(img)
        }
      })
    })
    
    observer.observe(img)
  }
  
  // 创建占位图片
  static createPlaceholder(width: number, height: number, color = '#f3f4f6') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, width, height)
    }
    
    return canvas.toDataURL()
  }
  
  // 检查图片是否已缓存
  static isImageCached(src: string): boolean {
    const img = new Image()
    img.src = src
    return img.complete
  }
  
  // 批量预加载图片
  static async preloadImageBatch(urls: string[], batchSize = 3): Promise<void> {
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      await Promise.all(
        batch.map(url => this.preloadSingleImage(url))
      )
      
      // 添加小延迟避免阻塞主线程
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
  
  // 预加载单张图片
  private static preloadSingleImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => resolve() // 即使失败也继续
      img.src = url
    })
  }
}

// 导出便捷函数
export const optimizeImage = (src: string, width: number, quality = 80) => {
  return ImageOptimizer.getResponsiveImageUrl(src, width)
}

export const lazyLoad = (img: HTMLImageElement, src: string) => {
  return ImageOptimizer.lazyLoadImage(img, src)
}

export const preloadImages = (urls: string[]) => {
  return ImageOptimizer.preloadImages(urls)
}
