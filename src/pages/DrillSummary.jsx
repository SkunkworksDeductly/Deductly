import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { renderTextWithHighlights } from '../utils/highlightRenderer'

const letterFromIndex = (index) => String.fromCharCode(65 + index)

const stripChoicePrefix = (choice) => {
  if (typeof choice !== 'string') return ''
  const match = choice.match(/^[A-Z]\)\s*(.*)$/)
  return match ? match[1] : choice
}

const DrillSummary = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetSession } = useDrill()

  const summaryState = location.state?.summary || null
  const questionResults = location.state?.questionResults || []
  const userHighlights = location.state?.userHighlights || {}

  const formattedSummary = {
    totalQuestions: summaryState?.totalQuestions ?? 0,
    correctAnswers: summaryState?.correctAnswers ?? 0,
    score: summaryState?.score ?? 0
  }

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <section className="rounded-2xl border border-border-light bg-white p-8 text-text-primary shadow-md">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Drill Summary</h1>
          <p className="text-text-secondary">
            Here&rsquo;s how you performed on this practice drill.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mt-8">
            <div className="bg-accent-lavender/20 border border-border-light rounded-xl p-4 text-center">
              <p className="text-sm text-text-secondary uppercase tracking-wide">Total Questions</p>
              <p className="text-2xl font-semibold mt-2">{formattedSummary.totalQuestions}</p>
            </div>
            <div className="bg-accent-mint/20 border border-border-light rounded-xl p-4 text-center">
              <p className="text-sm text-text-secondary uppercase tracking-wide">Correct Answers</p>
              <p className="text-2xl font-semibold mt-2 text-accent-mint">{formattedSummary.correctAnswers}</p>
            </div>
            <div className="bg-primary/20 border border-border-light rounded-xl p-4 text-center">
              <p className="text-sm text-text-secondary uppercase tracking-wide">Score</p>
              <p className="text-2xl font-semibold mt-2">{formattedSummary.score}%</p>
            </div>
          </div>

          {!summaryState && (
            <p className="text-sm text-text-secondary mt-4">
              We didn&rsquo;t detect a recent drill session, so the stats above are showing defaults.
              Start a new drill to populate this view.
            </p>
          )}
        </section>

        {questionResults.length > 0 && (
          <section className="rounded-2xl border border-border-light bg-white p-6 text-text-primary space-y-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Question Review</h2>

            {questionResults.map((question) => {
              const userAnswerLetter = typeof question.userAnswerIndex === 'number'
                ? letterFromIndex(question.userAnswerIndex)
                : null
              const correctAnswerLetter = typeof question.correctIndex === 'number'
                ? letterFromIndex(question.correctIndex)
                : null

              // Get highlights for this question
              const questionHighlights = question.questionId
                ? (userHighlights[question.questionId] || [])
                : []

              return (
                <div
                  key={question.questionNumber}
                  className="rounded-xl border border-border-light bg-accent-lavender/10 p-5 text-text-primary space-y-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">
                        Question {question.questionNumber}
                      </span>
                      <div className="flex gap-2 text-xs text-text-secondary">
                        {question.questionType && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            {question.questionType}
                          </span>
                        )}
                        {question.difficulty && (
                          <span className="px-2 py-0.5 rounded-full bg-accent-peach/20 text-accent-peach">
                            Difficulty: {question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        question.isCorrect ? 'text-accent-mint' : 'text-red-500'
                      }`}
                    >
                      {question.isCorrect ? 'Correct' : 'Review this one'}
                    </span>
                  </div>

                  <p className="text-sm text-text-primary">
                    {renderTextWithHighlights(question.questionText, questionHighlights)}
                  </p>

                  {question.passageText && (
                    <div className="bg-white rounded-lg border border-border-light p-4 text-xs text-text-secondary whitespace-pre-wrap">
                      {renderTextWithHighlights(question.passageText, questionHighlights)}
                    </div>
                  )}

                  <div className="grid gap-2">
                    {question.answerChoices.map((choice, index) => {
                      const optionLetter = letterFromIndex(index)
                      const optionText = stripChoicePrefix(choice)
                      const isCorrect = index === question.correctIndex
                      const isSelected = index === question.userAnswerIndex

                      let optionClass = 'border border-border-light bg-white text-text-primary'
                      if (isCorrect) {
                        optionClass = 'border-accent-mint bg-accent-mint/15 text-accent-mint'
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-red-400 bg-red-50 text-red-600'
                      }

                      return (
                        <div
                          key={`${choice}-${index}`}
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

                  <div className="text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary mr-2">Your answer:</span>
                    {userAnswerLetter ? `${userAnswerLetter}` : 'No selection'}
                    <span className="font-semibold text-text-primary ml-4 mr-2">Correct answer:</span>
                    {correctAnswerLetter ?? '—'}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white border border-border-light hover:bg-stone-50 transition text-text-secondary"
            onClick={() => {
              resetSession()
              navigate('/drill')
            }}
          >
            Build New Drill
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-button-primary hover:bg-button-primary-hover transition text-white shadow-sm"
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
