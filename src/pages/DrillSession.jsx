import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { useAuth } from '../contexts/AuthContext'
import { renderTextWithHighlights } from '../utils/highlightRenderer'

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
  const { currentUser, getAuthHeaders } = useAuth()
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
  const task_id = location.state?.task_id // Task ID if this drill is from a study plan

  useEffect(() => {
    if (!drillSession) {
      navigate(fallbackPath, { replace: true })
      return
    }

    // Set start time when drill session loads
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    // Restore saved progress if available
    if (drillSession.current_question_index !== undefined && drillSession.current_question_index !== null) {
      const savedIndex = parseInt(drillSession.current_question_index)
      if (!isNaN(savedIndex) && savedIndex >= 0) {
        setCurrentQuestionIndex(savedIndex)
        console.log('Restored question index:', savedIndex)
      }
    } else {
      setCurrentQuestionIndex(0)
    }

    // Restore saved answers if available
    if (drillSession.user_answers) {
      const answers = drillSession.user_answers
      // Handle both object and JSON string formats
      const answersObj = typeof answers === 'string' ? JSON.parse(answers) : answers

      if (answersObj && Object.keys(answersObj).length > 0) {
        // Convert all keys to numbers and values to numbers
        const restoredAnswers = {}
        Object.keys(answersObj).forEach(key => {
          const questionIndex = parseInt(key)
          const answerValue = parseInt(answersObj[key])
          if (!isNaN(questionIndex) && !isNaN(answerValue)) {
            restoredAnswers[questionIndex] = answerValue
          }
        })
        setSelectedAnswers(restoredAnswers)
        console.log('Restored answers:', restoredAnswers)
      }
    } else {
      // Clear answers if no saved progress
      setSelectedAnswers({})
    }
  }, [drillSession, navigate, setCurrentQuestionIndex, setSelectedAnswers, fallbackPath])

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
          <div className="rounded-2xl border border-border-default bg-surface-primary p-6 text-text-secondary shadow-md">
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

  // Get highlights for current question
  const userHighlights = drillSession?.user_highlights || {}
  const currentQuestionHighlights = currentQuestionData?.id
    ? (userHighlights[currentQuestionData.id] || [])
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

      if (!response.ok) {
        console.error('Failed to submit drill to backend')
      } else {
        const result = await response.json()
        console.log('Drill submitted successfully:', result)

        // If this drill is from a study plan task, mark task as completed
        if (task_id) {
          try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
            const taskResponse = await fetch(`${apiBaseUrl}/personalization/study-plan/task/${task_id}/complete`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                drill_id: drillSession.drill_id || drillSession.session_id
              })
            })

            if (taskResponse.ok) {
              console.log('Task marked as completed')
            } else {
              console.error('Failed to mark task as completed')
            }
          } catch (taskError) {
            console.error('Error marking task as completed:', taskError)
          }
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
            user_answers: answersForBackend
          })
        })

        console.log('Progress saved on exit')
      } catch (error) {
        console.error('Error saving progress on exit:', error)
      }
    }

    const exitPath = isDiagnosticSession ? '/diagnostics' : '/drill'
    resetSession()
    navigate(exitPath)
  }

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="rounded-2xl border border-border-default bg-surface-primary p-8 shadow-md">
          <header className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Session | {drillSession.created_at ? new Date(drillSession.created_at).toLocaleString() : 'just now'}
                </p>
                <h2 className="text-2xl font-semibold text-text-primary mt-1">Adaptive LSAT Drill</h2>
              </div>
              <div className="text-sm text-text-secondary bg-accent-info-bg rounded-lg border border-border-default px-4 py-2 whitespace-nowrap">
                Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
              </div>
            </div>
          </header>

          {currentQuestionData ? (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-active text-brand-primary">
                    {currentQuestionData.question_type}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-warning-bg text-button-primary">
                    Difficulty: {currentQuestionData.difficulty_level}
                  </span>
                </div>
                <p className="text-text-primary text-lg leading-relaxed">
                  {renderTextWithHighlights(currentQuestionData.question_text, currentQuestionHighlights)}
                </p>
                {currentQuestionData.passage_text && (
                  <div className="bg-accent-info-bg rounded-xl border border-border-default p-4 text-sm text-text-secondary leading-relaxed">
                    {renderTextWithHighlights(currentQuestionData.passage_text, currentQuestionHighlights)}
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
                          ? 'bg-surface-active text-text-primary border-border-active shadow-sm font-medium'
                          : 'bg-surface-primary text-text-primary border-border-default hover:bg-surface-hover'
                      }`}
                      onClick={() => handleAnswerSelect(optionIndex)}
                    >
                      <span className="font-medium text-text-primary">{optionLetter}.</span>{' '}
                      <span className="text-sm">{optionText}</span>
                    </button>
                  )
                })}
                {normalizedOptions.length === 0 && (
                  <div className="px-4 py-3 rounded-lg border border-border-default bg-status-error-bg text-sm text-status-error-text">
                    We could not load answer choices for this question. Try generating a new drill.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-button-secondary border border-border-default hover:bg-surface-hover rounded-lg text-text-secondary transition"
                    onClick={handleExit}
                  >
                    Exit Drill
                  </button>
                  <div className="flex items-center gap-3 justify-end">
                    {currentQuestionIndex > 0 && (
                      <button
                        type="button"
                        className="px-4 py-2 bg-button-secondary border border-border-default hover:bg-surface-hover rounded-lg text-text-primary transition"
                        onClick={handlePrevious}
                      >
                        Previous
                      </button>
                    )}
                    {currentQuestionIndex < questions.length - 1 && (
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-lg text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          selectedAnswers[currentQuestionIndex] !== undefined
                            ? 'bg-button-primary hover:bg-button-primary-hover shadow-sm ring-2 ring-button-primary ring-opacity-50'
                            : 'bg-button-primary hover:bg-button-primary-hover shadow-sm opacity-75'
                        }`}
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
                      className={`px-4 py-2 rounded-lg text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${
                        selectedAnswers[currentQuestionIndex] !== undefined
                          ? 'bg-button-success hover:bg-button-success-hover shadow-sm ring-2 ring-button-success ring-opacity-50'
                          : 'bg-button-success hover:bg-button-success-hover shadow-sm opacity-75'
                      }`}
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
