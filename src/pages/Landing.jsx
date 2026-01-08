import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const Landing = () => {
  const { currentUser } = useAuth()
  const userName = currentUser?.displayName?.split(' ')[0] || 'Student'
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoadingActivity(true)
        const token = await currentUser?.getIdToken()

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/skill-builder/drills/history?limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          setRecentActivity(data.drills || [])
        }
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
      } finally {
        setIsLoadingActivity(false)
      }
    }

    if (currentUser) {
      fetchRecentActivity()
    }
  }, [currentUser])

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 14) return '1 week ago'
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-primary mb-3 tracking-tight">
          Welcome back, {userName}
        </h1>
        <p className="text-secondary text-lg">Here's a look at your progress. Keep up the great work.</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-12 flex-wrap">
        <Link to="/drill">
          <Button size="lg">
            Start New Practice Test
          </Button>
        </Link>
        <Link to="/study-plan">
          <Button variant="secondary" size="lg">
            Continue Last Lesson
          </Button>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Stats */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Progress Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Progress */}
            <Card variant="elevated">
              <p className="text-xs uppercase tracking-wider text-muted mb-6">Overall Progress</p>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-border"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.75)}`}
                      className="text-brand-primary transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-3xl text-primary">75%</span>
                  </div>
                </div>
                <div>
                  <p className="font-display text-4xl text-primary mb-1">Good</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">All Time</span>
                    <span className="text-success font-semibold">+5%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Score Trend */}
            <Card variant="elevated">
              <p className="text-xs uppercase tracking-wider text-muted mb-6">Score Trend</p>
              <p className="font-display text-5xl text-primary mb-2">168</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-secondary">Last 30 Days</span>
                <span className="text-success font-semibold">+12</span>
              </div>
            </Card>
          </div>

          {/* Score Improvement Chart */}
          <Card>
            <p className="text-xs uppercase tracking-wider text-muted mb-6">Score Improvement</p>
            <div className="h-48 flex flex-col gap-6">
              <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 475 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="chartGradient" x1="236" x2="236" y1="1" y2="149">
                    <stop stopColor="#6366f1" stopOpacity="0.3"></stop>
                    <stop offset="1" stopColor="#6366f1" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#chartGradient)"></path>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#6366f1" strokeLinecap="round" strokeWidth="3"></path>
              </svg>
              <div className="flex justify-around text-xs text-muted font-medium">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </div>
          </Card>

          {/* Question Type Breakdown */}
          <div>
            <h2 className="font-display text-3xl text-primary mb-6 tracking-tight">
              Question Type Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card variant="interactive">
                <p className="text-sm text-secondary mb-3">Logical Reasoning</p>
                <p className="font-display text-4xl text-primary mb-2">85%</p>
                <p className="text-success text-sm font-semibold">+5%</p>
              </Card>
              <Card variant="interactive">
                <p className="text-sm text-secondary mb-3">Reading Comp</p>
                <p className="font-display text-4xl text-primary mb-2">78%</p>
                <p className="text-success text-sm font-semibold">+2%</p>
              </Card>
              <Card variant="interactive">
                <p className="text-sm text-secondary mb-3">Logic Games</p>
                <p className="font-display text-4xl text-primary mb-2">92%</p>
                <p className="text-danger text-sm font-semibold">-1%</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Recent Activity */}
          <Card>
            <h2 className="font-display text-2xl text-primary mb-6 tracking-tight">Recent Activity</h2>

            {isLoadingActivity ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-primary border-t-transparent"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <ul className="space-y-4">
                {recentActivity.map((drill, index) => {
                  const score = drill.score_percentage ? Math.round(drill.score_percentage) : null
                  const drillType = drill.drill_type || 'Practice Drill'
                  const isCompleted = drill.status === 'completed' && score !== null

                  const activityContent = (
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="bg-brand-primary/10 rounded-full p-2.5 flex-shrink-0">
                        <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-primary font-medium text-sm">
                          {drillType}
                          {drill.question_count && ` (${drill.question_count} questions)`}
                        </p>
                        <p className="text-secondary text-xs mt-0.5">
                          {formatTimeAgo(drill.completed_at)}
                        </p>
                      </div>
                      {score !== null && (
                        <p className="text-primary font-display text-xl ml-auto">{score}%</p>
                      )}
                    </div>
                  )

                  return (
                    <li key={drill.drill_id || index}>
                      {isCompleted ? (
                        <Link to={`/drill/results/${drill.drill_id}`}>
                          {activityContent}
                        </Link>
                      ) : (
                        <div>{activityContent}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-secondary text-sm mb-3">No completed drills yet</p>
                <Link to="/drill">
                  <Button variant="ghost">Start your first drill →</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Study Plan Card */}
          <Card variant="featured">
            <h2 className="font-display text-2xl text-primary mb-4 tracking-tight">Study Plan</h2>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
              <svg className="w-7 h-7 text-brand-primary flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <div>
                <p className="text-primary font-semibold mb-1">Next Up: Reading Comprehension</p>
                <p className="text-secondary text-sm">Focus on identifying main ideas.</p>
              </div>
            </div>
          </Card>

          {/* Motivational Quote */}
          <Card>
            <p className="font-display text-lg text-secondary italic text-center leading-relaxed">
              "The will to win is important, but the will to prepare is vital."
            </p>
            <p className="text-muted text-sm text-center mt-3">— Joe Paterno</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Landing
