import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { useAuth } from '../contexts/AuthContext'
import { useHighlights } from '../hooks/useHighlights'
import HighlightableText from '../components/HighlightableText'
import DrillTimer from '../components/DrillTimer'
import { getChoiceText } from '../utils/answerChoiceUtils'
import { cn } from '../utils'
import { Button } from '../components/ui/Button' // Assuming standard Button component available or we style manually

const letterFromIndex = (index) => String.fromCharCode(65 + index)

const indexFromLetter = (letter) => {
  if (!letter || typeof letter !== 'string') return null
  const normalized = letter.trim().toUpperCase()
  const code = normalized.charCodeAt(0) - 65
  return code >= 0 && code < 26 ? code : null
}

const DrillSession = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, getAuthHeaders } = useAuth()
  const {
    drillSession,
    setDrillSession,
    selectedAnswers,
    setSelectedAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    resetSession
  } = useDrill()

  const { getQuestionHighlights, setQuestionHighlights } = useHighlights()

  const startTimeRef = useRef(null)
  const hasRestoredProgressRef = useRef(false)
  const drillIdRef = useRef(null)
  const autoSubmittedRef = useRef(false)

  const questions = Array.isArray(drillSession?.questions) ? drillSession.questions : []
  const fallbackPath = location.pathname.startsWith('/diagnostics') ? '/diagnostics' : '/drill'
  const isDiagnosticSession = drillSession?.origin === 'diagnostic'
  const task_id = location.state?.task_id // Task ID if this drill is from a study plan

  useEffect(() => {
    if (!drillSession) {
      navigate(fallbackPath, { replace: true })
      return
    }

    // Check if this is a new drill (different drill_id)
    const isNewDrill = drillIdRef.current !== drillSession.drill_id
    if (isNewDrill) {
      drillIdRef.current = drillSession.drill_id
      hasRestoredProgressRef.current = false
      autoSubmittedRef.current = false
    }

    // Set start time when drill session loads
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    // Only restore progress once per drill session
    if (!hasRestoredProgressRef.current) {
      hasRestoredProgressRef.current = true

      // Restore saved progress if available
      if (drillSession.current_question_index !== undefined && drillSession.current_question_index > 0) {
        setCurrentQuestionIndex(drillSession.current_question_index)
      } else {
        setCurrentQuestionIndex(0)
      }

      // Restore saved answers if available
      if (drillSession.user_answers && Object.keys(drillSession.user_answers).length > 0) {
        // Convert string keys to numbers for selectedAnswers state
        const restoredAnswers = {}
        Object.keys(drillSession.user_answers).forEach(key => {
          restoredAnswers[parseInt(key)] = drillSession.user_answers[key]
        })
        setSelectedAnswers(restoredAnswers)
      }
    }
  }, [drillSession, navigate, setCurrentQuestionIndex, setSelectedAnswers, fallbackPath])

  // Start the drill on the backend to record started_at timestamp
  useEffect(() => {
    if (!drillSession?.drill_id) return

    // Only start if drill hasn't been started yet
    if (drillSession.status === 'generated' || !drillSession.started_at) {
      const startDrill = async () => {
        try {
          const headers = await getAuthHeaders()
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

          const response = await fetch(`${apiBaseUrl}/skill-builder/drill/${drillSession.drill_id}/start`, {
            method: 'POST',
            headers
          })

          if (response.ok) {
            const result = await response.json()
            // Update drill session with started_at timestamp
            setDrillSession(prev => ({
              ...prev,
              started_at: result.started_at,
              status: 'in_progress'
            }))
          }
        } catch (error) {
          console.error('Error starting drill:', error)
        }
      }

      startDrill()
    }
  }, [drillSession?.drill_id, drillSession?.status, drillSession?.started_at, getAuthHeaders, setDrillSession])

  const currentQuestionData = useMemo(() => {
    if (questions.length === 0) return null
    return questions[currentQuestionIndex] || null
  }, [questions, currentQuestionIndex])

  useEffect(() => {
    if (!drillSession) return
    const maxIndex = questions.length - 1
    if (currentQuestionIndex > maxIndex) {
      setCurrentQuestionIndex(maxIndex >= 0 ? maxIndex : 0)
    }
  }, [currentQuestionIndex, drillSession, questions, setCurrentQuestionIndex])

  if (!drillSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-pulse text-text-secondary">Redirecting...</div>
      </div>
    )
  }

  const normalizedOptions = Array.isArray(currentQuestionData?.answer_choices)
    ? currentQuestionData.answer_choices
    : []

  // Get highlights for current question
  const currentQuestionHighlights = currentQuestionData?.id
    ? getQuestionHighlights(currentQuestionData.id)
    : []

  // Handler for when highlights change
  const handleHighlightChange = (newHighlights) => {
    if (currentQuestionData?.id) {
      setQuestionHighlights(currentQuestionData.id, newHighlights)
    }
  }

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!drillSession || questions.length === 0) return

    const total = questions.length
    let correctCount = 0

    // Prepare answers for backend
    const answers = questions.map((question, index) => {
      const userAnswerIndex = selectedAnswers[index]
      const correctIndex = indexFromLetter(question.correct_answer)
      const isCorrect = typeof userAnswerIndex === 'number' && userAnswerIndex === correctIndex
      if (isCorrect) {
        correctCount += 1
      }

      return {
        question_id: question.id,
        user_answer: userAnswerIndex !== undefined ? letterFromIndex(userAnswerIndex) : null,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        skills: [] // TODO: Add skills if available in question data
      }
    })

    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0

    const summary = {
      sessionId: drillSession.session_id || drillSession.drill_id,
      totalQuestions: total,
      correctAnswers: correctCount,
      score
    }

    // Submit to backend (both practice and diagnostic drills)
    try {
      // Calculate time taken in seconds
      const timeTakenSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : null

      const headers = await getAuthHeaders()

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/skill-builder/drill/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          drill_id: drillSession.drill_id || drillSession.session_id,
          user_id: currentUser?.uid || 'anonymous',
          answers: answers,
          time_taken: timeTakenSeconds
        })
      })

      if (response.ok) {
        // If this drill is from a study plan task, mark task as completed
        if (task_id) {
          // Task completion logic handled silently
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
          fetch(`${apiBaseUrl}/personalization/study-plan/task/${task_id}/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ drill_id: drillSession.drill_id || drillSession.session_id })
          }).catch(console.error)
        }
      }
    } catch (error) {
      console.error('Error submitting drill:', error)
    }

    // Navigate to appropriate summary page
    if (isDiagnosticSession) {
      navigate('/diagnostics/summary', {
        state: {
          summary
        }
      })
      return
    }

    const questionResults = questions.map((question, index) => {
      const answerChoices = Array.isArray(question?.answer_choices) ? question.answer_choices : []
      const userAnswerIndex = typeof selectedAnswers[index] === 'number' ? selectedAnswers[index] : null
      const correctIndex = indexFromLetter(question.correct_answer)
      return {
        questionId: question?.id,
        questionNumber: index + 1,
        questionText: question?.question_text ?? '',
        passageText: question?.passage_text,
        answerChoices,
        userAnswerIndex,
        correctIndex,
        isCorrect: typeof userAnswerIndex === 'number' && userAnswerIndex === correctIndex,
        questionType: question?.question_type ?? '',
        difficulty: question?.difficulty_level ?? ''
      }
    })

    navigate('/drill/summary', {
      state: {
        summary,
        questionResults,
        userHighlights: drillSession?.user_highlights || {}
      }
    })
  }

  const handleExit = async () => {
    // Save progress before exiting (unless it's a diagnostic)
    if (!isDiagnosticSession && drillSession) {
      try {
        const headers = await getAuthHeaders()
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

        // Convert selectedAnswers object to match backend format (string keys)
        const answersForBackend = {}
        Object.keys(selectedAnswers).forEach(key => {
          answersForBackend[key] = selectedAnswers[key]
        })

        await fetch(`${apiBaseUrl}/skill-builder/drills/${drillSession.drill_id}/progress`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            current_question_index: currentQuestionIndex,
            user_answers: answersForBackend,
            user_highlights: drillSession.user_highlights || {}
          })
        })
      } catch (error) {
        console.error('Error saving progress on exit:', error)
      }
    }

    const exitPath = isDiagnosticSession ? '/diagnostics' : '/drill'
    resetSession()
    navigate(exitPath)
  }

  // Handler for when timer expires - auto-submit the drill
  const handleTimeExpired = () => {
    // Prevent multiple auto-submits
    if (autoSubmittedRef.current) return
    autoSubmittedRef.current = true

    handleSubmit()
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Session Header */}
      <header className="h-20 border-b border-sand-dark/30 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta">Drill Session</span>
            <span className="font-slab font-semibold text-text-main dark:text-white capitalize">
              {currentQuestionData?.question_type || 'Practice'}
            </span>
          </div>
          <div className="h-8 w-px bg-sand-dark/50 hidden md:block"></div>
          <div className="flex items-center gap-2 hidden md:flex">
            <span className="text-xs font-bold text-text-main/40 dark:text-white/40 uppercase tracking-widest">Question</span>
            <span className="text-lg font-slab font-bold text-text-main dark:text-white">
              {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-3 bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-sand-dark/30 dark:border-white/10 shadow-soft">
            <span className="material-symbols-outlined text-sage text-lg">timer</span>
            {/* Custom Timer Styling */}
            <div className="text-sm font-slab font-bold tracking-widest text-text-main dark:text-white">
              <DrillTimer
                timeLimitSeconds={drillSession.time_limit_seconds}
                startedAt={drillSession.started_at}
                onTimeExpired={handleTimeExpired}
                className="text-inherit"
              />
            </div>
          </div>

          <button
            onClick={handleExit}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-sand-dark/30 hover:bg-terracotta-soft/50 hover:border-terracotta transition-all text-text-main/40 hover:text-terracotta"
            title="Exit Drill"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-16">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          {currentQuestionData ? (
            <>
              {/* Stimulus Card - Only if passage exists */}
              {currentQuestionData.passage_text && (
                <section className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-sand-dark/20 dark:border-white/5 relative overflow-hidden group">
                  <div className="absolute -right-24 -top-24 w-64 h-64 bg-sage-soft/30 dark:bg-sage/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage"></span>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Stimulus</span>
                    </div>
                    <div className="text-xl md:text-2xl font-light text-text-main dark:text-sand leading-relaxed font-serif">
                      <HighlightableText
                        text={currentQuestionData.passage_text}
                        highlights={currentQuestionHighlights}
                        onHighlightChange={handleHighlightChange}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Question & Answers */}
              <section className="space-y-10">
                <div className="max-w-4xl">
                  <h3 className="text-2xl md:text-3xl font-slab font-semibold text-text-main dark:text-white leading-tight">
                    <HighlightableText
                      text={currentQuestionData.question_text}
                      highlights={currentQuestionHighlights}
                      onHighlightChange={handleHighlightChange}
                    />
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  {normalizedOptions.map((option, idx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === idx
                    const letter = letterFromIndex(idx)
                    const text = getChoiceText(option)

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        className={cn(
                          "group flex items-start gap-6 p-6 rounded-2xl border transition-all text-left",
                          isSelected
                            ? "border-terracotta bg-terracotta-soft/30 shadow-soft"
                            : "border-sand-dark/40 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-terracotta hover:bg-white dark:hover:bg-white/10"
                        )}
                      >
                        <span className={cn(
                          "size-10 shrink-0 rounded-full border flex items-center justify-center font-slab font-bold text-lg transition-colors",
                          isSelected
                            ? "bg-terracotta border-terracotta text-white"
                            : "border-sand-dark/60 dark:border-white/20 text-text-main/50 dark:text-white/50 group-hover:bg-terracotta group-hover:text-white group-hover:border-terracotta"
                        )}>
                          {letter}
                        </span>
                        <span className={cn(
                          "text-lg pt-1.5 leading-relaxed",
                          isSelected ? "text-text-main dark:text-white font-medium" : "text-text-main/80 dark:text-sand/80"
                        )}>
                          {text}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-20 text-text-secondary opacity-50">
              Loading question... if stuck, please exit and try again.
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="mt-auto px-6 lg:px-10 py-6 border-t border-sand-dark/30 dark:border-white/5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-3 text-text-main/40 hover:text-text-main disabled:opacity-20 disabled:hover:text-text-main/40 transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Previous
          </button>

          {/* Question Dots - Hidden on small screens, shown on large (limited count) */}
          <div className="hidden lg:flex gap-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentQuestionIndex ? "w-8 bg-terracotta" : selectedAnswers[idx] !== undefined ? "bg-sage" : "bg-sand-dark/50"
                )}
              />
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={questions.length === 0}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-3"
            >
              Submit Drill <span className="material-symbols-outlined text-sm">check_circle</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-text-main dark:bg-white text-white dark:text-background-dark px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-3 group"
            >
              Next Question <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default DrillSession
