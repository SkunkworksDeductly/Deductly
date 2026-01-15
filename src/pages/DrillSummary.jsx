import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { renderTextWithHighlights } from '../utils/highlightRenderer'
import { getChoiceText } from '../utils/answerChoiceUtils'
import { cn } from '../utils'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

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

  return (
    <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-sand-dark/30 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta">Session Recap</span>
            <h1 className="font-slab font-semibold text-text-main dark:text-white">Drill Summary</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              resetSession()
              navigate('/drill')
            }}
          >
            New Drill
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/analytics')}
            className="hidden sm:flex"
          >
            Analytics
          </Button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Performance</p>
              <div className="font-display font-black text-6xl text-text-main dark:text-white">
                {formattedSummary.score}<span className="text-2xl text-text-main/40">%</span>
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Accuracy Score</p>
            </Card>

            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Correct</p>
              <div className="font-display font-black text-6xl text-sage">
                {formattedSummary.correctAnswers}
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Questions Solved</p>
            </Card>

            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Review</p>
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
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Deep Dive</span>
                <h2 className="text-2xl font-slab font-bold text-text-main dark:text-white">Question Review</h2>
              </div>
            </div>

            {questionResults.length > 0 ? (
              <div className="grid gap-8">
                {questionResults.map((question, index) => {
                  const questionHighlights = question.questionId ? (userHighlights[question.questionId] || []) : []
                  const answerChoices = Array.isArray(question.answerChoices) ? question.answerChoices : []

                  return (
                    <div key={index} className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-sand-dark/20 dark:border-white/5 shadow-sm space-y-6">
                      {/* Question Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="size-8 rounded-full bg-sand-dark/20 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-text-main dark:text-white">
                            {question.questionNumber}
                          </span>
                          <div className="flex gap-2">
                            {question.questionType && (
                              <Badge>{question.questionType}</Badge>
                            )}
                            {question.difficulty && (
                              <Badge variant="default" className="bg-transparent border-sand-dark/50">Diff: {question.difficulty}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={question.isCorrect ? 'success' : 'primary'}>
                          {question.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>

                      {/* Passage & Question */}
                      <div className="space-y-4">
                        {question.passageText && (
                          <div className="p-6 bg-sand/20 dark:bg-white/5 rounded-2xl border border-sand-dark/10 text-sm leading-relaxed font-serif text-text-main/80 dark:text-sand">
                            {renderTextWithHighlights(question.passageText, questionHighlights)}
                          </div>
                        )}
                        <h3 className="text-lg font-medium text-text-main dark:text-white">
                          {renderTextWithHighlights(question.questionText, questionHighlights)}
                        </h3>
                      </div>

                      {/* Answers */}
                      <div className="grid grid-cols-1 gap-3">
                        {answerChoices.map((choice, idx) => {
                          const letter = letterFromIndex(idx)
                          const text = getChoiceText(choice)
                          const isCorrect = idx === question.correctIndex
                          const isSelected = idx === question.userAnswerIndex

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

export default DrillSummary
