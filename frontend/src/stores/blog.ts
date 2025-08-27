import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface BlogPost {
  id: number
  title: string
  content: string
  excerpt: string
  category: string
  tags: string[]
  publishDate: string
  readTime: number
  coverImage?: string
}

export interface Category {
  name: string
  count: number
}

export interface Tag {
  name: string
  count: number
}

export const useBlogStore = defineStore('blog', () => {
  const posts = ref<BlogPost[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const searchQuery = ref('')
  const currentCategory = ref('')
  const currentTag = ref('')
  
  const filteredPosts = computed(() => {
    let filtered = posts.value
    
    if (searchQuery.value) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
      )
    }
    
    if (currentCategory.value) {
      filtered = filtered.filter(post => post.category === currentCategory.value)
    }
    
    if (currentTag.value) {
      filtered = filtered.filter(post => post.tags.includes(currentTag.value))
    }
    
    return filtered
  })
  
  const setPosts = (newPosts: BlogPost[]) => {
    posts.value = newPosts
  }
  
  const setCategories = (newCategories: Category[]) => {
    categories.value = newCategories
  }
  
  const setTags = (newTags: Tag[]) => {
    tags.value = newTags
  }
  
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }
  
  const setCurrentCategory = (category: string) => {
    currentCategory.value = category
    currentTag.value = ''
  }
  
  const setCurrentTag = (tag: string) => {
    currentTag.value = tag
    currentCategory.value = ''
  }
  
  const clearFilters = () => {
    searchQuery.value = ''
    currentCategory.value = ''
    currentTag.value = ''
  }
  
  return {
    posts,
    categories,
    tags,
    searchQuery,
    currentCategory,
    currentTag,
    filteredPosts,
    setPosts,
    setCategories,
    setTags,
    setSearchQuery,
    setCurrentCategory,
    setCurrentTag,
    clearFilters
  }
})
