import React, { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'

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
  const {
    drillSession,
    selectedAnswers,
    setSelectedAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    resetSession
  } = useDrill()

  const questions = Array.isArray(drillSession?.questions) ? drillSession.questions : []
  const fallbackPath = location.pathname.startsWith('/diagnostics') ? '/diagnostics' : '/drill'
  const isDiagnosticSession = drillSession?.origin === 'diagnostic'

  useEffect(() => {
    if (!drillSession) {
      navigate(fallbackPath, { replace: true })
      return
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

  const handleSubmit = () => {
    if (!drillSession || questions.length === 0) return

    const total = questions.length
    let correctCount = 0

    questions.forEach((question, index) => {
      const userAnswerIndex = selectedAnswers[index]
      const correctIndex = indexFromLetter(question.correct_answer)
      const isCorrect = typeof userAnswerIndex === 'number' && userAnswerIndex === correctIndex
      if (isCorrect) {
        correctCount += 1
      }
    })

    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0

    const summary = {
      sessionId: drillSession.session_id,
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

  const handleExit = () => {
    const exitPath = isDiagnosticSession ? '/diagnostics' : '/drill'
    resetSession()
    navigate(exitPath)
  }

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="rounded-2xl border border-border-light bg-white p-8 shadow-md">
          <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">
                Session | {drillSession.created_at ? new Date(drillSession.created_at).toLocaleString() : 'just now'}
              </p>
              <h2 className="text-2xl font-semibold text-text-primary mt-1">Adaptive LSAT Drill</h2>
              <p className="text-text-secondary text-sm mt-1">
                Time limit: {drillSession.time_limit_minutes ? `${drillSession.time_limit_minutes} minutes` : 'untimed'}
              </p>
            </div>
            <div className="text-sm text-text-secondary bg-accent-lavender/20 rounded-lg border border-border-light px-4 py-2">
              Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
            </div>
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
