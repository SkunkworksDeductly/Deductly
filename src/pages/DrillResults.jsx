import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { renderTextWithHighlights } from '../utils/highlightRenderer'
import { getChoiceText } from '../utils/answerChoiceUtils'

const letterFromIndex = (index) => String.fromCharCode(65 + index)

const indexFromLetter = (letter) => {
  if (!letter || typeof letter !== 'string') return null
  const normalized = letter.trim().toUpperCase()
  const code = normalized.charCodeAt(0) - 65
  return code >= 0 && code < 26 ? code : null
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
          <div className="rounded-3xl border border-border-default bg-bg-secondary/80 p-8 text-center shadow-card">
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
          <div className="rounded-3xl border border-danger/40 bg-danger/10 p-8 text-center shadow-card">
            <p className="text-lg font-semibold text-danger mb-2">Error</p>
            <p className="text-sm text-text-primary mb-4">{error}</p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-button-primary hover:bg-button-primary-hover text-white transition"
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
  const drillConfig = drillData.drill_config || {}
  const skillPerformance = drillData.skill_performance || {}
  const questionResults = Array.isArray(drillData.question_results) ? drillData.question_results : []

  const totalQuestions = drillData.total_questions ?? 0
  const correctAnswers = drillData.correct_answers ?? 0
  const reviewCount = Math.max(totalQuestions - correctAnswers, 0)
  const formattedScore = useMemo(() => Math.round(drillData.score_percentage ?? 0), [drillData.score_percentage])
  const completedLabel = drillData.completed_at
    ? new Date(drillData.completed_at).toLocaleString()
    : 'just now'
  const timeTakenLabel = typeof drillData.time_taken === 'number'
    ? `${Math.max(Math.round(drillData.time_taken / 60), 1)} min`
    : 'Untimed'
  const hasTimingConfig = Object.prototype.hasOwnProperty.call(drillConfig, 'timing')
  const timingLabel = typeof drillConfig.timing === 'number'
    ? `${Math.round(drillConfig.timing / 60)} min limit`
    : 'Untimed'
  const showSkills = Array.isArray(drillConfig.skills) && drillConfig.skills.length > 0
  const difficultyLabel = Array.isArray(drillConfig.difficulty)
    ? drillConfig.difficulty.join(', ')
    : drillConfig.difficulty
  const skillEntries = Object.entries(skillPerformance)

  return (
    <div className="py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        {/* Summary Section */}
        <section className="rounded-3xl border border-border-default bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 p-8 text-text-primary shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted mb-2">Performance recap</p>
              <h1 className="font-display text-4xl md:text-5xl text-text-primary leading-tight">Drill Results</h1>
              <p className="text-text-secondary mt-3">
                Completed {completedLabel}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-bg-secondary border border-border-default text-text-primary hover:bg-bg-tertiary transition"
                onClick={() => navigate('/drill')}
              >
                Build New Drill
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
              <p className="font-display text-4xl text-text-primary mt-3">{totalQuestions}</p>
            </div>
            <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.4em] text-text-tertiary">Correct</p>
              <p className="font-display text-4xl text-success mt-3">{correctAnswers}</p>
              <p className="text-sm text-text-secondary">{reviewCount} to review</p>
            </div>
            <div className="rounded-2xl border border-border-active bg-brand-secondary/10 p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.4em] text-text-tertiary">Score</p>
              <p className="font-display text-4xl text-text-primary mt-3">{formattedScore}%</p>
              <p className="text-sm text-text-secondary">{timeTakenLabel}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {showSkills && (
              <div className="rounded-2xl border border-border-default bg-bg-secondary/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted mb-3">Skills Targeted</p>
                <div className="flex flex-wrap gap-2">
                  {drillConfig.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-full border border-border-default text-xs text-text-secondary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {difficultyLabel && (
              <div className="rounded-2xl border border-border-default bg-bg-secondary/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted mb-3">Difficulty Mix</p>
                <p className="text-text-primary text-lg font-medium">{difficultyLabel}</p>
              </div>
            )}
            {hasTimingConfig && (
              <div className="rounded-2xl border border-border-default bg-bg-secondary/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-text-muted mb-3">Timing</p>
                <p className="text-text-primary text-lg font-medium">{timingLabel}</p>
              </div>
            )}
          </div>
        </section>

        {skillEntries.length > 0 && (
          <section className="rounded-3xl border border-border-default bg-bg-secondary/80 p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Skill focus</p>
                <h2 className="font-display text-3xl text-text-primary">Performance by Skill</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {skillEntries.map(([skill, stats]) => {
                const percentage = stats.total > 0
                  ? Math.round((stats.correct / stats.total) * 100)
                  : 0
                return (
                  <div
                    key={skill}
                    className="rounded-2xl border border-border-default bg-bg-primary/60 p-5 flex flex-col gap-2"
                  >
                    <p className="text-sm text-text-secondary uppercase tracking-wide">{skill}</p>
                    <p className="text-3xl font-semibold text-text-primary">{percentage}%</p>
                    <p className="text-sm text-text-tertiary">{stats.correct} / {stats.total} correct</p>
                    <div className="h-2 w-full rounded-full bg-bg-secondary">
                      <div
                        className="h-full rounded-full bg-brand-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Questions Section */}
        <section className="rounded-3xl border border-border-default bg-bg-secondary/80 p-6 text-text-primary space-y-6 shadow-card">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Deep dive</p>
            <h2 className="font-display text-3xl">Question Review</h2>
          </div>

          {questionResults.map((result, index) => {
            const questionDetails = result.question_details
            if (!questionDetails) return null

            const userAnswerIndex = indexFromLetter(result.user_answer)
            const correctAnswerIndex = indexFromLetter(result.correct_answer)

            const userAnswerLetter = result.user_answer || null
            const correctAnswerLetter = result.correct_answer || null

            // Get highlights for this question
            const questionHighlights = userHighlights[result.question_id] || []
            const answerChoices = Array.isArray(questionDetails.answer_choices)
              ? questionDetails.answer_choices
              : []

            return (
              <div
                key={result.question_id}
                className="rounded-2xl border border-border-default bg-bg-primary/70 p-5 text-text-primary space-y-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">
                      Question {index + 1}
                    </span>
                    <div className="flex gap-2 text-xs text-text-secondary">
                      {questionDetails.question_type && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary">
                          {questionDetails.question_type}
                        </span>
                      )}
                      {questionDetails.difficulty_level && (
                        <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                          Difficulty: {questionDetails.difficulty_level}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      result.is_correct ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {result.is_correct ? 'Correct' : 'Review this one'}
                  </span>
                </div>

                <p className="text-sm text-text-primary">
                  {renderTextWithHighlights(questionDetails.question_text, questionHighlights)}
                </p>

                {questionDetails.passage_text && (
                  <div className="bg-bg-secondary rounded-xl border border-border-default p-4 text-xs text-text-secondary whitespace-pre-wrap">
                    {renderTextWithHighlights(questionDetails.passage_text, questionHighlights)}
                  </div>
                )}

                <div className="grid gap-2">
                  {answerChoices.map((choice, choiceIndex) => {
                    const optionLetter = letterFromIndex(choiceIndex)
                    const optionText = getChoiceText(choice)
                    const isCorrect = choiceIndex === correctAnswerIndex
                    const isSelected = choiceIndex === userAnswerIndex

                    let optionClass = 'border border-border-default bg-bg-secondary text-text-primary'
                    if (isCorrect) {
                      optionClass = 'border-success bg-success/10 text-success'
                    } else if (isSelected && !isCorrect) {
                      optionClass = 'border-danger bg-danger/10 text-danger'
                    }

                    return (
                      <div
                        key={`choice-${choiceIndex}-${choice?.letter || ''}`}
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
                    {userAnswerLetter || 'No selection'}
                  </span>
                  <span>
                    <span className="font-semibold text-text-primary mr-1">Correct answer:</span>
                    {correctAnswerLetter || '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </section>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-bg-secondary border border-border-default hover:bg-bg-tertiary text-text-primary transition"
            onClick={() => navigate('/drill')}
          >
            Review Builder
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-button-primary hover:bg-button-primary-hover text-white shadow-glow-primary transition"
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export default DrillResults
