<template>
	<div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
		<!-- 导航栏 -->
		<nav class="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<router-link to="/home" class="flex items-center space-x-2 text-ocean-600 hover:text-ocean-700">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						<span>返回首页</span>
					</router-link>
					<h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">🎵 音频库</h1>
					<div class="flex items-center space-x-4">
						<span class="text-sm text-gray-600 dark:text-gray-400">管理员模式</span>
						<button @click="logout" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
							退出登录
						</button>
					</div>
				</div>
			</div>
		</nav>

		<!-- 主体 -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- 左：列表 -->
				<div class="lg:col-span-2">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">音频文件</h2>
							<span class="text-sm text-gray-500">{{ filteredAudioFiles.length }} 个文件</span>
						</div>

						<!-- 空状态/加载 -->
						<div v-if="loading" class="flex items-center justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
							<span class="ml-2 text-gray-600 dark:text-gray-400">正在加载音频...</span>
						</div>

						<div v-else-if="filteredAudioFiles.length > 0" class="space-y-4">
							<div
								v-for="audio in filteredAudioFiles"
								:key="audio.id"
								class="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
									<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
									</svg>
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">{{ audio.title }}</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400 truncate">{{ audio.artist || '未知艺术家' }}</p>
									<div class="flex items-center space-x-4 mt-1">
										<span class="text-xs px-2 py-1 bg-ocean-100 dark:bg-ocean-900/30 text-ocean-800 dark:text-ocean-200 rounded-full">{{ audio.type }}</span>
										<span class="text-xs text-gray-500">{{ audio.format?.toUpperCase?.() || '' }}</span>
									</div>
								</div>
								<div class="flex items-center space-x-2">
									<button @click="playAudio(audio)" class="p-2 text-blue-600 hover:text-blue-700 transition-colors" title="播放音频">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z" />
										</svg>
									</button>
									<button @click="addToPlaylist(audio)" class="p-2 text-green-600 hover:text-green-700 transition-colors" title="添加到播放列表">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
										</svg>
									</button>
								</div>
							</div>
						</div>

						<div v-else class="text-center py-12">
							<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
							</svg>
							<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">暂无音频文件</h3>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">将使用默认播放列表</p>
							<div class="mt-4">
								<button @click="refreshAudioFiles" class="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg transition-colors">重新加载</button>
							</div>
						</div>
					</div>
				</div>

				<!-- 右：播放器 -->
				<div class="lg:col-span-1">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">音频播放器</h3>
						<AudioPlayer
							:playlist="playlist"
							:autoplay="true"
							:loop="true"
							@play="onPlay"
							@pause="onPause"
							@ended="onEnded"
							@error="onError"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- 自动播放兜底提示层 -->
		<div v-if="showAutoplayPrompt" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" @click="ackAutoplay">
			<div class="px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
				<p class="text-gray-800 dark:text-gray-100 mb-2">浏览器阻止了自动播放</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">点击此处开始播放</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AudioPlayer from '@/components/AudioPlayer.vue'

// 状态
const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const selectedType = ref('')
const showAutoplayPrompt = ref(false)
const hasPlayed = ref(false)

// 内置默认曲目（自有存储 /public 映射为根路径）
const embeddedTracks = ref([
	{
		id: 'music-1',
		name: 'eikyuu hours.mp3',
		title: 'eikyuu hours',
		artist: '',
		src: '/audio/music/eikyuu%20hours.mp3',
		type: 'music',
		format: 'mp3'
	}
])

// 列表与播放列表
const audioFiles = ref<any[]>([])
const playlist = ref<any[]>([])

// 统计
const stats = computed(() => {
	const byType: Record<string, number> = { music: 0, podcast: 0, interview: 0, background: 0 }
	for (const f of audioFiles.value) byType[f.type] = (byType[f.type] || 0) + 1
	return { total: audioFiles.value.length, byType }
})

// 过滤
const filteredAudioFiles = computed(() => {
	let filtered = audioFiles.value
	if (searchQuery.value) {
		const q = searchQuery.value.toLowerCase()
		filtered = filtered.filter(f =>
			(f.title || '').toLowerCase().includes(q) ||
			(f.artist || '').toLowerCase().includes(q) ||
			(f.name || '').toLowerCase().includes(q)
		)
	}
	if (selectedType.value) {
		filtered = filtered.filter(f => f.type === selectedType.value)
	}
	return filtered
})

// 鉴权（统一使用 access_token）
const checkAuth = () => {
	const token = localStorage.getItem('access_token')
	if (!token) { router.push('/admin-login'); return false }
	return true
}

const logout = () => {
	localStorage.removeItem('access_token')
	localStorage.removeItem('auth_user')
	router.push('/admin-login')
}

// 加载策略：优先 manifest.json，失败回退到 embeddedTracks
const loadManifest = async () => {
	try {
		const res = await fetch('/audio/manifest.json', { cache: 'no-store' })
		if (!res.ok) throw new Error('manifest 不存在')
		const data = await res.json()
		const files = (data.files || []).map((f: any, i: number) => ({
			...f,
			id: f.id || `file-${i}`,
			src: encodeURI(f.src || '')
		}))
		if (files.length > 0) {
			audioFiles.value = files
			playlist.value = files
			return
		}
	} catch (_) {}
	// fallback
	audioFiles.value = embeddedTracks.value
	playlist.value = embeddedTracks.value
}

const refreshAudioFiles = async () => {
	if (!checkAuth()) return
	loading.value = true
	try { await loadManifest() } finally { loading.value = false }
}

// 播放控制
const playAudio = (audio: any) => {
	if (!checkAuth()) return
	playlist.value = [audio]
}

const addToPlaylist = (audio: any) => {
	if (!checkAuth()) return
	if (!playlist.value.find(item => item.id === audio.id)) {
		playlist.value.push(audio)
	}
}

const onPlay = () => { hasPlayed.value = true; showAutoplayPrompt.value = false }
const onPause = () => {}
const onEnded = () => {}
const onError = (msg: string) => {
	if (/NotAllowedError|gesture|autoplay/i.test(msg)) {
		showAutoplayPrompt.value = true
	}
}

const ackAutoplay = () => { showAutoplayPrompt.value = false }

onMounted(async () => {
	if (!checkAuth()) return
	loading.value = true
	try { await loadManifest() } finally { loading.value = false }
	// 1.5 秒内未触发播放则提示用户点击
	setTimeout(() => {
		if (!hasPlayed.value) showAutoplayPrompt.value = true
	}, 1500)
})
</script>

<style scoped>
.card {
	@apply bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700;
}
</style>

 
