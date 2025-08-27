// 统一错误处理工具
import type { ValidationError } from './validation'

// 错误类型枚举
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// 错误信息接口
export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  timestamp: number
  userFriendly: boolean
}

// 网络错误类型
export interface NetworkError {
  status?: number
  statusText?: string
  code?: string
  message: string
}

// 创建应用错误
export const createAppError = (
  type: ErrorType,
  message: string,
  code?: string,
  details?: any,
  userFriendly: boolean = true
): AppError => ({
  type,
  message,
  code,
  details,
  timestamp: Date.now(),
  userFriendly
})

// 处理API错误
export const handleApiError = (error: any): AppError => {
  // 网络错误
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return createAppError(
      ErrorType.NETWORK,
      '网络连接失败，请检查网络设置',
      'NETWORK_ERROR',
      error,
      true
    )
  }

  // HTTP状态码错误
  if (error.response) {
    const { status, statusText, data } = error.response
    
    switch (status) {
      case 400:
        return createAppError(
          ErrorType.VALIDATION,
          data?.message || '请求数据格式错误，请检查输入',
          'BAD_REQUEST',
          { status, data },
          true
        )
      
      case 401:
        return createAppError(
          ErrorType.AUTHENTICATION,
          '需要登录权限，请先登录',
          'UNAUTHORIZED',
          { status, data },
          true
        )
      
      case 403:
        return createAppError(
          ErrorType.AUTHORIZATION,
          '没有权限执行此操作',
          'FORBIDDEN',
          { status, data },
          true
        )
      
      case 404:
        return createAppError(
          ErrorType.NETWORK,
          '请求的资源不存在',
          'NOT_FOUND',
          { status, data },
          true
        )
      
      case 422:
        return createAppError(
          ErrorType.VALIDATION,
          data?.message || '数据验证失败，请检查输入',
          'UNPROCESSABLE_ENTITY',
          { status, data },
          true
        )
      
      case 500:
        return createAppError(
          ErrorType.SERVER,
          '服务器内部错误，请稍后重试',
          'INTERNAL_SERVER_ERROR',
          { status, data },
          true
        )
      
      case 502:
      case 503:
      case 504:
        return createAppError(
          ErrorType.SERVER,
          '服务暂时不可用，请稍后重试',
          'SERVICE_UNAVAILABLE',
          { status, data },
          true
        )
      
      default:
        return createAppError(
          ErrorType.UNKNOWN,
          `请求失败 (${status}): ${statusText || '未知错误'}`,
          'HTTP_ERROR',
          { status, statusText, data },
          false
        )
    }
  }

  // 其他错误
  if (error.message) {
    return createAppError(
      ErrorType.UNKNOWN,
      error.message,
      error.code || 'UNKNOWN_ERROR',
      error,
      false
    )
  }

  // 默认错误
  return createAppError(
    ErrorType.UNKNOWN,
    '发生未知错误，请刷新页面重试',
    'UNKNOWN_ERROR',
    error,
    true
  )
}

// 处理验证错误
export const handleValidationError = (errors: ValidationError[]): AppError => {
  const errorMessages = errors.map(e => e.message).join('; ')
  
  return createAppError(
    ErrorType.VALIDATION,
    `数据验证失败: ${errorMessages}`,
    'VALIDATION_ERROR',
    { errors },
    true
  )
}

// 获取用户友好的错误消息
export const getUserFriendlyMessage = (error: AppError): string => {
  if (error.userFriendly) {
    return error.message
  }

  // 将技术性错误转换为用户友好的消息
  switch (error.type) {
    case ErrorType.NETWORK:
      return '网络连接出现问题，请检查网络设置'
    
    case ErrorType.SERVER:
      return '服务器暂时不可用，请稍后重试'
    
    case ErrorType.AUTHENTICATION:
      return '需要登录权限，请先登录'
    
    case ErrorType.AUTHORIZATION:
      return '没有权限执行此操作'
    
    case ErrorType.VALIDATION:
      return '输入数据有误，请检查后重试'
    
    default:
      return '操作失败，请稍后重试'
  }
}

// 错误日志记录
export const logError = (error: AppError, context?: string): void => {
  const logData = {
    timestamp: new Date(error.timestamp).toISOString(),
    type: error.type,
    code: error.code,
    message: error.message,
    context,
    details: error.details,
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // 开发环境：控制台输出
  if (import.meta.env.DEV) {
    console.error('🚨 Application Error:', logData)
  }

  // 生产环境：可以发送到错误监控服务
  // 这里可以集成 Sentry、LogRocket 等服务
  if (import.meta.env.PROD) {
    // 避免在控制台暴露敏感信息
    console.error('An error occurred. Please check the console for details.')
    
    // 可以在这里发送错误到监控服务
    // sendErrorToMonitoring(logData)
  }
}

// 错误恢复建议
export const getErrorRecoverySuggestion = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.NETWORK:
      return '建议：检查网络连接，刷新页面重试'
    
    case ErrorType.SERVER:
      return '建议：等待几分钟后重试，或联系管理员'
    
    case ErrorType.VALIDATION:
      return '建议：检查输入数据，确保格式正确'
    
    case ErrorType.AUTHENTICATION:
      return '建议：重新登录或检查登录状态'
    
    case ErrorType.AUTHORIZATION:
      return '建议：联系管理员获取相应权限'
    
    default:
      return '建议：刷新页面重试，或联系技术支持'
  }
}

// 错误重试策略
export const shouldRetry = (error: AppError, retryCount: number): boolean => {
  const maxRetries = 3
  
  if (retryCount >= maxRetries) {
    return false
  }

  // 网络错误和服务器错误可以重试
  if (error.type === ErrorType.NETWORK || error.type === ErrorType.SERVER) {
    return true
  }

  // 验证错误和权限错误不应该重试
  if (error.type === ErrorType.VALIDATION || 
      error.type === ErrorType.AUTHENTICATION || 
      error.type === ErrorType.AUTHORIZATION) {
    return false
  }

  return false
}

// 计算重试延迟
export const getRetryDelay = (retryCount: number): number => {
  // 指数退避策略：1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, retryCount), 10000)
}
