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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your study plan...</p>
        </div>
      </div>
    )
  }

  // No diagnostic state
  if (state === 'no_diagnostic') {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12 bg-surface-primary rounded-xl border border-border-default shadow-sm">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Complete a Diagnostic Test</h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Before we can create your personalized study plan, you need to complete a diagnostic test.
              This helps us understand your current skill level and create a plan tailored to your needs.
            </p>
            <button
              onClick={() => navigate('/diagnostics')}
              className="bg-button-primary text-white px-6 py-3 rounded-lg hover:bg-button-primary-hover transition duration-300"
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
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12 bg-surface-primary rounded-xl border border-border-default shadow-sm">
            <svg className="w-16 h-16 text-status-success mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Ready to Generate Your Study Plan</h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Great! You've completed the diagnostic test. Now we can create a personalized 10-week study plan
              with 30 targeted drill sessions based on your diagnostic results.
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-button-primary text-white px-6 py-3 rounded-lg hover:bg-button-primary-hover transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">{study_plan.title}</h1>
          <p className="text-text-secondary">
            Track your progress through your personalized 10-week study plan
          </p>
        </div>

        {/* Adaptive Plan Indicator */}
        {studyPlanData.adaptive && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-1">AI-Powered Adaptive Study Plan</h3>
                <p className="text-sm text-purple-700 mb-2">
                  Your plan adapts weekly based on your performance using advanced machine learning algorithms.
                  Complete your weekly tasks to trigger automatic plan optimization.
                </p>
                {studyPlanData.algorithm && (
                  <p className="text-xs text-purple-600 font-mono bg-purple-100 inline-block px-2 py-1 rounded">
                    Algorithm: {studyPlanData.algorithm}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Adaptation Message */}
        {adaptationMessage && (
          <div className={`rounded-xl p-4 mb-6 border ${
            adaptationMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {adaptationMessage.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{adaptationMessage.text}</span>
            </div>
          </div>
        )}

        {/* Overall Progress Card */}
        <div className="bg-surface-primary rounded-xl border border-border-default shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Overall Progress</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Circular progress */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-border-light"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallProgress / 100)}`}
                    className="text-button-primary transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-text-primary">{overallProgress}%</span>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between p-4 bg-accent-info-bg rounded-lg border border-border-default">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-button-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-text-secondary">Tasks Completed</span>
                </div>
                <span className="text-xl font-bold text-text-primary">{study_plan.completed_tasks}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-accent-success-bg rounded-lg border border-border-default">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-status-success mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-text-secondary">Weeks Remaining</span>
                </div>
                <span className="text-xl font-bold text-text-primary">{weeksRemaining}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-text-secondary mb-2">
              <span>Progress</span>
              <span className="text-status-success">{study_plan.completed_tasks}/{study_plan.total_tasks} tasks completed</span>
            </div>
            <div className="w-full bg-border-light rounded-full h-3">
              <div
                className="h-3 rounded-full bg-button-primary transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="bg-surface-primary rounded-xl border border-border-default shadow-sm p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Weekly Breakdown</h2>
          <p className="text-text-secondary mb-6">Click on the weeks to view detailed schedule</p>

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
    <div className={`border rounded-xl transition-all duration-300 ${
      isCurrentWeek
        ? 'border-button-primary bg-surface-primary shadow-md'
        : 'border-border-default bg-surface-primary'
    }`}>
      {/* Week Header */}
      <div
        className="p-4 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Week number badge */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              isCompleted
                ? 'bg-status-success text-white'
                : isCurrentWeek
                ? 'bg-button-primary text-white'
                : 'bg-surface-tertiary text-text-secondary'
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
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-text-primary">Week {week.week_number}</h3>
                {isCurrentWeek && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-button-primary text-white">
                    Current
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {formatDate(week.start_date)} - {formatDate(week.end_date)}
              </p>
            </div>
          </div>

          {/* Week stats */}
          <div className="flex items-center space-x-6">
            <div className="text-right hidden md:block">
              <div className="flex items-center text-text-secondary text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>{week.total_tasks} tasks</span>
              </div>
              <div className="flex items-center text-text-secondary text-sm mt-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{totalMinutes} min</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="text-right">
              <div className="text-sm font-medium text-status-success mb-1">
                {week.completed_tasks}/{week.total_tasks} completed
              </div>
              <div className="text-xs text-text-secondary">Progress</div>
            </div>

            {/* Adaptive Optimization Button - Only show for completed weeks with adaptive plans */}
            {isCompleted && isAdaptivePlan && (
              <button
                onClick={(e) => {
                  e.stopPropagation() // Prevent week expansion when clicking button
                  onWeekComplete(week.week_number)
                }}
                disabled={isAdaptingWeek}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isAdaptingWeek ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
        <div className="mt-4">
          <div className="w-full bg-border-light rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-status-success' : 'bg-button-primary'
              }`}
              style={{ width: `${weekProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expandable task list */}
      {isExpanded && (
        <div className="border-t border-border-default p-4 bg-surface-secondary">
          <div className="space-y-3">
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
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
      isCompleted
        ? 'bg-accent-success-bg border-status-success'
        : isInProgress
        ? 'bg-accent-info-bg border-button-primary'
        : 'bg-surface-primary border-border-default hover:border-button-primary'
    }`}>
      <div className="flex items-center space-x-4 flex-1">
        {/* Task status icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-status-success' : isInProgress ? 'bg-button-primary' : 'bg-surface-tertiary'
        }`}>
          {isCompleted ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h4 className={`font-medium ${isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
            {task.title}
          </h4>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-xs text-text-secondary flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                Video Lesson
              </span>
            )}
            {isCompleted && task.completed_at && (
              <span className="text-xs text-status-success">
                ✓ Completed
              </span>
            )}
            {isInProgress && !isCompleted && !isVideo && (
              <span className="text-xs text-button-primary font-medium">
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
          className="ml-4 px-4 py-2 bg-button-primary text-white text-sm font-medium rounded-lg hover:bg-button-primary-hover transition duration-300 whitespace-nowrap"
        >
          {isVideo ? 'Watch Video' : isInProgress ? 'Continue Drill' : 'Start Drill'}
        </button>
      )}
      {isCompleted && task.video_id && (
        <button
          onClick={() => onStartTask(task)}
          className="ml-4 px-4 py-2 bg-button-secondary border border-border-default text-text-primary text-sm font-medium rounded-lg hover:bg-surface-hover transition duration-300 whitespace-nowrap"
        >
          Watch Again
        </button>
      )}
      {isCompleted && task.drill_id && (
        <button
          onClick={() => window.location.href = `/drill-review/${task.drill_id}`}
          className="ml-4 px-4 py-2 bg-button-secondary border border-border-default text-text-primary text-sm font-medium rounded-lg hover:bg-surface-hover transition duration-300 whitespace-nowrap"
        >
          Review
        </button>
      )}
    </div>
  )
}

export default StudyPlan
