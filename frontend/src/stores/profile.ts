import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, SocialLink } from '../types'
import { validateProfile, type ValidationError, isProfileComplete, validateSocialLink } from '../utils/validation'
import { handleApiError, type AppError, logError } from '../utils/errorHandler'
import { profileCache } from '../utils/cache'
// import { profileAPI } from '../services/api'

export const useProfileStore = defineStore('profile', () => {
  // 状态
  const profile = ref<Profile>({
    id: 1,
    name: '霜雪旧曾谙',
    avatar: '/avatar.jpg',
    avatarInfo: {
      current: '/avatar.jpg',
      original: '/avatar.jpg',
      thumbnail: '/avatar.jpg',
      lastUpdated: new Date().toISOString()
    },
    bio: '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者',
    email: 'example@email.com',
    location: '中国',
    website: 'https://example.com',
    socialLinks: [
      {
        platform: 'github',
        url: 'https://github.com/username',
        displayName: 'GitHub',
        icon: '🐙',
        isPublic: true
      },
      {
        platform: 'bilibili',
        url: 'https://space.bilibili.com/454395506',
        displayName: 'Bilibili',
        icon: '📺',
        isPublic: true
      },
      {
        platform: 'github',
        url: 'https://github.com/username',
        displayName: 'GitHub',
        icon: '🐙',
        isPublic: true
      },
      {
        platform: 'email',
        url: 'mailto:you@example.com',
        displayName: '邮箱',
        icon: '📧',
        isPublic: true
      }
    ],
    skills: ['Vue.js', 'Python', 'Flask', 'MySQL', 'TypeScript', 'Tailwind CSS'],
    interests: ['二次元', '海洋', '自然', '哲学', '技术分享'],
    education: '计算机科学与技术',
    occupation: '学生',
    featuredSlugs: ['vue3-composition-api-practice', 'welcome-to-my-blog'],
    contactMarkdown: '',
    cooperationMarkdown: '',
    siteNoticeMarkdown: '',
    updatedAt: new Date().toISOString()
  })

  const isEditing = ref(false)
  const isLoading = ref(false)
  const error = ref<AppError | null>(null)
  const validationErrors = ref<ValidationError[]>([])
  const lastUpdated = ref<number | null>(null)

  // 计算属性
  const displayName = computed(() => profile.value.name)
  const displayAvatar = computed(() => profile.value.avatar)
  const displayBio = computed(() => profile.value.bio)
  
  // 个人资料完整性检查
  const isComplete = computed(() => isProfileComplete(profile.value))
  
  // 是否有验证错误
  const hasValidationErrors = computed(() => validationErrors.value.length > 0)
  
  // 个人资料年龄（最后更新时间）
  const profileAge = computed(() => {
    if (!lastUpdated.value) return null
    return Date.now() - lastUpdated.value
  })
  
  // 个人资料是否过期（超过1小时）
  const isStale = computed(() => {
    if (!profileAge.value) return false
    return profileAge.value > 60 * 60 * 1000 // 1小时
  })

  // 公开的社交媒体链接
  const publicSocialLinks = computed(() => {
    const list = profile.value.socialLinks?.filter(link => link.isPublic) || []
    const seen = new Set<string>()
    return list.filter(link => {
      const url = String(link.url || '').trim()
      const normalizedUrl = url.startsWith('mailto:') ? url : url.replace(/\/$/, '')
      const key = `${link.platform}:${normalizedUrl}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  // 加载个人资料 - 优先使用缓存
  const loadProfile = async (forceRefresh = false) => {
    try {
      isLoading.value = true
      error.value = null
      
      // 如果不是强制刷新，先尝试从缓存加载
      if (!forceRefresh) {
        const cached = profileCache.get()
        if (cached) {
          profile.value = cached
          lastUpdated.value = Date.now()
          return
        }
      }
      
      // 从后端加载
      const { http } = await import('../utils/http')
      const data = await http.get<any>('/profile')
      
      // 将后端结构映射为前端 Profile
      const links: SocialLink[] = []
      if (data.github) links.push({ platform: 'github', url: data.github, displayName: 'GitHub', icon: '🐙', isPublic: true })
      if (data.twitter) links.push({ platform: 'twitter', url: data.twitter, displayName: 'Twitter', icon: '🐦', isPublic: true })
      if (data.website) links.push({ platform: 'website', url: data.website, displayName: 'Website', icon: '🌐', isPublic: true })
      if (data.email) links.push({ platform: 'email', url: `mailto:${data.email}`, displayName: '邮箱', icon: '📧', isPublic: true })
      
      profile.value = {
        id: data.id ?? 1,
        name: data.name ?? '',
        avatar: data.avatar ?? '/avatar.jpg',
        bio: data.bio ?? '',
        email: data.email ?? '',
        location: data.location ?? '',
        website: data.website ?? '',
        socialLinks: links,
        skills: data.skills ?? [],
        interests: data.interests ?? [],
        education: data.education ?? '',
        occupation: data.occupation ?? '',
        featuredSlugs: data.featured_slugs ?? [],
        contactMarkdown: data.contact_markdown ?? '',
        cooperationMarkdown: data.cooperation_markdown ?? '',
        siteNoticeMarkdown: data.site_notice_markdown ?? '',
        updatedAt: data.updated_at ?? new Date().toISOString()
      }
      
      lastUpdated.value = Date.now()
      profileCache.set(profile.value)
    } catch (err) {
      const appError = handleApiError(err)
      error.value = appError
      logError(appError, 'loadProfile')
      
      // 如果有缓存数据，继续使用
      if (!profileCache.isValid()) {
        throw appError
      }
    } finally {
      isLoading.value = false
    }
  }

  // 更新个人资料
  const updateProfile = (newProfile: Partial<Profile>) => {
    // 清除之前的验证错误
    validationErrors.value = []
    
    // 验证新数据
    const errors = validateProfile(newProfile)
    if (errors.length > 0) {
      validationErrors.value = errors
      throw new Error('数据验证失败')
    }
    
    // 更新数据
    profile.value = {
      ...profile.value,
      ...newProfile,
      updatedAt: new Date().toISOString()
    }
    
    // 更新缓存
    profileCache.set(profile.value)
    
    // 清除验证错误
    validationErrors.value = []
  }

  // 验证单个字段
  const validateField = (field: keyof Profile, value: any): boolean => {
    const errors = validateProfile({ [field]: value })
    const fieldErrors = errors.filter(e => e.field === field)
    
    if (fieldErrors.length > 0) {
      // 更新验证错误
      validationErrors.value = [
        ...validationErrors.value.filter(e => e.field !== field),
        ...fieldErrors
      ]
      return false
    } else {
      // 清除该字段的错误
      validationErrors.value = validationErrors.value.filter(e => e.field !== field)
      return true
    }
  }

  // 获取字段验证错误
  const getFieldError = (field: string): string | null => {
    const error = validationErrors.value.find(e => e.field === field)
    return error ? error.message : null
  }

  // 清除字段验证错误
  const clearFieldError = (field: string) => {
    validationErrors.value = validationErrors.value.filter(e => e.field !== field)
  }

  // 清除所有验证错误
  const clearValidationErrors = () => {
    validationErrors.value = []
  }

  // 社交媒体链接管理
  const addSocialLink = (link: SocialLink) => {
    // 验证链接
    const errors = validateSocialLink(link)
    if (errors.length > 0) {
      validationErrors.value = [
        ...validationErrors.value.filter(e => !e.field.startsWith('socialLinks')),
        ...errors.map(e => ({ ...e, field: `socialLinks[${(profile.value.socialLinks || []).length}].${e.field}` }))
      ]
      return false
    }

    const newLinks = [...(profile.value.socialLinks || []), link]
    updateProfile({ socialLinks: newLinks })
    return true
  }

  const updateSocialLink = (index: number, link: SocialLink) => {
    // 验证链接
    const errors = validateSocialLink(link)
    if (errors.length > 0) {
      validationErrors.value = [
        ...validationErrors.value.filter(e => !e.field.startsWith(`socialLinks[${index}]`)),
        ...errors.map(e => ({ ...e, field: `socialLinks[${index}].${e.field}` }))
      ]
      return false
    }

    const newLinks = [...(profile.value.socialLinks || [])]
    newLinks[index] = link
    updateProfile({ socialLinks: newLinks })
    return true
  }

  const removeSocialLink = (index: number) => {
    const newLinks = [...(profile.value.socialLinks || [])]
    newLinks.splice(index, 1)
    updateProfile({ socialLinks: newLinks })
    return true
  }

  // 头像管理
  const updateAvatar = (avatarUrl: string, avatarInfo?: Profile['avatarInfo']) => {
    updateProfile({
      avatar: avatarUrl,
      avatarInfo: avatarInfo || {
        current: avatarUrl,
        original: avatarUrl,
        thumbnail: avatarUrl,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  // 添加技能
  const addSkill = (skill: string) => {
    if (!skill.trim()) return false
    
    // 验证技能
    if (!validateField('skills', [...profile.value.skills, skill])) {
      return false
    }
    
    if (!profile.value.skills.includes(skill)) {
      profile.value.skills.push(skill)
      updateProfile({ skills: profile.value.skills })
      return true
    }
    
    return false
  }

  // 移除技能
  const removeSkill = (skill: string) => {
    const index = profile.value.skills.indexOf(skill)
    if (index > -1) {
      const newSkills = [...profile.value.skills]
      newSkills.splice(index, 1)
      updateProfile({ skills: newSkills })
      return true
    }
    return false
  }

  // 添加兴趣
  const addInterest = (interest: string) => {
    if (!interest.trim()) return false
    
    // 验证兴趣
    if (!validateField('interests', [...profile.value.interests, interest])) {
      return false
    }
    
    if (!profile.value.interests.includes(interest)) {
      profile.value.interests.push(interest)
      updateProfile({ interests: profile.value.interests })
      return true
    }
    
    return false
  }

  // 移除兴趣
  const removeInterest = (interest: string) => {
    const index = profile.value.interests.indexOf(interest)
    if (index > -1) {
      const newInterests = [...profile.value.interests]
      newInterests.splice(index, 1)
      updateProfile({ interests: newInterests })
      return true
    }
    return false
  }

  // 切换编辑模式
  const toggleEdit = () => {
    isEditing.value = !isEditing.value
    if (isEditing.value) {
      // 进入编辑模式时清除错误
      error.value = null
      validationErrors.value = []
    }
  }

  // 保存个人资料
  const saveProfile = async () => {
    try {
      // 验证整个个人资料
      const errors = validateProfile(profile.value)
      if (errors.length > 0) {
        validationErrors.value = errors
        throw new Error('个人资料数据验证失败')
      }
      
      isLoading.value = true
      error.value = null
      
      // 实际调用后端受保护接口（Bearer Token）
      const token = localStorage.getItem('access_token')
      // 从 socialLinks 中提取部分需要写回的字段
      const gh = (profile.value.socialLinks || []).find(l => l.platform === 'github')?.url || ''
      const tw = (profile.value.socialLinks || []).find(l => l.platform === 'twitter')?.url || ''

      const payload = {
        name: profile.value.name,
        avatar: profile.value.avatar,
        bio: profile.value.bio,
        email: profile.value.email,
        location: profile.value.location,
        website: profile.value.website,
        github: gh,
        twitter: tw,
        skills: profile.value.skills,
        interests: profile.value.interests,
        education: profile.value.education,
        occupation: profile.value.occupation,
        featured_slugs: profile.value.featuredSlugs || [],
        contact_markdown: profile.value.contactMarkdown || '',
        cooperation_markdown: profile.value.cooperationMarkdown || '',
        site_notice_markdown: profile.value.siteNoticeMarkdown || ''
      }

      // 使用统一 http 工具，自动附带 Authorization，并在 401/403 时统一跳转
      const { http } = await import('../utils/http')
      const data = await http.put<{ success: boolean; message?: string }>(`/profile`, payload)

      lastUpdated.value = Date.now()
      profileCache.set(profile.value)
      isEditing.value = false
      validationErrors.value = []
      
    } catch (err) {
      const appError = handleApiError(err)
      error.value = appError
      logError(appError, 'saveProfile')
      throw appError
    } finally {
      isLoading.value = false
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    // 重新加载数据
    loadProfile()
    isEditing.value = false
    error.value = null
    validationErrors.value = []
  }

  // 刷新个人资料
  const refreshProfile = () => {
    return loadProfile(true)
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 重置个人资料到默认值
  const resetProfile = () => {
    profile.value = {
      id: 1,
      name: '霜雪旧曾谙',
      avatar: '/avatar.jpg',
      avatarInfo: {
        current: '/avatar.jpg',
        original: '/avatar.jpg',
        thumbnail: '/avatar.jpg',
        lastUpdated: new Date().toISOString()
      },
      bio: '计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者',
      email: 'example@email.com',
      location: '中国',
      website: 'https://example.com',
      socialLinks: [
        {
          platform: 'github',
          url: 'https://github.com/username',
          displayName: 'GitHub',
          icon: '🐙',
          isPublic: true
        },
        {
          platform: 'bilibili',
          url: 'https://space.bilibili.com/454395506',
          displayName: 'Bilibili',
          icon: '📺',
          isPublic: true
        },
        {
          platform: 'github',
          url: 'https://github.com/username',
          displayName: 'GitHub',
          icon: '🐙',
          isPublic: true
        },
        {
          platform: 'email',
          url: 'mailto:you@example.com',
          displayName: '邮箱',
          icon: '📧',
          isPublic: true
        }
      ],
      skills: ['Vue.js', 'Python', 'Flask', 'MySQL', 'TypeScript', 'Tailwind CSS'],
      interests: ['二次元', '海洋', '自然', '哲学', '技术分享'],
      education: '计算机科学与技术',
      occupation: '学生',
      featuredSlugs: ['vue3-composition-api-practice', 'welcome-to-my-blog'],
      contactMarkdown: '',
      cooperationMarkdown: '',
      siteNoticeMarkdown: '',
      updatedAt: new Date().toISOString()
    }
    
    lastUpdated.value = Date.now()
    profileCache.set(profile.value)
    error.value = null
    validationErrors.value = []
  }

  return {
    // 状态
    profile,
    isEditing,
    isLoading,
    error,
    validationErrors,
    lastUpdated,
    
    // 计算属性
    displayName,
    displayAvatar,
    displayBio,
    isComplete,
    hasValidationErrors,
    profileAge,
    isStale,
    publicSocialLinks,
    
    // 方法
    loadProfile,
    updateProfile,
    validateField,
    getFieldError,
    clearFieldError,
    clearValidationErrors,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    updateAvatar,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    toggleEdit,
    saveProfile,
    cancelEdit,
    refreshProfile,
    clearError,
    resetProfile
  }
})
