import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const DrillResults = () => {
  const { drillId } = useParams()
  const navigate = useNavigate()
  const { getAuthHeaders } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drillData, setDrillData] = useState(null)

  useEffect(() => {
    const fetchDrillResults = async () => {
      try {
        setLoading(true)
        setError(null)

        const headers = await getAuthHeaders()
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

        const response = await fetch(`${apiBaseUrl}/skill-builder/drills/${drillId}/results`, {
          method: 'GET',
          headers
        })

        if (response.status === 404) {
          setError('Drill results not found or you do not have permission to view this drill.')
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch drill results')
        }

        const data = await response.json()
        setDrillData(data)
      } catch (err) {
        console.error('Error fetching drill results:', err)
        setError('Failed to load drill results. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (drillId) {
      fetchDrillResults()
    }
  }, [drillId, getAuthHeaders])

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-2xl border border-border-light bg-white p-8 text-center shadow-md">
            <p className="text-lg text-text-secondary">Loading drill results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-md">
            <p className="text-lg font-semibold text-red-700 mb-2">Error</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-button-primary hover:bg-button-primary-hover text-white transition"
              onClick={() => navigate('/drill')}
            >
              Back to Drills
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!drillData) {
    return null
  }

  const userHighlights = drillData.user_highlights || {}

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Summary Section */}
        <section className="rounded-2xl border border-border-light bg-white p-8 text-text-primary shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Drill Results</h1>
              <p className="text-sm text-text-secondary">
                Completed on {new Date(drillData.completed_at).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-button-secondary border border-border-default hover:bg-surface-hover text-text-secondary transition"
              onClick={() => navigate('/drill')}
            >
              Back to Drills
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-6">
            <div className="bg-accent-lavender/20 border border-border-light rounded-xl p-4 text-center">
              <p className="text-sm text-text-secondary uppercase tracking-wide">Total Questions</p>
              <p className="text-2xl font-semibold mt-2">{drillData.total_questions}</p>
            </div>
            <div className="bg-accent-mint/20 border border-border-light rounded-xl p-4 text-center">
              <p className="text-sm text-text-secondary uppercase tracking-wide">Correct Answers</p>
              <p className="text-2xl font-semibold mt-2 text-accent-mint">{drillData.correct_answers}</p>
            </div>
            <div className="bg-primary/20 border border-border-light rounded-xl p-4 text-center">
              <p className="text-sm text-text-secondary uppercase tracking-wide">Score</p>
              <p className="text-2xl font-semibold mt-2">{drillData.score_percentage}%</p>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <section className="rounded-2xl border border-border-light bg-white p-6 text-text-primary space-y-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Question Review</h2>

          {drillData.question_results.map((result, index) => {
            const questionDetails = result.question_details
            if (!questionDetails) return null

            const userAnswerIndex = indexFromLetter(result.user_answer)
            const correctAnswerIndex = indexFromLetter(result.correct_answer)

            const userAnswerLetter = result.user_answer || null
            const correctAnswerLetter = result.correct_answer || null

            // Get highlights for this question
            const questionHighlights = userHighlights[result.question_id] || []

            return (
              <div
                key={result.question_id}
                className="rounded-xl border border-border-light bg-accent-lavender/10 p-5 text-text-primary space-y-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">
                      Question {index + 1}
                    </span>
                    <div className="flex gap-2 text-xs text-text-secondary">
                      {questionDetails.question_type && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {questionDetails.question_type}
                        </span>
                      )}
                      {questionDetails.difficulty_level && (
                        <span className="px-2 py-0.5 rounded-full bg-accent-peach/20 text-accent-peach">
                          Difficulty: {questionDetails.difficulty_level}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      result.is_correct ? 'text-accent-mint' : 'text-red-500'
                    }`}
                  >
                    {result.is_correct ? 'Correct' : 'Review this one'}
                  </span>
                </div>

                <p className="text-sm text-text-primary">
                  {renderTextWithHighlights(questionDetails.question_text, questionHighlights)}
                </p>

                {questionDetails.passage_text && (
                  <div className="bg-white rounded-lg border border-border-light p-4 text-xs text-text-secondary whitespace-pre-wrap">
                    {renderTextWithHighlights(questionDetails.passage_text, questionHighlights)}
                  </div>
                )}

                <div className="grid gap-2">
                  {questionDetails.answer_choices.map((choice, choiceIndex) => {
                    const optionLetter = letterFromIndex(choiceIndex)
                    const optionText = stripChoicePrefix(choice)
                    const isCorrect = choiceIndex === correctAnswerIndex
                    const isSelected = choiceIndex === userAnswerIndex

                    let optionClass = 'border border-border-light bg-white text-text-primary'
                    if (isCorrect) {
                      optionClass = 'border-accent-mint bg-accent-mint/15 text-accent-mint'
                    } else if (isSelected && !isCorrect) {
                      optionClass = 'border-red-400 bg-red-50 text-red-600'
                    }

                    return (
                      <div
                        key={`${choice}-${choiceIndex}`}
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
                  {userAnswerLetter || 'No selection'}
                  <span className="font-semibold text-text-primary ml-4 mr-2">Correct answer:</span>
                  {correctAnswerLetter || '—'}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default DrillResults
