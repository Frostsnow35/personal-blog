<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
    <div class="w-full max-w-sm card">
      <div class="p-6">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-6">管理员登录</h1>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">用户名</label>
            <input v-model="username" type="text" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">密码</label>
            <input v-model="password" type="password" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">验证码</label>
            <Captcha ref="captchaRef" />
            <input v-model="captchaInput" type="text" required placeholder="请输入验证码" maxlength="4"
              class="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ocean-500 focus:border-transparent"/>
          </div>
          <LoadingButton :loading="loading" type="submit" loading-text="登录中" class="w-full">
            登录
          </LoadingButton>
        </form>

        <p v-if="errorMsg" class="text-center text-red-600 text-sm mt-3">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '../composables/useToast'
import { useAuthStore } from '../stores/auth'
import LoadingButton from '../components/LoadingButton.vue'
import Captcha from '../components/Captcha.vue'

const username = ref('')
const password = ref('')
const captchaInput = ref('')
const loading = ref(false)
const errorMsg = ref('')
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)
const router = useRouter()
const authStore = useAuthStore()

const onSubmit = async () => {
  errorMsg.value = ''
  
  if (captchaRef.value && !captchaRef.value.validateCaptcha(captchaInput.value)) {
    errorMsg.value = '验证码错误'
    captchaRef.value.refresh()
    captchaInput.value = ''
    return
  }

  loading.value = true
  try {
    const { http } = await import('../utils/http')
    const data = await http.post<any>('/auth/login', { username: username.value, password: password.value })
    authStore.login(data.access_token, data.user)
    router.push('/admin/dashboard')
  } catch (e: any) {
    const msg = e?.message || '登录失败'
    errorMsg.value = msg
    toast.error('登录失败', msg)
    if (captchaRef.value) {
      captchaRef.value.refresh()
    }
    captchaInput.value = ''
  } finally {
    loading.value = false
  }
}
</script>


