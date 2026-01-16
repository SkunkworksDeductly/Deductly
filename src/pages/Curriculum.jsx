import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils'

const Curriculum = () => {
  const [videos, setVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { getAuthHeaders } = useAuth()

  const categories = ['All', 'Logical Reasoning', 'Reading Comprehension', 'Analytical Reasoning', 'General']

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    filterVideos()
  }, [selectedCategory, searchQuery, videos])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBaseUrl}/skill-builder/curriculum/videos`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      } else {
        console.error('Error fetching videos')
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterVideos = () => {
    let filtered = videos

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(video => video.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.instructor.toLowerCase().includes(query)
      )
    }

    setFilteredVideos(filtered)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <p className="text-text-main/60 text-sm font-medium animate-pulse">Loading Academy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-sand-dark/30 dark:border-white/5 pb-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-terracotta font-sans">Curriculum</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-main dark:text-white leading-[0.9]">
            Academy<br />
            <span className="text-text-main/40 dark:text-white/40 font-medium tracking-tight">Master the Fundamentals.</span>
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/study-plan')}
        >
          My Study Plan <span className="material-symbols-outlined text-sm ml-2">auto_stories</span>
        </Button>
      </header>

      {/* Controls */}
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-main/40">search</span>
          <input
            type="text"
            placeholder="Search videos, concepts, or instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-sand-dark/30 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-main dark:text-white placeholder:text-text-main/30"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 border",
                selectedCategory === category
                  ? "bg-text-main text-white border-text-main dark:bg-white dark:text-bg-dark"
                  : "bg-transparent border-sand-dark/30 text-text-main/60 hover:border-text-main/60 hover:text-text-main dark:border-white/10 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-text-main/40 dark:text-white/40 font-medium">
          <span>Showing {filteredVideos.length} result{filteredVideos.length !== 1 && 's'}</span>
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-sand/20 dark:bg-white/5 rounded-3xl border border-dashed border-sand-dark/30">
          <span className="material-symbols-outlined text-4xl text-text-main/20 mb-4 block">smart_display</span>
          <p className="text-text-main/60">No videos found matching your criteria.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-4 text-primary font-bold hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onVideoClick={() => navigate(`/curriculum/${video.id}`)}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// VideoCard Component
const VideoCard = ({ video, onVideoClick, formatDuration }) => {

  // Helper for badge colors (using design system tokens map to props loosely for now)
  const getDifficultyBadgeVariant = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return { variant: 'success', label: 'Beginner' }
      case 'intermediate': return { variant: 'primary', label: 'Intermediate' }
      case 'advanced': return { variant: 'danger', label: 'Advanced' }
      default: return { variant: 'default', label: difficulty }
    }
  }

  const { variant: badgeVariant } = getDifficultyBadgeVariant(video.difficulty)

  return (
    <div
      onClick={onVideoClick}
      className="group flex flex-col bg-white dark:bg-white/5 rounded-3xl border border-sand-dark/20 dark:border-white/10 overflow-hidden hover:border-text-main/20 dark:hover:border-white/30 hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-sand-dark/10 overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sand/30 dark:bg-white/5 group-hover:bg-sand/50 transition-colors">
            <span className="material-symbols-outlined text-4xl text-text-main/20">play_circle</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="size-12 rounded-full bg-white/90 backdrop-blur text-text-main flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
            <span className="material-symbols-outlined filled">play_arrow</span>
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg tracking-wider">
          {formatDuration(video.duration_seconds)}
        </div>

        {/* Completed Status */}
        {video.is_completed && (
          <div className="absolute top-3 left-3 bg-sage text-white text-[10px] font-bold px-2 py-1 rounded-lg tracking-wider flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-[10px]">check</span> COMPLETED
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default" className="text-[10px]">
            {video.category}
          </Badge>
          <Badge variant={badgeVariant} className="text-[10px] border-none bg-opacity-10">
            {video.difficulty}
          </Badge>
        </div>

        <h3 className="font-bold text-lg text-text-main dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {video.title}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-sand-dark/10 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center text-xs font-bold">
              {video.instructor.charAt(0)}
            </div>
            <span className="text-xs font-medium text-text-main/60 dark:text-white/60">{video.instructor}</span>
          </div>
          <span className="text-text-main/40 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_forward</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Curriculum
