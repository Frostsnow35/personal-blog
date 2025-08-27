// 音频管理工具
export interface AudioTrack {
  id: string
  src: string
  title: string
  artist?: string
  album?: string
  duration?: number
  cover?: string
  category: 'music' | 'podcast' | 'interview' | 'background'
  tags?: string[]
  uploadDate: Date
  fileSize: number
  format: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  tracks: AudioTrack[]
  cover?: string
  createdAt: Date
  updatedAt: Date
}

export class AudioManager {
  private static instance: AudioManager
  private tracks: Map<string, AudioTrack> = new Map()
  private playlists: Map<string, Playlist> = new Map()
  private currentPlaylist: Playlist | null = null
  private currentTrackIndex: number = 0
  
  private constructor() {
    this.loadFromLocalStorage()
  }
  
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }
  
  // 添加音频文件
  addTrack(track: Omit<AudioTrack, 'id' | 'uploadDate'>): string {
    const id = this.generateId()
    const newTrack: AudioTrack = {
      ...track,
      id,
      uploadDate: new Date()
    }
    
    this.tracks.set(id, newTrack)
    this.saveToLocalStorage()
    return id
  }
  
  // 获取音频文件
  getTrack(id: string): AudioTrack | undefined {
    return this.tracks.get(id)
  }
  
  // 获取所有音频文件
  getAllTracks(): AudioTrack[] {
    return Array.from(this.tracks.values())
  }
  
  // 按分类获取音频文件
  getTracksByCategory(category: AudioTrack['category']): AudioTrack[] {
    return this.getAllTracks().filter(track => track.category === category)
  }
  
  // 搜索音频文件
  searchTracks(query: string): AudioTrack[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllTracks().filter(track => 
      track.title.toLowerCase().includes(lowerQuery) ||
      track.artist?.toLowerCase().includes(lowerQuery) ||
      track.album?.toLowerCase().includes(lowerQuery) ||
      track.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }
  
  // 创建播放列表
  createPlaylist(name: string, description?: string, cover?: string): string {
    const id = this.generateId()
    const playlist: Playlist = {
      id,
      name,
      description,
      cover,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.playlists.set(id, playlist)
    this.saveToLocalStorage()
    return id
  }
  
  // 获取播放列表
  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.get(id)
  }
  
  // 获取所有播放列表
  getAllPlaylists(): Playlist[] {
    return Array.from(this.playlists.values())
  }
  
  // 添加音频到播放列表
  addTrackToPlaylist(playlistId: string, trackId: string): boolean {
    const playlist = this.playlists.get(playlistId)
    const track = this.tracks.get(trackId)
    
    if (!playlist || !track) return false
    
    if (!playlist.tracks.find(t => t.id === trackId)) {
      playlist.tracks.push(track)
      playlist.updatedAt = new Date()
      this.saveToLocalStorage()
      return true
    }
    
    return false
  }
  
  // 从播放列表移除音频
  removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    const playlist = this.playlists.get(playlistId)
    
    if (!playlist) return false
    
    const index = playlist.tracks.findIndex(t => t.id === trackId)
    if (index !== -1) {
      playlist.tracks.splice(index, 1)
      playlist.updatedAt = new Date()
      this.saveToLocalStorage()
      return true
    }
    
    return false
  }
  
  // 设置当前播放列表
  setCurrentPlaylist(playlistId: string): boolean {
    const playlist = this.playlists.get(playlistId)
    if (playlist) {
      this.currentPlaylist = playlist
      this.currentTrackIndex = 0
      return true
    }
    return false
  }
  
  // 获取当前播放列表
  getCurrentPlaylist(): Playlist | null {
    return this.currentPlaylist
  }
  
  // 获取当前音频
  getCurrentTrack(): AudioTrack | null {
    if (!this.currentPlaylist || this.currentPlaylist.tracks.length === 0) {
      return null
    }
    return this.currentPlaylist.tracks[this.currentTrackIndex] || null
  }
  
  // 下一首
  nextTrack(): AudioTrack | null {
    if (!this.currentPlaylist || this.currentPlaylist.tracks.length === 0) {
      return null
    }
    
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.currentPlaylist.tracks.length
    return this.getCurrentTrack()
  }
  
  // 上一首
  previousTrack(): AudioTrack | null {
    if (!this.currentPlaylist || this.currentPlaylist.tracks.length === 0) {
      return null
    }
    
    this.currentTrackIndex = this.currentTrackIndex === 0 
      ? this.currentPlaylist.tracks.length - 1 
      : this.currentTrackIndex - 1
    return this.getCurrentTrack()
  }
  
  // 随机播放
  shufflePlaylist(): void {
    if (!this.currentPlaylist) return
    
    const tracks = [...this.currentPlaylist.tracks]
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
    }
    
    this.currentPlaylist.tracks = tracks
    this.currentTrackIndex = 0
  }
  
  // 删除音频文件
  deleteTrack(id: string): boolean {
    const track = this.tracks.get(id)
    if (!track) return false
    
    // 从所有播放列表中移除
    this.playlists.forEach(playlist => {
      this.removeTrackFromPlaylist(playlist.id, id)
    })
    
    this.tracks.delete(id)
    this.saveToLocalStorage()
    return true
  }
  
  // 删除播放列表
  deletePlaylist(id: string): boolean {
    return this.playlists.delete(id)
  }
  
  // 获取音频统计信息
  getStats() {
    const tracks = this.getAllTracks()
    const playlists = this.getAllPlaylists()
    
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
    const totalSize = tracks.reduce((sum, track) => sum + track.fileSize, 0)
    
    const categoryStats = tracks.reduce((stats, track) => {
      stats[track.category] = (stats[track.category] || 0) + 1
      return stats
    }, {} as Record<string, number>)
    
    return {
      totalTracks: tracks.length,
      totalPlaylists: playlists.length,
      totalDuration: Math.round(totalDuration / 60), // 分钟
      totalSize: Math.round(totalSize / 1024 / 1024), // MB
      categoryStats,
      averageTrackDuration: Math.round(totalDuration / tracks.length / 60) // 分钟
    }
  }
  
  // 导入音频文件（从文件选择器）
  async importFromFiles(files: FileList): Promise<string[]> {
    const importedIds: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (file.type.startsWith('audio/')) {
        const track: Omit<AudioTrack, 'id' | 'uploadDate'> = {
          src: URL.createObjectURL(file),
          title: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
          category: this.detectCategory(file.name),
          format: file.type,
          fileSize: file.size,
          tags: this.extractTags(file.name)
        }
        
        const id = this.addTrack(track)
        importedIds.push(id)
      }
    }
    
    return importedIds
  }
  
  // 检测音频分类
  private detectCategory(filename: string): AudioTrack['category'] {
    const lowerName = filename.toLowerCase()
    
    if (lowerName.includes('podcast') || lowerName.includes('播客')) return 'podcast'
    if (lowerName.includes('interview') || lowerName.includes('采访')) return 'interview'
    if (lowerName.includes('background') || lowerName.includes('背景')) return 'background'
    
    return 'music'
  }
  
  // 提取标签
  private extractTags(filename: string): string[] {
    const tags: string[] = []
    const name = filename.toLowerCase()
    
    // 根据文件名提取可能的标签
    if (name.includes('rock')) tags.push('摇滚')
    if (name.includes('pop')) tags.push('流行')
    if (name.includes('jazz')) tags.push('爵士')
    if (name.includes('classical')) tags.push('古典')
    if (name.includes('electronic')) tags.push('电子')
    if (name.includes('folk')) tags.push('民谣')
    
    return tags
  }
  
  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  // 保存到本地存储
  private saveToLocalStorage(): void {
    try {
      const data = {
        tracks: Array.from(this.tracks.entries()),
        playlists: Array.from(this.playlists.entries()),
        currentPlaylistId: this.currentPlaylist?.id || null,
        currentTrackIndex: this.currentTrackIndex
      }
      
      localStorage.setItem('audio-manager-data', JSON.stringify(data))
    } catch (error) {
      console.error('保存音频数据失败:', error)
    }
  }
  
  // 从本地存储加载
  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('audio-manager-data')
      if (data) {
        const parsed = JSON.parse(data)
        
        // 恢复音频文件
        if (parsed.tracks) {
          this.tracks = new Map(parsed.tracks)
        }
        
        // 恢复播放列表
        if (parsed.playlists) {
          this.playlists = new Map(parsed.playlists)
        }
        
        // 恢复播放状态
        if (parsed.currentPlaylistId) {
          this.currentPlaylist = this.playlists.get(parsed.currentPlaylistId) || null
        }
        
        if (parsed.currentTrackIndex !== undefined) {
          this.currentTrackIndex = parsed.currentTrackIndex
        }
      }
    } catch (error) {
      console.error('加载音频数据失败:', error)
    }
  }
  
  // 导出数据
  exportData(): string {
    const data = {
      tracks: this.getAllTracks(),
      playlists: this.getAllPlaylists(),
      stats: this.getStats(),
      exportDate: new Date().toISOString()
    }
    
    return JSON.stringify(data, null, 2)
  }
  
  // 清空所有数据
  clearAll(): void {
    this.tracks.clear()
    this.playlists.clear()
    this.currentPlaylist = null
    this.currentTrackIndex = 0
    localStorage.removeItem('audio-manager-data')
  }
}

// 导出单例实例
export const audioManager = AudioManager.getInstance()

// 便捷函数
export const addAudioTrack = (track: Omit<AudioTrack, 'id' | 'uploadDate'>) => {
  return audioManager.addTrack(track)
}

export const getAudioTracks = () => {
  return audioManager.getAllTracks()
}

export const createAudioPlaylist = (name: string, description?: string) => {
  return audioManager.createPlaylist(name, description)
}

export const getAudioStats = () => {
  return audioManager.getStats()
}
