import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading curriculum...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Video Library</h1>
              <p className="text-text-secondary mt-1">
                Explore educational videos across various topics • {videos.length} videos
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/study-plan')}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>My Study Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search videos or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-primary border border-border-default rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-button-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition duration-300 ${
                selectedCategory === category
                  ? 'bg-button-primary text-white'
                  : 'bg-surface-primary text-text-primary border border-border-default hover:bg-surface-hover'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Video Count */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-text-primary">
            All Videos
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12 bg-surface-primary rounded-xl border border-border-default">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-text-secondary">No videos found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  )
}

// VideoCard Component
const VideoCard = ({ video, onVideoClick, formatDuration }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-status-success text-white'
      case 'intermediate':
        return 'bg-status-warning text-white'
      case 'advanced':
        return 'bg-status-error text-white'
      default:
        return 'bg-surface-tertiary text-text-primary'
    }
  }

  return (
    <div
      onClick={onVideoClick}
      className="bg-surface-primary rounded-xl border border-border-default overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-tertiary overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-button-primary to-purple-600">
            <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
            <svg className="w-6 h-6 text-button-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration_seconds)}
        </div>

        {/* Bookmark icon */}
        {video.is_completed && (
          <div className="absolute top-2 right-2 bg-status-success rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category and Difficulty Badges */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs px-2 py-1 rounded bg-accent-info-bg text-button-primary border border-button-primary font-medium">
            {video.category}
          </span>
          <span className={`text-xs px-2 py-1 rounded font-medium ${getDifficultyColor(video.difficulty)}`}>
            {video.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-text-primary font-semibold mb-2 line-clamp-2 group-hover:text-button-primary transition-colors">
          {video.title}
        </h3>

        {/* Instructor */}
        <p className="text-text-secondary text-sm mb-3">{video.instructor}</p>

        {/* Action */}
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Handle watch now action
            }}
            className="text-button-primary hover:text-button-primary-hover flex items-center font-medium text-sm"
          >
            <span>Watch now</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Curriculum
