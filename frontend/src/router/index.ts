import { createRouter, createWebHistory } from 'vue-router'
// 使用动态导入实现真正的懒加载，并添加预加载优化
const LandingPage = () => import('../views/LandingPage.vue')
const HomePage = () => import('../views/HomePage.vue')
const Search = () => import('../views/Search.vue')
const About = () => import('../views/About.vue')
const Category = () => import('../views/Category.vue')
const Tag = () => import('../views/Tag.vue')
const BlogPost = () => import('../views/BlogPost.vue')
const Profile = () => import('../views/Profile.vue')
const PerformanceTest = () => import('../views/PerformanceTest.vue')
const AdminLogin = () => import('../views/AdminLogin.vue')
const AdminPosts = () => import('../views/AdminPosts.vue')
const AdminPostEdit = () => import('../views/AdminPostEdit.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
// 新功能（留言栏 / 相册 / 百宝箱）
const Guestbook = () => import('../views/Guestbook.vue')
const Albums = () => import('../views/Albums.vue')
const AlbumDetail = () => import('../views/AlbumDetail.vue')
const MusicFavorites = () => import('../views/MusicFavorites.vue')
const MovieFavorites = () => import('../views/MovieFavorites.vue')
const FriendLinks = () => import('../views/FriendLinks.vue')
const Treasure = () => import('../views/Treasure.vue')
const UptimePage = () => import('../views/UptimePage.vue')
// Admin 后台 - 新增
const AdminGuestbook = () => import('../views/AdminGuestbook.vue')
const AdminAlbums = () => import('../views/AdminAlbums.vue')
const AdminMusic = () => import('../views/AdminMusic.vue')
const AdminMovies = () => import('../views/AdminMovies.vue')
const AdminFriendLinks = () => import('../views/AdminFriendLinks.vue')
const AdminSecurity = () => import('../views/AdminSecurity.vue')

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/category',
    name: 'Category',
    component: Category
  },
  {
    path: '/tag',
    name: 'Tag',
    component: Tag
  },
  {
    path: '/post/:id',
    name: 'BlogPost',
    component: BlogPost
  },
  // 新功能 - 公开页
  {
    path: '/guestbook',
    name: 'Guestbook',
    component: Guestbook
  },
  {
    path: '/albums',
    name: 'Albums',
    component: Albums
  },
  {
    path: '/albums/:id',
    name: 'AlbumDetail',
    component: AlbumDetail
  },
  {
    path: '/treasure',
    name: 'Treasure',
    component: Treasure
  },
  {
    path: '/treasure/music',
    name: 'MusicFavorites',
    component: MusicFavorites
  },
  {
    path: '/treasure/movies',
    name: 'MovieFavorites',
    component: MovieFavorites
  },
  {
    path: '/treasure/friends',
    name: 'FriendLinks',
    component: FriendLinks
  },
  {
    path: '/uptime',
    name: 'UptimePage',
    component: UptimePage
  },
  // Admin
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin/posts',
    name: 'AdminPosts',
    component: AdminPosts,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/posts/new',
    name: 'AdminPostNew',
    component: AdminPostEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/posts/:id/edit',
    name: 'AdminPostEdit',
    component: AdminPostEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true }
  },
  // Admin - 新模块
  {
    path: '/admin/guestbook',
    name: 'AdminGuestbook',
    component: AdminGuestbook,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/albums',
    name: 'AdminAlbums',
    component: AdminAlbums,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/music',
    name: 'AdminMusic',
    component: AdminMusic,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/movies',
    name: 'AdminMovies',
    component: AdminMovies,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/friend-links',
    name: 'AdminFriendLinks',
    component: AdminFriendLinks,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/security',
    name: 'AdminSecurity',
    component: AdminSecurity,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/performance-test',
    name: 'PerformanceTest',
    component: PerformanceTest,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为优化
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由预加载优化
router.beforeEach((to, from, next) => {
  // 预加载下一个可能访问的页面
  if (to.name === 'Landing' && to.path === '/') {
    // 预加载首页
    import('../views/HomePage.vue')
  } else if (to.name === 'Home') {
    // 预加载关于页面
    import('../views/About.vue')
    import('../views/Search.vue')
  }
  next()
})

// 统一路由守卫：需要登录的页面或 /admin/* 需持有 access_token
router.beforeEach((to, _from, next) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const needAuth = Boolean(to.meta?.requiresAuth) || to.path.startsWith('/admin')
  if (needAuth && !token && to.path !== '/admin-login') {
    return next({ path: '/admin-login' })
  }
  next()
})

// 路由错误处理：懒加载模块失败时自动刷新页面（通常因 SW 版本更新导致 chunk 文件名变化）
router.onError((error) => {
  const msg = String(error)
  if (/Failed to fetch dynamically imported module|Loading chunk|Failed to resolve import/i.test(msg)) {
    // 避免无限刷新循环：如果 5 秒内已刷新过则不再重试
    const lastReload = sessionStorage.getItem('__lazy_reload_ts')
    if (lastReload && Date.now() - Number(lastReload) < 5000) {
      console.error('[router] 模块加载失败且刚刚已刷新，不再重试', error)
      return
    }
    sessionStorage.setItem('__lazy_reload_ts', String(Date.now()))
    window.location.reload()
    return
  }
})

export default router
