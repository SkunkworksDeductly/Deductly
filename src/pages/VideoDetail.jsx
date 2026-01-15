import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils'

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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-pulse text-text-main/60 text-sm font-medium">Loading Lesson...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold text-text-main dark:text-white">Lesson Not Found</h1>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/curriculum')}>
          Return to Academy
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-8">

      {/* Nav */}
      <Button
        variant="ghost"
        className="pl-0 hover:bg-transparent hover:text-primary mb-2"
        onClick={() => navigate('/curriculum')}
      >
        <span className="material-symbols-outlined mr-2">arrow_back</span>
        Back to Academy
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Player Wrapper */}
          <div className="rounded-3xl overflow-hidden bg-black shadow-2xl border border-sand-dark/20 dark:border-white/10 aspect-video relative group">
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-sand-dark/10 text-center p-8">
                <span className="material-symbols-outlined text-6xl text-text-main/20 mb-4">videocam_off</span>
                <p className="text-text-main/40 font-medium">Video preview not available in demo mode.</p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card variant="flat" className="p-8 bg-white dark:bg-white/5 border border-sand-dark/20 space-y-6">
            <div className="space-y-4 border-b border-sand-dark/10 dark:border-white/5 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge variant="default" className="text-[10px]">{video.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{video.difficulty}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-text-main dark:text-white font-serif">{video.title}</h1>
                </div>
                <Button
                  variant={isCompleted ? "secondary" : "primary"}
                  onClick={handleToggleComplete}
                  className={cn(
                    "shrink-0",
                    isCompleted ? "bg-sage/10 text-sage hover:bg-sage/20 border-sage/20" : ""
                  )}
                >
                  {isCompleted ? (
                    <>
                      <span className="material-symbols-outlined text-lg mr-2">check</span>
                      Completed
                    </>
                  ) : (
                    "Mark Complete"
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-text-main/60 dark:text-white/60">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center text-xs font-bold">
                    {video.instructor.charAt(0)}
                  </div>
                  <span className="font-medium">{video.instructor}</span>
                </div>
                <span className="w-px h-4 bg-current opacity-20" />
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  {formatDuration(video.duration_seconds)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="space-y-6">
              <div className="flex gap-8 border-b border-sand-dark/10 dark:border-white/5">
                {['overview', 'notes', 'resources'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "pb-3 text-sm font-bold uppercase tracking-wider transition-all relative",
                      activeTab === tab
                        ? "text-terracotta"
                        : "text-text-main/40 dark:text-white/40 hover:text-text-main dark:hover:text-white"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-terracotta" />
                    )}
                  </button>
                ))}
              </div>

              <div className="min-h-[200px]">
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <p className="text-lg leading-relaxed text-text-main/80 dark:text-white/80 max-w-3xl">
                      {video.description || "In this lesson, we explore core concepts and apply them to real-world LSAT scenarios. Pay attention to the strategic breakdown provided in the second half."}
                    </p>

                    {video.key_topics?.length > 0 && (
                      <div className="bg-sand/20 dark:bg-white/5 rounded-2xl p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60 mb-4">Key Takeaways</h4>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {video.key_topics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-main dark:text-white">
                              <span className="material-symbols-outlined text-sage text-base mt-0.5">check_circle</span>
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-text-main/40 animate-in fade-in duration-300">
                    <span className="material-symbols-outlined text-4xl mb-2">edit_note</span>
                    <p>Personal notes are available in the full version.</p>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-text-main/40 animate-in fade-in duration-300">
                    <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                    <p>No downloadable resources for this lesson.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default VideoDetail
