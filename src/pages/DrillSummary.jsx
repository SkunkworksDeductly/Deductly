import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { renderTextWithHighlights } from '../utils/highlightRenderer'
import { getChoiceText } from '../utils/answerChoiceUtils'

const letterFromIndex = (index) => String.fromCharCode(65 + index)

const DrillSummary = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetSession } = useDrill()

  const summaryState = location.state?.summary || null
  const questionResults = Array.isArray(location.state?.questionResults)
    ? location.state?.questionResults
    : []
  const userHighlights = location.state?.userHighlights || {}

  const formattedSummary = useMemo(() => ({
    totalQuestions: summaryState?.totalQuestions ?? 0,
    correctAnswers: summaryState?.correctAnswers ?? 0,
    score: summaryState?.score ?? 0
  }), [summaryState])
  const reviewCount = Math.max(
    formattedSummary.totalQuestions - formattedSummary.correctAnswers,
    0
  )
  const questionList = questionResults.map((question, index) => ({
    ...question,
    questionNumber: question.questionNumber ?? index + 1
  }))

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <section className="rounded-3xl border border-border-default bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 p-8 text-text-primary shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted mb-2">Session recap</p>
              <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-tight">Drill Summary</h1>
              <p className="text-text-secondary mt-3">
                Here&rsquo;s how you performed on your latest adaptive drill.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-bg-secondary border border-border-default text-text-primary hover:bg-bg-tertiary transition"
                onClick={() => {
                  resetSession()
                  navigate('/drill')
                }}
              >
                Build Another Drill
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-button-primary hover:bg-button-primary-hover text-white shadow-glow-primary transition"
                onClick={() => navigate('/study-plan')}
              >
                View Study Plan
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-10">
            <div className="rounded-2xl border border-border-default bg-bg-primary/50 p-4 text-center backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.4em] text-text-tertiary">Total Questions</p>
              <p className="font-display text-4xl text-text-primary mt-3">{formattedSummary.totalQuestions}</p>
            </div>
            <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.4em] text-text-tertiary">Correct</p>
              <p className="font-display text-4xl text-success mt-3">{formattedSummary.correctAnswers}</p>
              <p className="text-sm text-text-secondary">{reviewCount} to review</p>
            </div>
            <div className="rounded-2xl border border-border-active bg-brand-secondary/10 p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.4em] text-text-tertiary">Score</p>
              <p className="font-display text-4xl text-text-primary mt-3">{formattedSummary.score}%</p>
              <p className="text-sm text-text-secondary">{summaryState ? 'Estimated raw score' : 'Awaiting fresh session'}</p>
            </div>
          </div>

          {!summaryState && (
            <p className="text-sm text-text-secondary mt-6">
              We didn&rsquo;t detect a recent drill session, so these stats use defaults. Start a new drill
              to populate this view.
            </p>
          )}
        </section>

        {questionList.length > 0 ? (
          <section className="rounded-3xl border border-border-default bg-bg-secondary/80 p-6 text-text-primary space-y-6 shadow-card">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Deep dive</p>
              <h2 className="font-display text-3xl">Question Review</h2>
            </div>

            {questionList.map((question) => {
              const userAnswerLetter = typeof question.userAnswerIndex === 'number'
                ? letterFromIndex(question.userAnswerIndex)
                : null
              const correctAnswerLetter = typeof question.correctIndex === 'number'
                ? letterFromIndex(question.correctIndex)
                : null

              const questionHighlights = question.questionId
                ? (userHighlights[question.questionId] || [])
                : []
              const answerChoices = Array.isArray(question.answerChoices)
                ? question.answerChoices
                : []

              return (
                <div
                  key={question.questionNumber}
                  className="rounded-2xl border border-border-default bg-bg-primary/70 p-5 text-text-primary space-y-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">
                        Question {question.questionNumber}
                      </span>
                      <div className="flex gap-2 text-xs text-text-secondary">
                        {question.questionType && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary">
                            {question.questionType}
                          </span>
                        )}
                        {question.difficulty && (
                          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                            Difficulty: {question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        question.isCorrect ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {question.isCorrect ? 'Correct' : 'Review this one'}
                    </span>
                  </div>

                  <p className="text-sm text-text-primary">
                    {renderTextWithHighlights(question.questionText, questionHighlights)}
                  </p>

                  {question.passageText && (
                    <div className="bg-bg-secondary rounded-xl border border-border-default p-4 text-xs text-text-secondary whitespace-pre-wrap">
                      {renderTextWithHighlights(question.passageText, questionHighlights)}
                    </div>
                  )}

                  <div className="grid gap-2">
                    {answerChoices.map((choice, index) => {
                      const optionLetter = letterFromIndex(index)
                      const optionText = getChoiceText(choice)
                      const isCorrect = index === question.correctIndex
                      const isSelected = index === question.userAnswerIndex

                      let optionClass = 'border border-border-default bg-bg-secondary text-text-primary'
                      if (isCorrect) {
                        optionClass = 'border-success bg-success/10 text-success'
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-danger bg-danger/10 text-danger'
                      }

                      return (
                        <div
                          key={`choice-${index}-${choice?.letter || ''}`}
                          className={`rounded-lg px-4 py-2 text-sm flex items-start gap-3 ${optionClass}`}
                        >
                          <span className="font-semibold">{optionLetter}.</span>
                          <span className="leading-relaxed">{optionText}</span>
                          {isSelected && !isCorrect && (
                            <span className="ml-auto text-xs uppercase tracking-wide">
                              Your pick
                            </span>
                          )}
                          {isCorrect && (
                            <span className="ml-auto text-xs uppercase tracking-wide">
                              Correct answer
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="text-xs text-text-secondary flex flex-wrap gap-4">
                    <span>
                      <span className="font-semibold text-text-primary mr-1">Your answer:</span>
                      {userAnswerLetter ? `${userAnswerLetter}` : 'No selection'}
                    </span>
                    <span>
                      <span className="font-semibold text-text-primary mr-1">Correct answer:</span>
                      {correctAnswerLetter ?? '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </section>
        ) : (
          <section className="rounded-3xl border border-border-default bg-bg-secondary/80 p-8 text-center text-text-secondary shadow-card">
            <p className="text-lg font-medium text-text-primary mb-2">No questions to review</p>
            <p className="text-sm text-text-secondary">
              We couldn&rsquo;t find recent question data. Build another drill to generate a fresh review.
            </p>
          </section>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-bg-secondary border border-border-default hover:bg-bg-tertiary text-text-primary transition"
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-button-primary hover:bg-button-primary-hover text-white shadow-glow-primary transition"
            onClick={() => navigate('/study-plan')}
          >
            View Study Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export default DrillSummary
