import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export interface AuthUser {
  id: number
  username: string
  role: string
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)

  const initFromStorage = () => {
    try {
      const storedToken = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('auth_user')
      if (storedToken) {
        token.value = storedToken
        isAuthenticated.value = true
        if (storedUser) {
          try {
            user.value = JSON.parse(storedUser)
          } catch {
            user.value = null
          }
        }
      }
    } catch {
      isAuthenticated.value = false
      token.value = null
      user.value = null
    }
  }

  initFromStorage()

  const login = (accessToken: string, authUser?: AuthUser) => {
    try {
      localStorage.setItem('access_token', accessToken)
      if (authUser) {
        localStorage.setItem('auth_user', JSON.stringify(authUser))
        user.value = authUser
      }
      token.value = accessToken
      isAuthenticated.value = true
    } catch {
      throw new Error('无法保存认证信息')
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_user')
    } catch {}
    token.value = null
    user.value = null
    isAuthenticated.value = false
    const router = useRouter()
    router.push('/home')
  }

  const isAdmin = computed(() => isAuthenticated.value && user.value?.role === 'admin')

  return {
    isAuthenticated,
    user,
    token,
    isAdmin,
    login,
    logout,
    initFromStorage
  }
})
