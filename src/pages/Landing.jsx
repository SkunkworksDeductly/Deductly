import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ScaleBar } from '../components/ui/ScaleBar'
import { Badge } from '../components/ui/Badge'

const Landing = () => {
  const { currentUser } = useAuth()
  const userName = currentUser?.displayName?.split(' ')[0] || 'Student'
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(true)

  // Mock data for UI demo (replace with real data as available)
  const currentScore = 164
  const targetScore = 175
  const projectedScore = 168

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
    const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  return (
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-sand-dark/30 dark:border-white/5 pb-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sand-dark/20 dark:bg-white/10 text-[11px] font-bold uppercase tracking-wider text-text-main/60 dark:text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse"></span>
            Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-main dark:text-white tracking-tight">
            Good Morning, <span className="text-terracotta font-serif italic">{userName}</span>
          </h1>
          <p className="text-text-main/60 dark:text-sand/60 font-medium max-w-xl">
            You're on a <span className="text-text-main dark:text-white font-bold">12 day streak</span>. constant activity is the key to mastery.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/drill">
            <Button>Start Session</Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-12">

          {/* Progress Overview */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-32 bg-terracotta/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-terracotta/10"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 mb-1">Projected Score</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-text-main dark:text-white tracking-tighter">{projectedScore}</span>
                      <span className="text-sage font-bold text-sm">+2 this week</span>
                    </div>
                  </div>
                  <Badge variant="primary">Top 12%</Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-main/40 dark:text-white/40">
                    <span>Current: {currentScore}</span>
                    <span>Target: {targetScore}</span>
                  </div>
                  <ScaleBar score={projectedScore} min={120} max={180} />
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between group cursor-pointer hover:border-terracotta/30 transition-colors">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 mb-4">Accuracy</h3>
                <span className="text-4xl font-black text-text-main dark:text-white tracking-tighter">84%</span>
              </div>

              <div className="w-full bg-sand-dark/20 dark:bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-text-main dark:bg-white h-full rounded-full w-[84%]"></div>
              </div>
            </Card>
          </section>

          {/* Quick Actions / Recommendations */}
          <section>
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-terracotta">bolt</span>
              Recommended Focus
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="interactive" className="group">
                <div className="mb-4 inline-flex items-center justify-center p-3 bg-terracotta-soft text-terracotta rounded-xl group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <h4 className="text-xl font-bold text-text-main dark:text-white mb-2">Logical Reasoning: Flaws</h4>
                <p className="text-sm text-text-main/60 dark:text-sand/60 mb-6">
                  Your accuracy in Flaws is 15% lower than your average. Let's fix that.
                </p>
                <Link to="/drill/types/flaws">
                  <span className="text-xs font-bold uppercase tracking-widest text-terracotta group-hover:underline">Start Drill &rarr;</span>
                </Link>
              </Card>

              <Card variant="interactive" className="group">
                <div className="mb-4 inline-flex items-center justify-center p-3 bg-sage-soft text-sage rounded-xl group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <h4 className="text-xl font-bold text-text-main dark:text-white mb-2">Timed Section: RC</h4>
                <p className="text-sm text-text-main/60 dark:text-sand/60 mb-6">
                  You haven't done a timed Reading Comp section in 5 days.
                </p>
                <Link to="/drill/timed/rc">
                  <span className="text-xs font-bold uppercase tracking-widest text-sage group-hover:underline">Start Section &rarr;</span>
                </Link>
              </Card>
            </div>
          </section>
        </div>

        {/* Sidebar Column (Stats/History) */}
        <div className="lg:col-span-4 space-y-8">
          <Card variant="flat">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 mb-6">Recent Activity</h3>

            {isLoadingActivity ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-terracotta">refresh</span>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((drill, idx) => {
                  const isCompleted = drill.status === 'completed'
                  const score = drill.score_percentage ? Math.round(drill.score_percentage) : null

                  return (
                    <Link
                      key={idx}
                      to={isCompleted ? `/drill/results/${drill.drill_id}` : '#'}
                      className="flex items-start gap-4 group"
                    >
                      <div className={`mt-1 size-2 rounded-full ${isCompleted ? 'bg-sage' : 'bg-sand-dark'}`}></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-text-main dark:text-white group-hover:text-terracotta transition-colors">
                          {drill.drill_type || 'Practice Session'}
                        </h4>
                        <p className="text-xs text-text-main/40 dark:text-white/40 mt-1">
                          {formatTimeAgo(drill.completed_at)} • {drill.question_count || 0} Questions
                        </p>
                      </div>
                      {score !== null && (
                        <span className={`text-sm font-bold ${score >= 80 ? 'text-sage' : 'text-terracotta'}`}>
                          {score}%
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-main/40 text-sm">
                No recent activity.
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-sand-dark/10 dark:border-white/5">
              <Link to="/analytics" className="text-xs font-bold uppercase tracking-widest text-text-main/50 hover:text-terracotta transition-colors flex items-center justify-between">
                View Full History
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </Card>

          <Card className="bg-text-main text-sand-light dark:bg-white dark:text-text-main border-none">
            <div className="mb-6 opacity-50">
              <span className="material-symbols-outlined text-4xl">format_quote</span>
            </div>
            <p className="font-serif text-xl italic leading-relaxed opacity-90 mb-4">
              "The essence of strategy is choosing what not to do."
            </p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">
              — Michael Porter
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Landing
