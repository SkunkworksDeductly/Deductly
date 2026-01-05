import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDrill } from '../contexts/DrillContext'

const StudyPlan = () => {
  const [state, setState] = useState('loading') // 'loading', 'no_diagnostic', 'no_plan', 'has_plan'
  const [studyPlanData, setStudyPlanData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(null)
  const [adaptingWeek, setAdaptingWeek] = useState(null) // Track which week is being adapted
  const [adaptationMessage, setAdaptationMessage] = useState(null) // Success/error message
  const navigate = useNavigate()
  const { currentUser, getAuthHeaders } = useAuth()
  const { setDrillSession } = useDrill()

  useEffect(() => {
    fetchStudyPlan()
  }, [])

  useEffect(() => {
    // Calculate current week based on today's date
    if (studyPlanData?.weeks) {
      const today = new Date()
      const currentWeekData = studyPlanData.weeks.find(week => {
        const startDate = new Date(week.start_date)
        const endDate = new Date(week.end_date)
        return today >= startDate && today <= endDate
      })
      setCurrentWeek(currentWeekData?.week_number || 1)
    }
  }, [studyPlanData])

  const fetchStudyPlan = async () => {
    try {
      setState('loading')
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBaseUrl}/personalization/study-plan`, {
        method: 'GET',
        headers
      })

      const data = await response.json()

      if (!data.has_diagnostic) {
        setState('no_diagnostic')
      } else if (!data.has_study_plan) {
        setState('no_plan')
      } else {
        setState('has_plan')
        setStudyPlanData(data)
      }
    } catch (error) {
      console.error('Error fetching study plan:', error)
      setState('no_diagnostic')
    }
  }

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true)
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      // Use adaptive plan generation with default parameters
      const response = await fetch(`${apiBaseUrl}/personalization/study-plan/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          total_weeks: 10,  // Default to 10 weeks
          // target_test_date can be added later
        })
      })

      if (response.ok) {
        // Refresh to fetch the newly created plan
        await fetchStudyPlan()
      } else {
        const error = await response.json()
        console.error('Error generating study plan:', error)
        alert(error.error || 'Failed to generate study plan')
      }
    } catch (error) {
      console.error('Error generating study plan:', error)
      alert('Failed to generate study plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWeekComplete = async (weekNumber) => {
    try {
      setAdaptingWeek(weekNumber)
      setAdaptationMessage(null)

      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      const response = await fetch(`${apiBaseUrl}/personalization/study-plan/adapt`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          completed_week: weekNumber
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Adaptation result:', result)

        // Show success message
        setAdaptationMessage({
          type: 'success',
          text: `Week ${weekNumber} completed! Your plan has been updated based on your performance.
                 Avg reward: ${(result.avg_reward * 100).toFixed(1)}%`
        })

        // Reload study plan to see updated weeks
        await fetchStudyPlan()

        // Clear message after 5 seconds
        setTimeout(() => setAdaptationMessage(null), 5000)
      } else {
        const error = await response.json()
        console.error('Error adapting plan:', error)
        setAdaptationMessage({
          type: 'error',
          text: error.error || 'Failed to adapt plan'
        })
        setTimeout(() => setAdaptationMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error adapting plan:', error)
      setAdaptationMessage({
        type: 'error',
        text: 'Failed to adapt plan. Please try again.'
      })
      setTimeout(() => setAdaptationMessage(null), 5000)
    } finally {
      setAdaptingWeek(null)
    }
  }

  const handleStartTask = async (task) => {
    // Handle video tasks
    if (task.task_type === 'video' && task.video_id) {
      navigate(`/curriculum/${task.video_id}`)
      return
    }

    // Handle drill tasks
    try {
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      // Check if task has an existing incomplete drill
      if (task.drill_id && task.status !== 'completed') {
        // Resume existing drill
        const drillResponse = await fetch(`${apiBaseUrl}/skill-builder/drills/${task.drill_id}?include_questions=true`, {
          method: 'GET',
          headers
        })

        if (drillResponse.ok) {
          const drillData = await drillResponse.json()

          // Only resume if drill is incomplete
          if (drillData.status !== 'completed') {
            // Set drill session in context with saved progress
            setDrillSession(drillData)

            // Navigate to drill session with task_id in state
            navigate('/drill/session', {
              state: {
                task_id: task.id
              }
            })
            return
          }
        }
      }

      // Create new drill session from task config
      const taskConfig = task.task_config
      const payload = {
        user_id: currentUser?.uid || 'anonymous',
        ...taskConfig
      }

      const response = await fetch(`${apiBaseUrl}/skill-builder/drill`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error creating drill:', errorData)
        throw new Error('Failed to create drill session')
      }

      const drillData = await response.json()

      // Link drill_id to task immediately
      try {
        await fetch(`${apiBaseUrl}/personalization/study-plan/task/${task.id}/link-drill`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            drill_id: drillData.drill_id
          })
        })
      } catch (linkError) {
        console.error('Error linking drill to task:', linkError)
        // Continue anyway - we'll still track completion
      }

      // Set drill session in context
      setDrillSession(drillData)

      // Navigate to drill session with task_id in state
      navigate('/drill/session', {
        state: {
          task_id: task.id // Pass task_id so we can mark it complete on submission
        }
      })
    } catch (error) {
      console.error('Error creating drill from task:', error)
      alert('Failed to start drill. Please try again.')
    }
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your study plan...</p>
        </div>
      </div>
    )
  }

  // No diagnostic state
  if (state === 'no_diagnostic') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 rounded-3xl border border-border-default shadow-xl backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-serif text-3xl font-normal text-text-primary mb-4 tracking-tight">Complete a Diagnostic Test</h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto text-base leading-relaxed">
              Before we can create your personalized study plan, you need to complete a diagnostic test.
              This helps us understand your current skill level and create a plan tailored to your needs.
            </p>
            <button
              onClick={() => navigate('/diagnostics')}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 text-white font-semibold shadow-lg transform hover:-translate-y-0.5"
            >
              Take Diagnostic Test
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Has diagnostic but no plan state
  if (state === 'no_plan') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 rounded-3xl border border-border-default shadow-xl backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-success/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-serif text-3xl font-normal text-text-primary mb-4 tracking-tight">Ready to Generate Your Study Plan</h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto text-base leading-relaxed">
              Great! You've completed the diagnostic test. Now we can create a personalized 10-week study plan
              with 30 targeted drill sessions based on your diagnostic results.
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 text-white font-semibold shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGenerating ? 'Generating Plan...' : 'Generate Study Plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Has plan state - render full study plan UI
  const { study_plan, weeks } = studyPlanData
  const overallProgress = study_plan.total_tasks > 0
    ? Math.round((study_plan.completed_tasks / study_plan.total_tasks) * 100)
    : 0

  // Calculate week-based stats
  const weeksCompleted = weeks.filter(w => w.completed_tasks === w.total_tasks).length
  const weeksRemaining = study_plan.total_weeks - weeksCompleted

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-5xl font-normal text-text-primary mb-3 tracking-tight">{study_plan.title}</h1>
          <p className="text-text-secondary text-base">
            Track your progress through your personalized 10-week study plan
          </p>
        </div>

        {/* Adaptive Plan Indicator */}
        {studyPlanData.adaptive && (
          <div className="bg-gradient-to-r from-brand-secondary/10 to-brand-primary/10 border border-brand-primary/20 rounded-2xl p-6 mb-8 shadow-lg backdrop-blur-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-2 text-lg">AI-Powered Adaptive Study Plan</h3>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                  Your plan adapts weekly based on your performance using advanced machine learning algorithms.
                  Complete your weekly tasks to trigger automatic plan optimization.
                </p>
                {studyPlanData.algorithm && (
                  <p className="text-xs text-brand-primary font-mono bg-bg-primary/30 inline-block px-3 py-1.5 rounded-lg border border-border-subtle">
                    Algorithm: {studyPlanData.algorithm}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Adaptation Message */}
        {adaptationMessage && (
          <div className={`rounded-2xl p-5 mb-8 border backdrop-blur-sm ${
            adaptationMessage.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            <div className="flex items-center">
              {adaptationMessage.type === 'success' ? (
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{adaptationMessage.text}</span>
            </div>
          </div>
        )}

        {/* Overall Progress Card */}
        <div className="bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 rounded-3xl border border-border-default shadow-xl backdrop-blur-xl p-8 mb-10">
          <h2 className="font-serif text-3xl font-normal text-text-primary mb-8 tracking-tight">Overall Progress</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Circular progress */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-border-subtle"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#progress-gradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - overallProgress / 100)}`}
                    className="transition-all duration-500"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-5xl font-normal text-text-primary">{overallProgress}%</span>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="space-y-5 md:col-span-2">
              <div className="flex items-center justify-between p-5 bg-bg-primary/40 rounded-2xl border border-border-subtle backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-text-secondary text-sm">Tasks Completed</span>
                </div>
                <span className="font-serif text-3xl font-normal text-text-primary">{study_plan.completed_tasks}</span>
              </div>

              <div className="flex items-center justify-between p-5 bg-bg-primary/40 rounded-2xl border border-border-subtle backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-text-secondary text-sm">Weeks Remaining</span>
                </div>
                <span className="font-serif text-3xl font-normal text-text-primary">{weeksRemaining}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-text-secondary mb-3">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary">Progress</span>
              <span className="text-success font-medium">{study_plan.completed_tasks}/{study_plan.total_tasks} tasks completed</span>
            </div>
            <div className="w-full bg-border-subtle rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 rounded-3xl border border-border-default shadow-xl backdrop-blur-xl p-8">
          <h2 className="font-serif text-3xl font-normal text-text-primary mb-3 tracking-tight">Weekly Breakdown</h2>
          <p className="text-text-secondary mb-8 text-sm">Click on the weeks to view detailed schedule</p>

          <div className="space-y-4">
            {weeks.map((week) => {
              const isCurrentWeek = week.week_number === currentWeek
              const isCompleted = week.completed_tasks === week.total_tasks
              const weekProgress = week.total_tasks > 0
                ? Math.round((week.completed_tasks / week.total_tasks) * 100)
                : 0

              return (
                <WeekCard
                  key={week.week_number}
                  week={week}
                  isCurrentWeek={isCurrentWeek}
                  isCompleted={isCompleted}
                  weekProgress={weekProgress}
                  onStartTask={handleStartTask}
                  onWeekComplete={handleWeekComplete}
                  isAdaptingWeek={adaptingWeek === week.week_number}
                  isAdaptivePlan={studyPlanData.adaptive}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// WeekCard Component
const WeekCard = ({ week, isCurrentWeek, isCompleted, weekProgress, onStartTask, onWeekComplete, isAdaptingWeek, isAdaptivePlan }) => {
  const [isExpanded, setIsExpanded] = useState(isCurrentWeek)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const totalMinutes = week.tasks.reduce((sum, task) => sum + task.estimated_minutes, 0)

  return (
    <div className={`border rounded-2xl transition-all duration-300 backdrop-blur-sm ${
      isCurrentWeek
        ? 'border-brand-primary bg-bg-primary/40 shadow-lg shadow-brand-primary/10'
        : 'border-border-subtle bg-bg-primary/20'
    }`}>
      {/* Week Header */}
      <div
        className="p-6 cursor-pointer hover:bg-bg-tertiary/30 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-5">
            {/* Week number badge */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-serif text-xl font-normal ${
              isCompleted
                ? 'bg-success/20 text-success border-2 border-success/30'
                : isCurrentWeek
                ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-lg'
                : 'bg-bg-tertiary/50 text-text-tertiary border-2 border-border-subtle'
            }`}>
              {isCompleted ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                week.week_number
              )}
            </div>

            {/* Week info */}
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-medium text-text-primary">Week {week.week_number}</h3>
                {isCurrentWeek && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-sm">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm text-text-tertiary mt-1">
                {formatDate(week.start_date)} - {formatDate(week.end_date)}
              </p>
            </div>
          </div>

          {/* Week stats */}
          <div className="flex items-center space-x-8">
            <div className="text-right hidden md:block">
              <div className="flex items-center text-text-secondary text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>{week.total_tasks} tasks</span>
              </div>
              <div className="flex items-center text-text-secondary text-sm mt-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{totalMinutes} min</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="text-right">
              <div className="text-sm font-semibold text-success mb-1">
                {week.completed_tasks}/{week.total_tasks} completed
              </div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider">Progress</div>
            </div>

            {/* Adaptive Optimization Button - Only show for completed weeks with adaptive plans */}
            {isCompleted && isAdaptivePlan && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onWeekComplete(week.week_number)
                }}
                disabled={isAdaptingWeek}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-secondary to-brand-primary text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isAdaptingWeek ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Optimize Plan</span>
                  </>
                )}
              </button>
            )}

            {/* Expand/collapse icon */}
            <svg
              className={`w-5 h-5 text-text-secondary transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="w-full bg-border-subtle rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-gradient-to-r from-success to-success/80' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'
              }`}
              style={{ width: `${weekProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expandable task list */}
      {isExpanded && (
        <div className="border-t border-border-subtle p-6 bg-bg-tertiary/20">
          <div className="space-y-4">
            {week.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onStartTask={onStartTask} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// TaskCard Component
const TaskCard = ({ task, onStartTask }) => {
  const isCompleted = task.status === 'completed'
  const isInProgress = task.status === 'in_progress' || (task.drill_id && task.status !== 'completed')
  const isVideo = task.task_type === 'video'

  return (
    <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 ${
      isCompleted
        ? 'bg-success/5 border-success/30'
        : isInProgress
        ? 'bg-brand-primary/5 border-brand-primary/30'
        : 'bg-bg-primary/30 border-border-subtle hover:border-brand-primary/50 hover:bg-bg-primary/40'
    }`}>
      <div className="flex items-center space-x-4 flex-1">
        {/* Task status icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-success/20 border-2 border-success/30' : isInProgress ? 'bg-gradient-to-br from-brand-primary to-brand-secondary shadow-md' : 'bg-bg-tertiary/50 border-2 border-border-subtle'
        }`}>
          {isCompleted ? (
            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-base ${isCompleted ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
            {task.title}
          </h4>
          <div className="flex items-center flex-wrap gap-3 mt-2">
            <span className="text-xs text-text-secondary flex items-center">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.estimated_minutes} min
            </span>
            {!isVideo && task.task_config.question_count && (
              <span className="text-xs text-text-secondary">
                {task.task_config.question_count} questions
              </span>
            )}
            {isVideo && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary font-semibold border border-brand-secondary/20">
                Video Lesson
              </span>
            )}
            {isCompleted && task.completed_at && (
              <span className="text-xs text-success font-semibold flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </span>
            )}
            {isInProgress && !isCompleted && !isVideo && (
              <span className="text-xs text-brand-primary font-semibold">
                In Progress
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      {!isCompleted && (
        <button
          onClick={() => onStartTask(task)}
          className="ml-4 px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-sm font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 whitespace-nowrap shadow-md transform hover:-translate-y-0.5"
        >
          {isVideo ? 'Watch Video' : isInProgress ? 'Continue Drill' : 'Start Drill'}
        </button>
      )}
      {isCompleted && task.video_id && (
        <button
          onClick={() => onStartTask(task)}
          className="ml-4 px-5 py-2.5 bg-transparent border border-border-default text-text-secondary text-sm font-medium rounded-xl hover:bg-bg-tertiary hover:border-border-hover transition-all duration-200 whitespace-nowrap"
        >
          Watch Again
        </button>
      )}
      {isCompleted && task.drill_id && (
        <button
          onClick={() => window.location.href = `/drill-review/${task.drill_id}`}
          className="ml-4 px-5 py-2.5 bg-transparent border border-border-default text-text-secondary text-sm font-medium rounded-xl hover:bg-bg-tertiary hover:border-border-hover transition-all duration-200 whitespace-nowrap"
        >
          Review
        </button>
      )}
    </div>
  )
}

export default StudyPlan
