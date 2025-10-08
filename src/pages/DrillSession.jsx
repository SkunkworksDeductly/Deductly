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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
            <p className="text-lg font-semibold text-white">No drill found</p>
            <p className="mt-2 text-sm text-white/70">
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
  const hasSelection = typeof selectedAnswers[currentQuestionIndex] === 'number'

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
        <div className="rounded-2xl border-0 p-8">
          <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">
                Session | {drillSession.created_at ? new Date(drillSession.created_at).toLocaleString() : 'just now'}
              </p>
              <h2 className="text-2xl font-semibold text-white mt-1">Adaptive LSAT Drill</h2>
              <p className="text-white/60 text-sm mt-1">
                Time limit: {drillSession.time_limit_minutes ? `${drillSession.time_limit_minutes} minutes` : 'untimed'}
              </p>
            </div>
            <div className="text-sm text-white/60 bg-white/5 rounded-lg border-0 px-4 py-2">
              Question {questions.length > 0 ? currentQuestionIndex + 1 : 0} of {questions.length}
            </div>
          </header>

          {currentQuestionData ? (
            <>
              <div className="space-y-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80">
                    {currentQuestionData.question_type}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80">
                    Difficulty: {currentQuestionData.difficulty_level}
                  </span>
                </div>
                <p className="text-white text-lg leading-relaxed">
                  {currentQuestionData.question_text}
                </p>
                {currentQuestionData.passage_text && (
                  <div className="bg-white/5 rounded-xl border-0 p-4 text-sm text-white/70 leading-relaxed">
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
                      className={`text-left px-4 py-3 rounded-lg transition ${
                        isSelected
                          ? 'bg-primary/40 text-white shadow-md'
                          : 'bg-transparent text-white/80 hover:bg-white/10'
                      }`}
                      onClick={() => handleAnswerSelect(optionIndex)}
                    >
                      <span className="font-medium text-white">{optionLetter}.</span>{' '}
                      <span className="text-sm text-white/80">{optionText}</span>
                    </button>
                  )
                })}
                {normalizedOptions.length === 0 && (
                  <div className="px-4 py-3 rounded-lg border-0 bg-white/5 text-sm text-white/60">
                    We could not load answer choices for this question. Try generating a new drill.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {!hasSelection && (
                  <div className="text-sm text-white/60">
                    Select an answer to continue.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                    onClick={handleExit}
                  >
                    Exit Drill
                  </button>
                  <div className="flex items-center gap-3 justify-end">
                    {currentQuestionIndex > 0 && (
                      <button
                        type="button"
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                        onClick={handlePrevious}
                      >
                        Previous
                      </button>
                    )}
                    {currentQuestionIndex < questions.length - 1 && (
                      <button
                        type="button"
                        className="px-4 py-2 bg-matte-red hover:bg-matte-red/90 rounded-lg text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
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
                      className="px-4 py-2 bg-success-green/30 hover:bg-success-green/40 rounded-lg text-success-green transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            <div className="text-white/70 text-center py-10">
              We couldn't load this question. Please return to the builder and generate a new drill.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DrillSession
