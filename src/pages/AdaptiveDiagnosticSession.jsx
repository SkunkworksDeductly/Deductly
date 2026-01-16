import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { cn } from '../utils'
import api from '../services/api'

const letterFromIndex = (index) => String.fromCharCode(65 + index)

const AdaptiveDiagnosticSession = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()

  // Get initial state from navigation
  const initialState = location.state || {}

  const [sessionId, setSessionId] = useState(initialState.sessionId)
  const [currentQuestion, setCurrentQuestion] = useState(initialState.question)
  const [progress, setProgress] = useState(initialState.progress || { current: 1, total: 30 })
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Redirect if no session data
  useEffect(() => {
    if (!sessionId || !currentQuestion) {
      navigate('/diagnostics', { replace: true })
    }
  }, [sessionId, currentQuestion, navigate])

  const handleAnswerSelect = (index) => {
    if (isSubmitting) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const answerLetter = letterFromIndex(selectedAnswer)
      const result = await api.submitDiagnosticAnswer(sessionId, answerLetter, currentUser?.uid)

      // Move immediately to next question or complete (no feedback shown)
      if (result.is_complete) {
        // Complete the diagnostic
        handleComplete()
      } else {
        // Move to next question
        setCurrentQuestion(result.next_question)
        setProgress(result.progress)
        setSelectedAnswer(null)
      }
      setIsSubmitting(false)

    } catch (err) {
      console.error('Error submitting answer:', err)
      setError('Failed to submit answer. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    try {
      const result = await api.completeDiagnostic(sessionId, currentUser?.uid)

      // Navigate to results/summary page
      navigate('/diagnostics/summary', {
        state: {
          sessionId,
          drillId: result.drill_id,
          summary: result.summary,
        }
      })
    } catch (err) {
      console.error('Error completing diagnostic:', err)
      setError('Failed to complete diagnostic. Please try again.')
    }
  }

  const handleExit = () => {
    // Progress is saved automatically, just navigate away
    if (window.confirm('Your progress is saved. exit diagnostic?')) {
      navigate('/diagnostics')
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-pulse text-text-secondary">Loading Question...</div>
      </div>
    )
  }

  const answerChoices = Array.isArray(currentQuestion.answer_choices)
    ? currentQuestion.answer_choices
    : []

  const progressPercent = Math.round((progress.current / progress.total) * 100)

  return (
    <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Session Header */}
      <header className="h-20 border-b border-sand-dark/30 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta">Diagnostic</span>
            <span className="font-slab font-semibold text-text-main dark:text-white capitalize">
              {currentQuestion.question_type || 'Logical Reasoning'}
            </span>
          </div>
          <div className="h-8 w-px bg-sand-dark/50 hidden md:block"></div>
          <div className="flex items-center gap-2 hidden md:flex">
            <span className="text-xs font-bold text-text-main/40 dark:text-white/40 uppercase tracking-widest">Question</span>
            <span className="text-lg font-slab font-bold text-text-main dark:text-white">
              {progress.current} of {progress.total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          {/* Progress Bar in Header */}
          <div className="hidden sm:block w-32 h-2 bg-sand-dark/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={handleExit}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-sand-dark/30 hover:bg-terracotta-soft/50 hover:border-terracotta transition-all text-text-main/40 hover:text-terracotta"
            title="Exit Diagnostic"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-16">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">

          {/* Stimulus Card */}
          {currentQuestion.passage_text && (
            <section className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-sand-dark/20 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute -right-24 -top-24 w-64 h-64 bg-sage-soft/30 dark:bg-sage/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage"></span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Stimulus</span>
                </div>
                <div className="text-xl md:text-2xl font-light text-text-main dark:text-sand leading-relaxed font-serif whitespace-pre-wrap">
                  {currentQuestion.passage_text}
                </div>
              </div>
            </section>
          )}

          {/* Question & Answers */}
          <section className="space-y-10">
            <div className="max-w-4xl">
              <h3 className="text-2xl md:text-3xl font-slab font-semibold text-text-main dark:text-white leading-tight">
                {currentQuestion.question_text}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-4xl">
              {answerChoices.map((choice, index) => {
                const letter = letterFromIndex(index)
                const isSelected = selectedAnswer === index

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isSubmitting}
                    className={cn(
                      "group flex items-start gap-6 p-6 rounded-2xl border transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-sand-dark/40 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-border-active hover:bg-white dark:hover:bg-white/10",
                      isSubmitting && !isSelected ? "opacity-50 cursor-not-allowed" : ""
                    )}
                  >
                    <span className={cn(
                      "size-10 shrink-0 rounded-full border flex items-center justify-center font-slab font-bold text-lg transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-sand-dark/60 dark:border-white/20 text-text-main/50 dark:text-white/50 group-hover:bg-border-active group-hover:text-white group-hover:border-border-active"
                    )}>
                      {letter}
                    </span>
                    <span className={cn(
                      "text-lg pt-1.5 leading-relaxed flex-1",
                      isSelected
                        ? "text-text-main dark:text-white font-medium"
                        : "text-text-main/80 dark:text-sand/80"
                    )}>
                      {typeof choice === 'string' ? choice : choice.text || choice.content}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800/30 text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="mt-auto px-6 lg:px-10 py-6 border-t border-sand-dark/30 dark:border-white/5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-end">
          <Button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null || isSubmitting}
            size="lg"
            className={cn(
              "shadow-lg transition-all",
              isSubmitting ? "opacity-90" : "hover:-translate-y-1"
            )}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            {!isSubmitting && <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default AdaptiveDiagnosticSession
