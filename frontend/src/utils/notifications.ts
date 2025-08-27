// 用户通知系统
import type { AppError } from './errorHandler'

// 通知类型
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// 通知接口
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  timestamp: number
  closable: boolean
}

// 显示通知的简单函数
export const showNotification = (
  type: NotificationType,
  title: string,
  message?: string,
  duration: number = 5000
): void => {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`
  
  // 设置样式
  const baseClasses = 'border-l-4 p-4'
  const typeClasses = {
    [NotificationType.SUCCESS]: 'bg-green-50 border-green-500 text-green-800',
    [NotificationType.ERROR]: 'bg-red-50 border-red-500 text-red-800',
    [NotificationType.WARNING]: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    [NotificationType.INFO]: 'bg-blue-50 border-blue-500 text-blue-800'
  }
  
  notification.className = `${baseClasses} ${typeClasses[type]}`
  
  // 设置内容
  notification.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h4 class="font-semibold text-sm">${title}</h4>
        ${message ? `<p class="text-sm mt-1">${message}</p>` : ''}
      </div>
      <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
        &times;
      </button>
    </div>
  `
  
  // 添加到页面
  document.body.appendChild(notification)
  
  // 显示动画
  setTimeout(() => {
    notification.classList.remove('translate-x-full')
  }, 100)
  
  // 自动移除
  if (duration > 0) {
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 300)
    }, duration)
  }
}

// 便捷函数
export const showSuccess = (title: string, message?: string) => 
  showNotification(NotificationType.SUCCESS, title, message)

export const showError = (title: string, message?: string) => 
  showNotification(NotificationType.ERROR, title, message, 0) // 错误通知不自动消失

export const showWarning = (title: string, message?: string) => 
  showNotification(NotificationType.WARNING, title, message)

export const showInfo = (title: string, message?: string) => 
  showNotification(NotificationType.INFO, title, message)

// 显示应用错误
export const showAppError = (appError: AppError, context?: string) => {
  const title = context ? `${context}失败` : '操作失败'
  showError(title, appError.message)
}
