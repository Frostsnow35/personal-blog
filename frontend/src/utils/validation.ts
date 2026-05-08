// 个人资料数据验证工具
import type { Profile, SocialLink } from '../types'

// 验证错误类型
export interface ValidationError {
  field: string
  message: string
  code: string
}

// 验证规则配置
export const validationRules = {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/
  },
  bio: {
    maxLength: 4000
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  website: {
    pattern: /^https?:\/\/.+\..+/
  },
  github: {
    pattern: /^https:\/\/github\.com\/[\w-]+$/
  },
  bilibili: {
    pattern: /^https:\/\/space\.bilibili\.com\/\d+(?:\?.*)?$/
  },
  skills: {
    maxCount: 20,
    maxLength: 30
  },
  interests: {
    maxCount: 15,
    maxLength: 20
  },
  socialLinks: {
    maxCount: 10,
    maxLength: 200
  }
}

// 社交媒体平台配置
export const socialPlatforms = {
  github: {
    name: 'GitHub',
    icon: '🐙',
    pattern: validationRules.github.pattern,
    placeholder: 'https://github.com/username'
  },
  bilibili: {
    name: 'Bilibili',
    icon: '📺',
    pattern: validationRules.bilibili.pattern,
    placeholder: 'https://space.bilibili.com/123456'
  },
  email: {
    name: '邮箱',
    icon: '📧',
    pattern: validationRules.email.pattern,
    placeholder: 'user@example.com'
  },
  website: {
    name: '个人网站',
    icon: '🌐',
    pattern: validationRules.website.pattern,
    placeholder: 'https://example.com'
  },
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    pattern: /^https:\/\/twitter\.com\/[\w-]+$/,
    placeholder: 'https://twitter.com/username'
  },
  qq: {
    name: 'QQ',
    icon: '🐧',
    pattern: /^https?:\/\/.+/,
    placeholder: 'QQ链接'
  },
  wechat: {
    name: '微信',
    icon: '💬',
    pattern: /^https?:\/\/.+/,
    placeholder: '微信链接'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    pattern: /^https:\/\/www\.linkedin\.com\/in\/[\w-]+$/,
    placeholder: 'https://www.linkedin.com/in/username'
  },
  youtube: {
    name: 'YouTube',
    icon: '📹',
    pattern: /^https:\/\/www\.youtube\.com\/@[\w-]+$/,
    placeholder: 'https://www.youtube.com/@username'
  }
}

