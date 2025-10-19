import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const VideoDetail = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { currentUser, getAuthHeaders } = useAuth()
  const [video, setVideo] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchVideoDetails()
  }, [videoId])

  const fetchVideoDetails = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      // Fetch video details
      const response = await fetch(`${apiBaseUrl}/skill-builder/curriculum/videos/${videoId}`, {
        method: 'GET',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setVideo(data.video)
        setRelatedVideos(data.related_videos || [])
        setIsCompleted(data.video.is_completed || false)
      } else {
        console.error('Error fetching video details')
      }
    } catch (error) {
      console.error('Error fetching video details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async () => {
    try {
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      const endpoint = isCompleted ? 'incomplete' : 'complete'
      const response = await fetch(`${apiBaseUrl}/skill-builder/curriculum/videos/${videoId}/${endpoint}`, {
        method: 'POST',
        headers
      })

      if (response.ok) {
        setIsCompleted(!isCompleted)
        // Refresh video details to get updated completion status
        await fetchVideoDetails()
      } else {
        console.error(`Error marking video as ${endpoint}`)
      }
    } catch (error) {
      console.error(`Error marking video as ${isCompleted ? 'incomplete' : 'complete'}:`, error)
    }
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
          <p className="mt-4 text-text-secondary">Loading video...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12 bg-surface-primary rounded-xl border border-border-default">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Video Not Found</h3>
            <p className="text-text-secondary mb-6">The video you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/curriculum')}
              className="bg-button-primary text-white px-6 py-3 rounded-lg hover:bg-button-primary-hover transition duration-300"
            >
              Back to Curriculum
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => navigate('/curriculum')}
          className="flex items-center text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Library</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video Player and Details */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-surface-primary rounded-xl border border-border-default overflow-hidden mb-6">
              <div className="relative aspect-video bg-black">
                {video.video_url ? (
                  <video
                    className="w-full h-full"
                    controls
                    poster={video.thumbnail_url}
                  >
                    <source src={video.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-button-primary to-purple-600">
                    <div className="text-center text-white">
                      <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">Video preview not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-surface-primary rounded-xl border border-border-default p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-text-primary mb-2">{video.title}</h1>
                  <div className="flex items-center space-x-4 text-text-secondary text-sm">
                    <span className="px-3 py-1 rounded bg-surface-tertiary text-text-primary font-medium">
                      {video.category}
                    </span>
                    <span className="px-3 py-1 rounded bg-surface-tertiary text-text-primary font-medium">
                      {video.difficulty}
                    </span>
                    <span>{formatDuration(video.duration_seconds)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-border-default">
                <button
                  onClick={handleToggleComplete}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition duration-300 ${
                    isCompleted
                      ? 'bg-status-success text-white hover:bg-green-600'
                      : 'bg-button-primary text-white hover:bg-button-primary-hover'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{isCompleted ? 'Completed' : 'Mark as Complete'}</span>
                </button>

                <button className="flex items-center space-x-2 px-6 py-3 bg-surface-primary border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>Save</span>
                </button>

                <button className="flex items-center space-x-2 px-6 py-3 bg-surface-primary border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-button-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {video.instructor.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-text-primary font-semibold">{video.instructor}</h3>
                  <p className="text-text-secondary text-sm">Professional Instructor</p>
                </div>
                <button className="px-4 py-2 bg-button-primary text-white rounded-lg hover:bg-button-primary-hover transition duration-300">
                  Follow
                </button>
              </div>

              {/* Description */}
              <p className="text-text-secondary mb-6 leading-relaxed">
                {video.description || 'No description available for this video.'}
              </p>

              {/* Tabs */}
              <div className="border-b border-border-default mb-6">
                <div className="flex space-x-6">
                  {['overview', 'notes', 'resources', 'discussion'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 px-2 font-medium transition-colors relative ${
                        activeTab === tab
                          ? 'text-button-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-button-primary"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">About this video</h3>
                    <p className="text-text-secondary mb-4 leading-relaxed">
                      {video.description || 'Deep dive into advanced concepts and practical applications. This comprehensive lesson covers fundamental principles and real-world use cases.'}
                    </p>

                    {video.key_topics && video.key_topics.length > 0 && (
                      <>
                        <h4 className="text-md font-semibold text-text-primary mb-3">Key Topics Covered:</h4>
                        <ul className="space-y-2 text-text-secondary">
                          {video.key_topics.map((topic, index) => (
                            <li key={index} className="flex items-start">
                              <svg className="w-5 h-5 text-status-success mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-text-secondary">Notes feature coming soon</p>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-text-secondary">No resources available for this video</p>
                  </div>
                )}

                {activeTab === 'discussion' && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    <p className="text-text-secondary">Discussion feature coming soon</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <div className="bg-surface-primary rounded-xl border border-border-default p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Related Videos</h2>
              <p className="text-text-secondary text-sm mb-6">More from {video.category}</p>

              {relatedVideos.length > 0 ? (
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <div
                      key={relatedVideo.id}
                      onClick={() => navigate(`/curriculum/${relatedVideo.id}`)}
                      className="flex space-x-3 cursor-pointer group"
                    >
                      <div className="relative w-40 aspect-video bg-surface-tertiary rounded-lg overflow-hidden flex-shrink-0">
                        {relatedVideo.thumbnail_url ? (
                          <img
                            src={relatedVideo.thumbnail_url}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-button-primary to-purple-600">
                            <svg className="w-8 h-8 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(relatedVideo.duration_seconds)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-text-primary text-sm font-medium line-clamp-2 group-hover:text-button-primary transition-colors mb-1">
                          {relatedVideo.title}
                        </h4>
                        <p className="text-text-secondary text-xs mb-1">{relatedVideo.instructor}</p>
                        <p className="text-text-tertiary text-xs">{formatDuration(relatedVideo.duration_seconds)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm text-center py-4">No related videos available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoDetail
