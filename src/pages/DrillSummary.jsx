import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'

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

  const formattedSummary = {
    totalQuestions: summaryState?.totalQuestions ?? 0,
    correctAnswers: summaryState?.correctAnswers ?? 0,
    score: summaryState?.score ?? 0
  }

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Drill Summary</h1>
          <p className="text-white/70">
            Here&rsquo;s how you performed on this practice drill.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mt-8">
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-sm text-white/60 uppercase tracking-wide">Total Questions</p>
              <p className="text-2xl font-semibold mt-2">{formattedSummary.totalQuestions}</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-sm text-white/60 uppercase tracking-wide">Correct Answers</p>
              <p className="text-2xl font-semibold mt-2 text-success-green">{formattedSummary.correctAnswers}</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-sm text-white/60 uppercase tracking-wide">Score</p>
              <p className="text-2xl font-semibold mt-2">{formattedSummary.score}%</p>
            </div>
          </div>

          {!summaryState && (
            <p className="text-sm text-white/60 mt-4">
              We didn&rsquo;t detect a recent drill session, so the stats above are showing defaults.
              Start a new drill to populate this view.
            </p>
          )}
        </section>

        {questionResults.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 text-white space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Question Review</h2>

            {questionResults.map((question) => {
              const userAnswerLetter = typeof question.userAnswerIndex === 'number'
                ? letterFromIndex(question.userAnswerIndex)
                : null
              const correctAnswerLetter = typeof question.correctIndex === 'number'
                ? letterFromIndex(question.correctIndex)
                : null

              return (
                <div
                  key={question.questionNumber}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 text-white/80 space-y-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        Question {question.questionNumber}
                      </span>
                      <div className="flex gap-2 text-xs text-white/60">
                        {question.questionType && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            {question.questionType}
                          </span>
                        )}
                        {question.difficulty && (
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                            Difficulty: {question.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        question.isCorrect ? 'text-success-green' : 'text-red-300'
                      }`}
                    >
                      {question.isCorrect ? 'Correct' : 'Review this one'}
                    </span>
                  </div>

                  <p className="text-sm text-white">{question.questionText}</p>

                  {question.passageText && (
                    <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-xs text-white/70 whitespace-pre-wrap">
                      {question.passageText}
                    </div>
                  )}

                  <div className="grid gap-2">
                    {question.answerChoices.map((choice, index) => {
                      const optionLetter = letterFromIndex(index)
                      const optionText = stripChoicePrefix(choice)
                      const isCorrect = index === question.correctIndex
                      const isSelected = index === question.userAnswerIndex

                      let optionClass = 'border border-white/10 bg-transparent text-white/80'
                      if (isCorrect) {
                        optionClass = 'border-success-green/40 bg-success-green/15 text-success-green'
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-red-400/40 bg-red-500/10 text-red-300'
                      }

                      return (
                        <div
                          key={`${choice}-${index}`}
                          className={`rounded-lg px-4 py-2 text-sm flex items-start gap-3 ${optionClass}`}
                        >
                          <span className="font-semibold text-white">{optionLetter}.</span>
                          <span className="text-white/80 leading-relaxed">{optionText}</span>
                          {isSelected && !isCorrect && (
                            <span className="ml-auto text-xs uppercase tracking-wide text-red-300">
                              Your pick
                            </span>
                          )}
                          {isCorrect && (
                            <span className="ml-auto text-xs uppercase tracking-wide text-success-green">
                              Correct answer
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="text-xs text-white/60">
                    <span className="font-semibold text-white/70 mr-2">Your answer:</span>
                    {userAnswerLetter ? `${userAnswerLetter}` : 'No selection'}
                    <span className="font-semibold text-white/70 ml-4 mr-2">Correct answer:</span>
                    {correctAnswerLetter ?? '—'}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 text-white">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            onClick={() => {
              resetSession()
              navigate('/drill')
            }}
          >
            Build New Drill
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-matte-red hover:bg-matte-red/90 transition"
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