// 验证个人资料数据
export const validateProfile = (profile: Partial<Profile>): ValidationError[] => {
  const errors: ValidationError[] = []

  // 姓名验证
  if (profile.name !== undefined) {
    if (!profile.name || profile.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: '姓名不能为空',
        code: 'REQUIRED'
      })
    } else if (profile.name.trim().length < validationRules.name.minLength) {
      errors.push({
        field: 'name',
        message: `姓名至少需要${validationRules.name.minLength}个字符`,
        code: 'MIN_LENGTH'
      })
    } else if (profile.name.length > validationRules.name.maxLength) {
      errors.push({
        field: 'name',
        message: `姓名不能超过${validationRules.name.maxLength}个字符`,
        code: 'MAX_LENGTH'
      })
    } else if (!validationRules.name.pattern.test(profile.name)) {
      errors.push({
        field: 'name',
        message: '姓名只能包含中文、英文和空格',
        code: 'INVALID_FORMAT'
      })
    }
  }

  // 个人简介验证
  if (profile.bio !== undefined) {
    if (profile.bio && profile.bio.length > validationRules.bio.maxLength) {
      errors.push({
        field: 'bio',
        message: `个人简介不能超过${validationRules.bio.maxLength}个字符`,
        code: 'MAX_LENGTH'
      })
    }
  }

  // 邮箱验证
  if (profile.email !== undefined && profile.email) {
    if (!validationRules.email.pattern.test(profile.email)) {
      errors.push({
        field: 'email',
        message: '邮箱格式不正确',
        code: 'INVALID_FORMAT'
      })
    }
  }

  // 网站验证
  if (profile.website !== undefined && profile.website) {
    if (!validationRules.website.pattern.test(profile.website)) {
      errors.push({
        field: 'website',
        message: '网站地址格式不正确，必须以http://或https://开头',
        code: 'INVALID_FORMAT'
      })
    }
  }

  // 社交媒体链接验证
  if (profile.socialLinks !== undefined) {
    if (profile.socialLinks.length > validationRules.socialLinks.maxCount) {
      errors.push({
        field: 'socialLinks',
        message: `社交媒体链接数量不能超过${validationRules.socialLinks.maxCount}个`,
        code: 'MAX_COUNT'
      })
    }
    
    profile.socialLinks.forEach((link, index) => {
      if (link.url && link.url.length > validationRules.socialLinks.maxLength) {
        errors.push({
          field: `socialLinks[${index}].url`,
          message: `链接地址不能超过${validationRules.socialLinks.maxLength}个字符`,
          code: 'MAX_LENGTH'
        })
      }
      
      // 验证特定平台的链接格式
      if (link.url && link.platform) {
        const platform = socialPlatforms[link.platform]
        if (platform && !platform.pattern.test(link.url)) {
          errors.push({
            field: `socialLinks[${index}].url`,
            message: `${platform.name}链接格式不正确`,
            code: 'INVALID_FORMAT'
          })
        }
      }
    })
  }

  // 技能验证
  if (profile.skills !== undefined) {
    if (profile.skills.length > validationRules.skills.maxCount) {
      errors.push({
        field: 'skills',
        message: `技能数量不能超过${validationRules.skills.maxCount}个`,
        code: 'MAX_COUNT'
      })
    }
    
    profile.skills.forEach((skill, index) => {
      if (skill.length > validationRules.skills.maxLength) {
        errors.push({
          field: `skills[${index}]`,
          message: `技能名称不能超过${validationRules.skills.maxLength}个字符`,
          code: 'MAX_LENGTH'
        })
      }
    })
  }

  // 兴趣验证
  if (profile.interests !== undefined) {
    if (profile.interests.length > validationRules.interests.maxCount) {
      errors.push({
        field: 'interests',
        message: `兴趣数量不能超过${validationRules.interests.maxCount}个`,
        code: 'MAX_COUNT'
      })
    }
    
    profile.interests.forEach((interest, index) => {
      if (interest.length > validationRules.interests.maxLength) {
        errors.push({
          field: `interests[${index}]`,
          message: `兴趣名称不能超过${validationRules.interests.maxLength}个字符`,
          code: 'MAX_LENGTH'
        })
      }
    })
  }

  return errors
}

// 验证单个字段
export const validateField = (field: keyof Profile, value: any): ValidationError[] => {
  const partialProfile: Partial<Profile> = { [field]: value }
  return validateProfile(partialProfile)
}

// 验证社交媒体链接
export const validateSocialLink = (link: SocialLink): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!link.platform) {
    errors.push({
      field: 'platform',
      message: '请选择社交媒体平台',
      code: 'REQUIRED'
    })
  }
  
  if (link.url && link.platform) {
    const platform = socialPlatforms[link.platform]
    if (platform && !platform.pattern.test(link.url)) {
      errors.push({
        field: 'url',
        message: `${platform.name}链接格式不正确`,
        code: 'INVALID_FORMAT'
      })
    }
  }
  
  if (link.url && link.url.length > validationRules.socialLinks.maxLength) {
    errors.push({
      field: 'url',
      message: `链接地址不能超过${validationRules.socialLinks.maxLength}个字符`,
      code: 'MAX_LENGTH'
    })
  }
  
  return errors
}

// 检查个人资料是否完整
export const isProfileComplete = (profile: Profile): boolean => {
  const requiredFields: (keyof Profile)[] = ['name', 'bio']
  return requiredFields.every(field => {
    const value = profile[field]
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value && value.toString().trim().length > 0
  })
}

// 获取验证错误消息
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find(e => e.field === field)
  return error ? error.message : null
}

// 清理验证错误
export const clearFieldErrors = (errors: ValidationError[], field: string): ValidationError[] => {
  return errors.filter(e => e.field !== field)
}
