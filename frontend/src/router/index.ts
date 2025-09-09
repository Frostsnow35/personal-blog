import { createRouter, createWebHistory } from 'vue-router'
// 使用动态导入实现真正的懒加载，并添加预加载优化
const LandingPage = () => import('../views/LandingPage.vue')
const HomePage = () => import('../views/HomePage.vue')
const About = () => import('../views/About.vue')
const Archive = () => import('../views/Archive.vue')
const Category = () => import('../views/Category.vue')
const Tag = () => import('../views/Tag.vue')
const BlogPost = () => import('../views/BlogPost.vue')
const Profile = () => import('../views/Profile.vue')
const PerformanceTest = () => import('../views/PerformanceTest.vue')
const AdminLogin = () => import('../views/AdminLogin.vue')
const AdminPosts = () => import('../views/AdminPosts.vue')
const AdminPostEdit = () => import('../views/AdminPostEdit.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
const AudioLibrary = () => import('../views/AudioLibrary.vue')
// import TestPage from '../views/TestPage.vue'

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
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/archive',
    name: 'Archive',
    component: Archive
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
    path: '/post/:slug',
    name: 'BlogPost',
    component: BlogPost
  },
  {
    path: '/admin-login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin/posts',
    name: 'AdminPosts',
    component: AdminPosts
  },
  {
    path: '/admin/posts/new',
    name: 'AdminPostNew',
    component: AdminPostEdit
  },
  {
    path: '/admin/posts/:id/edit',
    name: 'AdminPostEdit',
    component: AdminPostEdit
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/performance-test',
    name: 'PerformanceTest',
    component: PerformanceTest,
    meta: { requiresAuth: true }
  },
  {
    path: '/audio-library',
    name: 'AudioLibrary',
    component: AudioLibrary,
    meta: { requiresAuth: true }
  }
  // {
  //   path: '/test',
  //   name: 'Test',
  //   component: TestPage
  // }
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

export default router
