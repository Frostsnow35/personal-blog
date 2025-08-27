<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- 背景图片 -->
    <div class="absolute inset-0 z-0">
      <img 
        v-lazy-img="'/profile.jpg'"
        alt="个人背景" 
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
      <!-- 渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-ocean-900/50 to-ocean-900/80"></div>
      <!-- 备用背景色 -->
      <div class="absolute inset-0 bg-gradient-to-br from-ocean-600 to-sea-600 opacity-20"></div>
    </div>
    
    <!-- 主要内容 -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen text-center text-white px-4">
      <!-- 头像 -->
      <div class="mb-6">
        <img 
          v-lazy-img="'/avatar.jpg'"
          alt="霜雪旧曾谙"
          class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/30 shadow-2xl"
        />
      </div>
      
      <!-- 标题 -->
      <h1 class="text-5xl md:text-7xl font-bold mb-6 titletext-gradient">
        霜雪旧曾谙的世界
      </h1>
      
      <!-- 副标题 -->
      <p class="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl">
        这里记录着我的技术分享、生活感悟和对世界的思考
      </p>
      
      <!-- 个人介绍 -->
      <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
        <p class="text-lg text-gray-200 mb-4">
           计算机专业学生 | 二次元爱好者 | 海洋探索者 | 哲学思考者
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <span class="px-3 py-1 bg-ocean-600/50 rounded-full text-sm">Vue.js</span>
          <span class="px-3 py-1 bg-ocean-600/50 rounded-full text-sm">Python</span>
          <span class="px-3 py-1 bg-ocean-600/50 rounded-full text-sm">Flask</span>
          <span class="px-3 py-1 bg-ocean-600/50 rounded-full text-sm">MySQL</span>
        </div>
      </div>
      
      <!-- 进入按钮 -->
      <button
        @click="enterBlog"
        class="group relative px-8 py-4 bg-gradient-to-r from-ocean-600 to-sea-600 rounded-full text-white font-semibold text-lg hover:from-ocean-700 hover:to-sea-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
      >
        <span class="relative z-10">进入博客</span>
        <div class="absolute inset-0 bg-gradient-to-r from-ocean-400 to-sea-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
      
      <!-- 装饰元素 -->
      <div class="absolute top-20 left-20 w-32 h-32 bg-ocean-400/20 rounded-full blur-3xl animate-float"></div>
      <div class="absolute bottom-20 right-20 w-40 h-40 bg-sea-400/20 rounded-full blur-3xl animate-float" style="animation-delay: -2s;"></div>
      <div class="absolute top-1/2 left-10 w-24 h-24 bg-ocean-300/30 rounded-full blur-2xl animate-wave"></div>
    </div>
    
    <!-- 波浪动画 -->
    <div class="absolute bottom-0 left-0 w-full h-32 z-20">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="w-full h-full">
        <path
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
          opacity=".25"
          class="fill-ocean-600"
        ></path>
        <path
          d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.71,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,65.6-42.72C1006.38,36.29,1044.41,27.1,1091.49,20.36c65.64-9.37,129.23,4.81,175.84,25.81V0Z"
          opacity=".5"
          class="fill-sea-500"
        ></path>
        <path
          d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
          class="fill-ocean-400"
        ></path>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 添加图片加载错误处理
const handleImageError = () => {
  // 如果图片加载失败，使用默认背景色
  console.warn('个人背景图片加载失败，使用默认背景')
}

const enterBlog = () => {
  router.push('/home')
}
</script>

<style scoped>
.titletext-gradient {
  background: linear-gradient(135deg,  #e51769, #e1e0de);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient {
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes wave {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-wave {
  animation: wave 4s ease-in-out infinite;
}
</style>
                    