import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { useAuth } from '../contexts/AuthContext'

const CountdownTimer = ({ totalSeconds, onTimeUp }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds)

  useEffect(() => {
    setSecondsRemaining(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onTimeUp?.()
      return
    }

    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsRemaining, onTimeUp])

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const percentage = (secondsRemaining / totalSeconds) * 100

  // Determine color based on time remaining
  let bgColor = 'bg-accent-mint'
  let textColor = 'text-accent-mint'
  let borderColor = 'border-accent-mint'

  if (percentage <= 25) {
    bgColor = 'bg-red-500'
    textColor = 'text-red-500'
    borderColor = 'border-red-500'
  } else if (percentage <= 50) {
    bgColor = 'bg-accent-peach'
    textColor = 'text-accent-peach'
    borderColor = 'border-accent-peach'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${borderColor} bg-white transition-colors`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`font-mono text-xl font-bold ${textColor}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="flex-1 max-w-xs">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} transition-all duration-1000 ease-linear`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

const letterFromIndex = (index) => String.fromCharCode(65 + index)

const indexFromLetter = (letter) => {
  if (!letter || typeof letter !== 'string') return null
  const normalized = letter.trim().toUpperCase()
  const code = normalized.charCodeAt(0) - 65
  return code >= 0 && code < 26 ? code : null
}

const stripChoicePrefix = (choice) => {
  if (typeof choice !== 'string') return ''
  const match = choice.match(/^[A-Z]\)\s*(.*)$/)
  return match ? match[1] : choice
}

const DrillSession = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getAuthHeaders } = useAuth()
  const {
    drillSession,
    selectedAnswers,
    setSelectedAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    resetSession
  } = useDrill()

  const startTimeRef = useRef(null)
  const questions = Array.isArray(drillSession?.questions) ? drillSession.questions : []
  const fallbackPath = location.pathname.startsWith('/diagnostics') ? '/diagnostics' : '/drill'
  const isDiagnosticSession = drillSession?.origin === 'diagnostic'

  useEffect(() => {
    if (!drillSession) {
      navigate(fallbackPath, { replace: true })
      return
    }

    // Set start time when drill session loads
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    setCurrentQuestionIndex(0)
  }, [drillSession, navigate, setCurrentQuestionIndex, fallbackPath])

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
      <div className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl border border-border-light bg-white p-6 text-text-secondary shadow-md">
            <p className="text-lg font-semibold text-text-primary">No drill found</p>
            <p className="mt-2 text-sm text-text-secondary">
              We couldn&rsquo;t find an active drill session. Redirecting you back to the practice builder.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const normalizedOptions = Array.isArray(currentQuestionData?.answer_choices)
    ? currentQuestionData.answer_choices
    : []

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

    if (isDiagnosticSession) {
      navigate('/diagnostics/summary', {
        state: {
          summary
        }
      })
      return
    }

    // Submit to backend
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
          answers: answers,
          time_taken: timeTakenSeconds
        })
      })

      if (!response.ok) {
        console.error('Failed to submit drill to backend')
      } else {
        const result = await response.json()
        console.log('Drill submitted successfully:', result)
      }
    } catch (error) {
      console.error('Error submitting drill:', error)
    }

    const questionResults = questions.map((question, index) => {
      const answerChoices = Array.isArray(question?.answer_choices) ? question.answer_choices : []
      const userAnswerIndex = typeof selectedAnswers[index] === 'number' ? selectedAnswers[index] : null
      const correctIndex = indexFromLetter(question.correct_answer)
      return {
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
        questionResults
      }
    })
  }

  const handleTimeUp = () => {
    // Auto-submit when time runs out
    handleSubmit()
  }

  const handleExit = () => {
    const exitPath = isDiagnosticSession ? '/diagnostics' : '/drill'
    resetSession()
    navigate(exitPath)
  }

  const hasTimer = drillSession?.time_limit_seconds && drillSession.time_limit_seconds > 0

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="rounded-2xl border border-border-light bg-white p-8 shadow-md">
          <header className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Session | {drillSession.created_at ? new Date(drillSession.created_at).toLocaleString() : 'just now'}
                </p>
                <h2 className="text-2xl font-semibold text-text-primary mt-1">Adaptive LSAT Drill</h2>
              </div>
              <div className="text-sm text-text-secondary bg-accent-lavender/20 rounded-lg border border-border-light px-4 py-2 whitespace-nowrap">
                Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
              </div>
            </div>

            {hasTimer && (
              <div className="pt-2">
                <CountdownTimer
                  totalSeconds={drillSession.time_limit_seconds}
                  onTimeUp={handleTimeUp}
                />
              </div>
            )}
          </header>

          {currentQuestionData ? (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                    {currentQuestionData.question_type}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-peach/20 text-accent-peach">
                    Difficulty: {currentQuestionData.difficulty_level}
                  </span>
                </div>
                <p className="text-text-primary text-lg leading-relaxed">
                  {currentQuestionData.question_text}
                </p>
                {currentQuestionData.passage_text && (
                  <div className="bg-accent-lavender/10 rounded-xl border border-border-light p-4 text-sm text-text-secondary leading-relaxed">
                    {currentQuestionData.passage_text}
                  </div>
                )}
              </div>

              <div className="grid gap-3 mb-8">
                {normalizedOptions.map((option, optionIndex) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === optionIndex
                  const optionLetter = letterFromIndex(optionIndex)
                  const optionText = stripChoicePrefix(option)

                  return (
                    <button
                      key={`${option}-${optionIndex}`}
                      type="button"
                      className={`text-left px-4 py-3 rounded-lg transition border ${
                        isSelected
                          ? 'bg-primary/20 text-text-primary border-primary shadow-sm font-medium'
                          : 'bg-white text-text-primary border-border-light hover:bg-stone-50'
                      }`}
                      onClick={() => handleAnswerSelect(optionIndex)}
                    >
                      <span className="font-medium text-text-primary">{optionLetter}.</span>{' '}
                      <span className="text-sm">{optionText}</span>
                    </button>
                  )
                })}
                {normalizedOptions.length === 0 && (
                  <div className="px-4 py-3 rounded-lg border border-border-light bg-red-50 text-sm text-red-600">
                    We could not load answer choices for this question. Try generating a new drill.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white border border-border-light hover:bg-stone-50 rounded-lg text-text-secondary transition"
                    onClick={handleExit}
                  >
                    Exit Drill
                  </button>
                  <div className="flex items-center gap-3 justify-end">
                    {currentQuestionIndex > 0 && (
                      <button
                        type="button"
                        className="px-4 py-2 bg-white border border-border-light hover:bg-stone-50 rounded-lg text-text-primary transition"
                        onClick={handlePrevious}
                      >
                        Previous
                      </button>
                    )}
                    {currentQuestionIndex < questions.length - 1 && (
                      <button
                        type="button"
                        className="px-4 py-2 bg-accent-peach hover:bg-accent-peach/80 rounded-lg text-white transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                        onClick={handleNext}
                        disabled={normalizedOptions.length === 0}
                      >
                        Next
                      </button>
                    )}
                  </div>
                  {currentQuestionIndex === questions.length - 1 && questions.length > 0 && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-accent-mint hover:bg-accent-mint/80 rounded-lg text-white transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                      onClick={handleSubmit}
                      disabled={normalizedOptions.length === 0}
                    >
                      Submit Drill
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-text-secondary text-center py-10">
              We couldn't load this question. Please return to the builder and generate a new drill.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DrillSession
