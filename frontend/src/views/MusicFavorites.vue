<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import { Music, ExternalLink, Heart, Search, Plus, X } from 'lucide-vue-next';
import { http } from '@/utils/http';
import SiteNav from '@/components/SiteNav.vue';
import AmbientBackdrop from '@/components/AmbientBackdrop.vue';

interface MusicItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  source_url: string;
  created_at?: string;
}

interface SearchResult {
  success: boolean;
  data: MusicItem[];
  total: number;
  page: number;
  limit: number;
}

const musicItems = ref<MusicItem[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const searchResults = ref<MusicItem[]>([]);
const searchLoading = ref(false);
const showSearchMode = ref(false);
const currentPage = ref(1);
const totalResults = ref(0);

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return musicItems.value;
  }
  const query = searchQuery.value.toLowerCase();
  return musicItems.value.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.artist.toLowerCase().includes(query) ||
    item.album.toLowerCase().includes(query)
  );
});

const extractSongId = (sourceUrl: string): string => {
  const match = sourceUrl.match(/id=(\d+)/);
  return match ? match[1] : '';
};

const loadMusic = async () => {
  try {
    const response = await http.get<any>('/music-favorites');
    if (response?.data) {
      musicItems.value = response.data;
    }
  } catch (error: any) {
    console.error('加载音乐失败:', error);
    toast.error('加载音乐失败', error?.message || String(error));
  } finally {
    loading.value = false;
  }
};

const searchMusic = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    totalResults.value = 0;
    showSearchMode.value = false;
    return;
  }
  
  searchLoading.value = true;
  try {
    const response = await http.get<any>(`/music-search?keyword=${encodeURIComponent(searchQuery.value)}&page=${currentPage.value}`);
    if (response?.data) {
      searchResults.value = response.data;
      totalResults.value = response.total || 0;
      showSearchMode.value = true;
    }
  } catch (error: any) {
    console.error('搜索音乐失败:', error);
    toast.error('搜索失败', error?.message || String(error));
  } finally {
    searchLoading.value = false;
  }
};

const addToFavorites = async (item: MusicItem) => {
  try {
    await http.post('/music-favorites', {
      title: item.title,
      artist: item.artist,
      album: item.album,
      cover_url: item.cover_url,
      source_url: item.source_url,
    });
    toast.success('添加成功');
    await loadMusic();
  } catch (error: any) {
    toast.error('添加失败', error?.message || String(error));
  }
};

const removeFromFavorites = async (item: MusicItem) => {
  try {
    await http.delete(`/music-favorites/${item.id}`);
    toast.success('移除成功');
    await loadMusic();
  } catch (error: any) {
    toast.error('移除失败', error?.message || String(error));
  }
};

const openInNetease = (item: MusicItem) => {
  const songId = extractSongId(item.source_url);
  const url = `https://music.163.com/#/song?id=${songId}`;
  window.open(url, '_blank');
};

const getCoverSrc = (src?: string) => {
  if (!src) return '';
  try {
    if (/^http:\/\//i.test(src)) {
      return src.replace(/^http:\/\//i, 'https://');
    }
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
    return `/${src.replace(/^\/+/, '')}`;
  } catch {
    return src;
  }
};

const onCoverError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.style.objectFit = 'contain';
  target.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#60a5fa'/>
          <stop offset='100%' stop-color='#0ea5e9'/>
        </linearGradient>
      </defs>
      <rect fill='url(#g)' width='100%' height='100%'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='48' font-family='sans-serif'>Music</text>
    </svg>`
  );
};

const handleSearchInput = () => {
  if (!searchQuery.value.trim()) {
    showSearchMode.value = false;
    searchResults.value = [];
  }
};

const handleSearchSubmit = () => {
  currentPage.value = 1;
  searchMusic();
};

onMounted(() => {
  loadMusic();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-ocean-50 via-white to-sea-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
    <AmbientBackdrop />
    <SiteNav />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-ocean-500 to-sea-500 rounded-2xl shadow-lg mb-4">
          <Music class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          个人喜爱音乐
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">🎵 每日精选 · 我的音乐品味</p>
      </div>

      <div class="max-w-md mx-auto mb-8">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索歌曲、歌手或专辑..."
            class="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
            @input="handleSearchInput"
            @keyup.enter="handleSearchSubmit"
          />
        </div>
        <div class="flex gap-2 mt-3 justify-center">
          <button
            @click="handleSearchSubmit"
            class="px-6 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Search class="w-4 h-4" />
            搜索音乐
          </button>
          <button
            v-if="showSearchMode"
            @click="showSearchMode = false; searchResults = []"
            class="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <X class="w-4 h-4" />
            返回收藏
          </button>
        </div>
      </div>

      <div v-if="showSearchMode">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <h3 class="text-gray-900 dark:text-gray-100 font-semibold mb-4">搜索结果</h3>
          <div v-if="searchLoading" class="flex justify-center items-center py-10">
            <div class="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="searchResults.length === 0" class="text-center py-10">
            <Search class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">未找到匹配的音乐</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="item in searchResults"
              :key="item.id"
              class="search-card p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div class="relative aspect-square overflow-hidden rounded-lg mb-3">
                <img
                  :src="getCoverSrc(item.cover_url)"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                  @error="onCoverError($event)"
                />
              </div>
              <h4 class="text-gray-900 dark:text-gray-100 font-medium truncate text-sm">{{ item.title }}</h4>
              <p class="text-gray-500 dark:text-gray-400 text-xs truncate">{{ item.artist }}</p>
              <div class="mt-2 flex gap-2">
                <button
                  @click="addToFavorites(item)"
                  class="flex-1 px-3 py-1.5 bg-ocean-500 hover:bg-ocean-600 text-white rounded-md transition-colors flex items-center justify-center gap-1 text-xs"
                >
                  <Plus class="w-3 h-3" />
                  添加收藏
                </button>
                <button
                  @click="openInNetease(item)"
                  class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center gap-1 text-xs"
                >
                  <ExternalLink class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div v-if="totalResults > 20" class="text-center mt-4">
            <p class="text-gray-500 dark:text-gray-400 text-sm">共 {{ totalResults }} 首结果</p>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="w-12 h-12 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="filteredItems.length === 0 && !showSearchMode" class="text-center py-20">
        <Heart class="w-20 h-20 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500 dark:text-gray-400 text-xl">{{ searchQuery ? '未找到匹配的音乐' : '暂无收藏音乐' }}</p>
      </div>

      <div v-else-if="!showSearchMode" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="music-card group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <div class="relative aspect-square overflow-hidden rounded-xl mb-3">
            <img
              v-lazy-img="getCoverSrc(item.cover_url)"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              @error="onCoverError($event)"
            />
          </div>

          <div class="px-1">
            <h3 class="text-gray-900 dark:text-gray-100 font-semibold truncate group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
              {{ item.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm truncate">{{ item.artist }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs truncate">{{ item.album }}</p>
          </div>

          <div class="mt-3 flex gap-2">
            <button
              @click="openInNetease(item)"
              class="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
            >
              <ExternalLink class="w-4 h-4" />
              在网易云播放
            </button>
            <button
              @click="removeFromFavorites(item)"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-300 flex items-center justify-center text-sm font-medium"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="searchQuery && !showSearchMode && filteredItems.length > 0 && filteredItems.length !== musicItems.length" class="text-center mt-6">
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          找到 {{ filteredItems.length }} 首匹配的音乐（共 {{ musicItems.length }} 首）
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
}

.dark .music-card {
  background: rgba(30, 41, 59, 0.9);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2);
}

.search-card {
  box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.05);
}

button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
</style>
