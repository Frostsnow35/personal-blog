<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <SiteNav />
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">安全管理</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">监控和管理网站安全</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div class="text-3xl font-bold text-red-500">{{ stats.blacklisted_ips }}</div>
          <div class="text-gray-600 dark:text-gray-400 text-sm">已封禁 IP</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div class="text-3xl font-bold text-orange-500">{{ stats.total_attacks }}</div>
          <div class="text-gray-600 dark:text-gray-400 text-sm">攻击总数</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div class="text-3xl font-bold text-purple-500">{{ stats.honeypot_captures }}</div>
          <div class="text-gray-600 dark:text-gray-400 text-sm">蜜罐捕获</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">最近攻击</h2>
              <button @click="loadAttackLogs" class="text-sm text-ocean-500 hover:text-ocean-600">
                刷新
              </button>
            </div>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <div v-if="attackLogs.length === 0" class="p-8 text-center text-gray-500">
              暂无攻击记录
            </div>
            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <div 
                v-for="(attack, index) in attackLogs" 
                :key="index" 
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div class="flex items-start justify-between">
                  <span 
                    class="px-2 py-1 text-xs font-medium rounded"
                    :class="getAttackClass(attack.attack_type)"
                  >
                    {{ attack.attack_type }}
                  </span>
                  <span class="text-xs text-gray-500">{{ formatTime(attack.timestamp) }}</span>
                </div>
                <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <div>IP: {{ attack.ip }}</div>
                  <div>路径: {{ attack.path }}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ JSON.stringify(attack.details).slice(0, 100) }}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">IP 黑名单</h2>
              <button @click="clearBlacklist" class="text-sm text-red-500 hover:text-red-600">
                清空
              </button>
            </div>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <div v-if="blacklist.length === 0" class="p-8 text-center text-gray-500">
              暂无封禁 IP
            </div>
            <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
              <div 
                v-for="(item, index) in blacklist" 
                :key="index" 
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
              >
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">{{ item.ip }}</div>
                  <div class="text-xs text-gray-500">
                    剩余 {{ Math.ceil((item.expires - Date.now() / 1000) / 60) }} 分钟
                  </div>
                </div>
                <button 
                  @click="whitelistIp(item.ip)" 
                  class="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                >
                  放行
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">蜜罐捕获</h2>
            <button @click="loadHoneypotCaptures" class="text-sm text-ocean-500 hover:text-ocean-600">
              刷新
            </button>
          </div>
        </div>
        <div class="max-h-64 overflow-y-auto">
          <div v-if="honeypotCaptures.length === 0" class="p-8 text-center text-gray-500">
            暂无蜜罐捕获记录
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">路径</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">方法</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">时间</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(capture, index) in honeypotCaptures" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{{ capture.ip }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{{ capture.path }}</td>
                  <td class="px-4 py-3 text-sm">{{ capture.method }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ formatTime(capture.timestamp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SiteNav from '../components/SiteNav.vue'

interface SecurityStats {
  blacklisted_ips: number
  total_attacks: number
  honeypot_captures: number
  recent_attacks: any[]
}

interface AttackLog {
  timestamp: string
  ip: string
  user_agent: string
  path: string
  method: string
  attack_type: string
  details: any
}

interface BlacklistItem {
  ip: string
  expires: number
  reason: string
}

const stats = ref<SecurityStats>({
  blacklisted_ips: 0,
  total_attacks: 0,
  honeypot_captures: 0,
  recent_attacks: []
})

const attackLogs = ref<AttackLog[]>([])
const blacklist = ref<BlacklistItem[]>([])
const honeypotCaptures = ref<any[]>([])

const loadStats = async () => {
  try {
    const { http } = await import('../utils/http')
    const data = await http.get<any>('/admin/security/stats')
    stats.value = data.data
  } catch (e) {
    console.error('加载安全统计失败', e)
  }
}

const loadAttackLogs = async () => {
  try {
    const { http } = await import('../utils/http')
    const data = await http.get<any>('/admin/security/attacks?page=1&per_page=20')
    attackLogs.value = data.data.data
  } catch (e) {
    console.error('加载攻击日志失败', e)
  }
}

const loadBlacklist = async () => {
  try {
    const { http } = await import('../utils/http')
    const data = await http.get<any>('/admin/security/blacklist')
    blacklist.value = data.data
  } catch (e) {
    console.error('加载黑名单失败', e)
  }
}

const loadHoneypotCaptures = async () => {
  try {
    const { http } = await import('../utils/http')
    const data = await http.get<any>('/admin/security/honeypot')
    honeypotCaptures.value = data.data
  } catch (e) {
    console.error('加载蜜罐捕获失败', e)
  }
}

const clearBlacklist = async () => {
  if (!confirm('确定要清空所有封禁 IP 吗？')) return
  try {
    const { http } = await import('../utils/http')
    await http.post('/admin/security/blacklist/clear')
    await loadStats()
    await loadBlacklist()
  } catch (e) {
    console.error('清空黑名单失败', e)
  }
}

const whitelistIp = async (ip: string) => {
  try {
    const { http } = await import('../utils/http')
    await http.post(`/admin/security/blacklist/${ip}/whitelist`)
    await loadStats()
    await loadBlacklist()
  } catch (e) {
    console.error('放行 IP 失败', e)
  }
}

const getAttackClass = (type: string): string => {
  if (type.includes('SQL')) return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  if (type.includes('XSS')) return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
  if (type.includes('HONEYPOT')) return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
  if (type.includes('BRUTE_FORCE')) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
  if (type.includes('BLACKLISTED')) return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
  return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(async () => {
  await loadStats()
  await loadAttackLogs()
  await loadBlacklist()
  await loadHoneypotCaptures()
})
</script>
