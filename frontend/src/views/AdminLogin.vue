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
          <button :disabled="loading" type="submit" class="w-full px-4 py-2 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <p v-if="errorMsg" class="text-center text-red-600 text-sm mt-3">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
  </template>

  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const username = ref('')
  const password = ref('')
  const loading = ref(false)
  const errorMsg = ref('')
  const router = useRouter()

  const onSubmit = async () => {
    errorMsg.value = ''
    loading.value = true
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, password: password.value })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.message || '登录失败')
      }
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      router.push('/profile')
    } catch (e: any) {
      errorMsg.value = e.message || '登录失败'
    } finally {
      loading.value = false
    }
  }
  </script>


