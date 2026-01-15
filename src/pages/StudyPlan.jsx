import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDrill } from '../contexts/DrillContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils'

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
      setState('no_diagnostic') // Fallback mostly
    }
  }

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true)
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      const response = await fetch(`${apiBaseUrl}/personalization/study-plan/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          total_weeks: 10,
        })
      })

      if (response.ok) {
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
        setAdaptationMessage({
          type: 'success',
          text: `Week ${weekNumber} completed! Plan updated. Avg reward: ${(result.avg_reward * 100).toFixed(1)}%`
        })
        await fetchStudyPlan()
        setTimeout(() => setAdaptationMessage(null), 5000)
      } else {
        const error = await response.json()
        setAdaptationMessage({
          type: 'error',
          text: error.error || 'Failed to adapt plan'
        })
        setTimeout(() => setAdaptationMessage(null), 5000)
      }
    } catch (error) {
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
    if (task.task_type === 'video' && task.video_id) {
      navigate(`/curriculum/${task.video_id}`)
      return
    }

    try {
      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      if (task.drill_id && task.status !== 'completed') {
        const drillResponse = await fetch(`${apiBaseUrl}/skill-builder/drills/${task.drill_id}?include_questions=true`, {
          method: 'GET',
          headers
        })

        if (drillResponse.ok) {
          const drillData = await drillResponse.json()
          if (drillData.status !== 'completed') {
            setDrillSession(drillData)
            navigate('/drill/session', { state: { task_id: task.id } })
            return
          }
        }
      }

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

      if (!response.ok) throw new Error('Failed to create drill session')

      const drillData = await response.json()

      try {
        await fetch(`${apiBaseUrl}/personalization/study-plan/task/${task.id}/link-drill`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ drill_id: drillData.drill_id })
        })
      } catch (linkError) {
        console.error('Error linking drill to task:', linkError)
      }

      setDrillSession(drillData)
      navigate('/drill/session', { state: { task_id: task.id } })

    } catch (error) {
      console.error('Error creating drill from task:', error)
      alert('Failed to start drill. Please try again.')
    }
  }


  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-main/60 text-sm font-medium animate-pulse">Loading Roadmap...</p>
        </div>
      </div>
    )
  }

  if (state === 'no_diagnostic') {
    return (
      <div className="p-6 lg:p-12 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="size-24 rounded-full bg-sand-dark/10 flex items-center justify-center text-terracotta mb-4">
          <span className="material-symbols-outlined text-5xl">assignment_add</span>
        </div>
        <div className="space-y-4 max-w-lg">
          <h1 className="text-4xl font-black text-text-main dark:text-white">Start Your Journey</h1>
          <p className="text-lg text-text-main/60 dark:text-white/60">
            Before we can build your personalized roadmap, we need to understand your current skill level. Take the diagnostic to get started.
          </p>
        </div>
        <Button onClick={() => navigate('/diagnostics')} size="lg" className="px-12 py-6 text-lg">
          Take Diagnostic
        </Button>
      </div>
    )
  }

  if (state === 'no_plan') {
    return (
      <div className="p-6 lg:p-12 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="size-24 rounded-full bg-sage/10 flex items-center justify-center text-sage mb-4">
          <span className="material-symbols-outlined text-5xl">psychology</span>
        </div>
        <div className="space-y-4 max-w-lg">
          <h1 className="text-4xl font-black text-text-main dark:text-white">Analysis Complete</h1>
          <p className="text-lg text-text-main/60 dark:text-white/60">
            We've analyzed your diagnostic results. Ready to generate your adaptive 10-week study plan?
          </p>
        </div>
        <Button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          size="lg"
          className="px-12 py-6 text-lg"
        >
          {isGenerating ? 'Generating Roadmap...' : 'Generate My Plan'}
        </Button>
      </div>
    )
  }

  const { study_plan, weeks } = studyPlanData
  const overallProgress = study_plan.total_tasks > 0
    ? Math.round((study_plan.completed_tasks / study_plan.total_tasks) * 100)
    : 0

  const weeksCompleted = weeks.filter(w => w.completed_tasks === w.total_tasks).length
  const weeksRemaining = study_plan.total_weeks - weeksCompleted

  return (
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      {/* Header */}
      <header className="grid lg:grid-cols-2 gap-12 border-b border-sand-dark/30 dark:border-white/5 pb-12">
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-widest text-terracotta font-sans">Personalized Roadmap</p>
          <h1 className="text-5xl md:text-6xl font-black text-text-main dark:text-white leading-[0.9]">
            {study_plan.title || "Study Plan"}<br />
            <span className="text-text-main/40 dark:text-white/40 font-medium tracking-tight text-4xl">Week {currentWeek} of {study_plan.total_weeks}</span>
          </h1>
          {studyPlanData.adaptive && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary" className="bg-primary/10 border-primary/20 text-primary">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                Adaptive
              </Badge>
              {studyPlanData.algorithm && (
                <span className="text-xs font-mono text-text-main/40 uppercase pl-2 border-l border-sand-dark/20">
                  {studyPlanData.algorithm}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress Stats */}
        <div className="flex flex-col justify-end gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Card variant="flat" className="p-6 flex flex-col items-start gap-1">
              <span className="text-4xl font-black text-primary">{overallProgress}%</span>
              <span className="text-xs font-bold uppercase tracking-widest text-text-main/40">Total Progress</span>
            </Card>
            <Card variant="flat" className="p-6 flex flex-col items-start gap-1">
              <span className="text-4xl font-black text-sage">{weeksRemaining}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-text-main/40">Weeks To Go</span>
            </Card>
          </div>
          {/* Visual Bar */}
          <div className="h-4 w-full bg-sand-dark/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all duration-1000 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Adaptation Success/Error Message */}
      {adaptationMessage && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2",
          adaptationMessage.type === 'success' ? "bg-sage/10 text-sage" : "bg-red-500/10 text-red-500"
        )}>
          <span className="material-symbols-outlined">
            {adaptationMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {adaptationMessage.text}
        </div>
      )}

      {/* Weekly Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-main dark:text-white pb-4 border-b border-sand-dark/10 dark:border-white/5">Weekly Schedule</h2>
        <div className="space-y-4">
          {weeks.map((week) => (
            <WeekCard
              key={week.week_number}
              week={week}
              isCurrentWeek={week.week_number === currentWeek}
              onStartTask={handleStartTask}
              onWeekComplete={handleWeekComplete}
              isAdaptingWeek={adaptingWeek === week.week_number}
              isAdaptivePlan={studyPlanData.adaptive}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// WeekCard Component
const WeekCard = ({ week, isCurrentWeek, onStartTask, onWeekComplete, isAdaptingWeek, isAdaptivePlan }) => {
  const [isExpanded, setIsExpanded] = useState(isCurrentWeek)
  const isCompleted = week.completed_tasks === week.total_tasks
  const weekProgress = week.total_tasks > 0 ? Math.round((week.completed_tasks / week.total_tasks) * 100) : 0
  const totalMinutes = week.tasks.reduce((sum, task) => sum + task.estimated_minutes, 0)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card
      variant={isCurrentWeek ? "elevated" : "default"}
      className={cn(
        "group transition-all duration-300 border overflow-hidden",
        isCurrentWeek ? "border-terracotta/30 dark:border-terracotta/20 ring-1 ring-terracotta/10" : "border-sand-dark/10"
      )}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-sand/10 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-6">
          {/* Number Badge */}
          <div className={cn(
            "size-12 rounded-xl flex items-center justify-center text-xl font-bold font-mono border",
            isCompleted
              ? "bg-sage/10 text-sage border-sage/20"
              : isCurrentWeek
                ? "bg-terracotta text-white border-terracotta shadow-lg shadow-terracotta/20"
                : "bg-surface-tertiary text-text-main/40 border-transparent"
          )}>
            {isCompleted ? <span className="material-symbols-outlined">check</span> : week.week_number}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-main dark:text-white">Week {week.week_number}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-text-main/40 dark:text-white/40">
              {formatDate(week.start_date)} - {formatDate(week.end_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Stats (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-sm text-text-main/40 font-medium">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">list_alt</span>
              {week.total_tasks} Tasks
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">timer</span>
              {totalMinutes}m
            </span>
          </div>

          {/* Adaptive Button (if completed) */}
          {isCompleted && isAdaptivePlan && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onWeekComplete(week.week_number); }}
              disabled={isAdaptingWeek}
              className="hidden sm:flex text-xs"
            >
              {isAdaptingWeek ? (
                <span className="animate-spin mr-2">⟳</span>
              ) : (
                <span className="material-symbols-outlined text-sm mr-2">tune</span>
              )}
              {isAdaptingWeek ? 'Optimizing...' : 'Re-Optimize'}
            </Button>
          )}

          <span className={cn(
            "material-symbols-outlined text-text-main/40 transition-transform duration-300",
            isExpanded && "rotate-180"
          )}>
            expand_more
          </span>
        </div>
      </div>

      {/* Progress Line (always visible at bottom of header area roughly) */}
      <div className="h-1 bg-sand-dark/5 dark:bg-white/5 w-full">
        <div className={cn(
          "h-full transition-all duration-500",
          isCompleted ? "bg-sage" : "bg-terracotta"
        )} style={{ width: `${weekProgress}%` }} />
      </div>

      {/* Expanded Content */}
      <div className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden bg-sand/5 dark:bg-white/[0.02]">
          <div className="p-6 space-y-3">
            {week.tasks.map(task => (
              <TaskCard key={task.id} task={task} onStartTask={onStartTask} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// TaskCard Component
const TaskCard = ({ task, onStartTask }) => {
  const isCompleted = task.status === 'completed'
  const isVideo = task.task_type === 'video'

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 gap-4",
      isCompleted
        ? "bg-sage/5 border-sage/10"
        : "bg-white dark:bg-white/5 border-sand-dark/10 dark:border-white/10 hover:border-text-main/20 hover:shadow-sm"
    )}>
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn(
          "size-10 rounded-full flex items-center justify-center shrink-0",
          isCompleted ? "bg-sage/10 text-sage" : isVideo ? "bg-terracotta/10 text-terracotta" : "bg-primary/10 text-primary"
        )}>
          <span className="material-symbols-outlined">
            {isCompleted ? 'check' : isVideo ? 'play_circle' : 'edit_document'}
          </span>
        </div>

        <div>
          <h4 className={cn(
            "font-bold text-sm text-text-main dark:text-white",
            isCompleted && "line-through opacity-60"
          )}>
            {task.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-main/50 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">schedule</span>
              {task.estimated_minutes} min
            </span>
            {!isVideo && task.task_config.question_count && (
              <>
                <span className="size-1 rounded-full bg-current opacity-30" />
                <span>{task.task_config.question_count} Questions</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isCompleted && (
        <Button
          onClick={() => onStartTask(task)}
          size="sm"
          variant={isVideo ? "outline" : "primary"}
          className={cn("w-full sm:w-auto", isVideo && "border-sand-dark/20")}
        >
          {isVideo ? 'Watch Lesson' : 'Start Drill'}
        </Button>
      )}

      {isCompleted && (
        <Button
          onClick={() => onStartTask(task)}
          size="sm"
          variant="ghost"
          className="w-full sm:w-auto text-xs opacity-60 hover:opacity-100"
        >
          {isVideo ? 'Watch Again' : 'Review'}
        </Button>
      )}
    </div>
  )
}

export default StudyPlan
