import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { renderTextWithHighlights } from '../utils/highlightRenderer'
import { getChoiceText } from '../utils/answerChoiceUtils'
import { cn } from '../utils'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

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
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-terracotta border-t-transparent animate-spin"></div>
          <p className="text-text-main/50 font-bold uppercase tracking-widest text-xs">Loading Results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark p-6">
        <Card variant="flat" className="bg-white dark:bg-white/5 max-w-md w-full text-center space-y-6">
          <div className="size-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-red-500 text-3xl">error_outline</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-main dark:text-white">Unable to Load</h2>
            <p className="text-sm text-text-main/60 dark:text-white/60">{error}</p>
          </div>
          <Button onClick={() => navigate('/drill')}>Back to Practice</Button>
        </Card>
      </div>
    )
  }

  if (!drillData) return null

  const userHighlights = drillData.user_highlights || {}
  const drillConfig = drillData.drill_config || {}
  const questionResults = Array.isArray(drillData.question_results) ? drillData.question_results : []

  const totalQuestions = drillData.total_questions ?? 0
  const correctAnswers = drillData.correct_answers ?? 0
  const reviewCount = Math.max(totalQuestions - correctAnswers, 0)
  const formattedScore = Math.round(drillData.score_percentage ?? 0)

  return (
    <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-sand-dark/30 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="size-10 rounded-full border border-sand-dark/30 flex items-center justify-center hover:bg-sand/30 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-text-main dark:text-white">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta">Drill Report</span>
            <h1 className="font-slab font-semibold text-text-main dark:text-white">Performance Overview</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/drill')}
          >
            New Drill
          </Button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Final Score</p>
              <div className="font-display font-black text-6xl text-text-main dark:text-white">
                {formattedScore}<span className="text-2xl text-text-main/40">%</span>
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Accuracy Rate</p>
            </Card>

            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Correct</p>
              <div className="font-display font-black text-6xl text-sage">
                {correctAnswers}
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Questions Solved</p>
            </Card>

            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Pending Review</p>
              <div className="font-display font-black text-6xl text-terracotta">
                {reviewCount}
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Questions Missed</p>
            </Card>
          </section>

          {/* Question Review List */}
          <section className="space-y-8">
            <div className="flex items-end justify-between border-b border-sand-dark/30 dark:border-white/10 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Detailed Analysis</span>
                <h2 className="text-2xl font-slab font-bold text-text-main dark:text-white">Question Review</h2>
              </div>
            </div>

            {questionResults.length > 0 ? (
              <div className="grid gap-8">
                {questionResults.map((result, index) => {
                  const questionDetails = result.question_details || {}
                  const questionHighlights = result.question_id ? (userHighlights[result.question_id] || []) : []
                  const answerChoices = Array.isArray(questionDetails.answer_choices) ? questionDetails.answer_choices : []
                  const userAnswerIndex = indexFromLetter(result.user_answer)
                  const correctAnswerIndex = indexFromLetter(result.correct_answer)

                  return (
                    <div key={index} className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-sand-dark/20 dark:border-white/5 shadow-sm space-y-6">
                      {/* Question Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="size-8 rounded-full bg-sand-dark/20 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-text-main dark:text-white">
                            {index + 1}
                          </span>
                          <div className="flex gap-2">
                            {questionDetails.question_type && (
                              <Badge>{questionDetails.question_type}</Badge>
                            )}
                            {questionDetails.difficulty_level && (
                              <Badge variant="default" className="bg-transparent border-sand-dark/50">Diff: {questionDetails.difficulty_level}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={result.is_correct ? 'success' : 'primary'}>
                          {result.is_correct ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>

                      {/* Passage & Question */}
                      <div className="space-y-4">
                        {questionDetails.passage_text && (
                          <div className="p-6 bg-sand/20 dark:bg-white/5 rounded-2xl border border-sand-dark/10 text-sm leading-relaxed font-serif text-text-main/80 dark:text-sand">
                            {renderTextWithHighlights(questionDetails.passage_text, questionHighlights)}
                          </div>
                        )}
                        <h3 className="text-lg font-medium text-text-main dark:text-white">
                          {renderTextWithHighlights(questionDetails.question_text, questionHighlights)}
                        </h3>
                      </div>

                      {/* Answers */}
                      <div className="grid grid-cols-1 gap-3">
                        {answerChoices.map((choice, idx) => {
                          const letter = letterFromIndex(idx)
                          const text = getChoiceText(choice)
                          const isCorrect = idx === correctAnswerIndex
                          const isSelected = idx === userAnswerIndex

                          let variantStyle = "border-sand-dark/30 bg-white/50"
                          if (isCorrect) variantStyle = "border-sage bg-sage-soft/30 text-sage-dark"
                          else if (isSelected && !isCorrect) variantStyle = "border-terracotta bg-terracotta-soft/30 text-terracotta-dark"

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "flex items-start gap-4 p-4 rounded-xl border transition-colors text-sm",
                                variantStyle
                              )}
                            >
                              <span className={cn(
                                "shrink-0 font-bold",
                                isCorrect ? "text-sage" : isSelected ? "text-terracotta" : "text-text-main/40"
                              )}>{letter}.</span>
                              <span className="flex-1">{text}</span>
                              {isCorrect && <span className="text-[10px] font-bold uppercase text-sage tracking-wider">Correct Answer</span>}
                              {isSelected && !isCorrect && <span className="text-[10px] font-bold uppercase text-terracotta tracking-wider">Your Answer</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-sand/10 rounded-3xl border border-dashed border-sand-dark/30">
                <p className="text-text-main/50">No questions to review in this session.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default DrillResults
