import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useDrill } from '../contexts/DrillContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils'

const DiagnosticSummary = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { resetSession } = useDrill()

  const summaryState = location.state?.summary || null
  const [ability, setAbility] = useState(null)
  const [mastery, setMastery] = useState(null)
  const [errors, setErrors] = useState({ ability: null, mastery: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchInsights = async () => {
      setLoading(true)
      const [abilityResult, masteryResult] = await Promise.allSettled([
        api.getAbilityEstimate('test'),
        api.getSkillMastery('test')
      ])

      if (!isMounted) {
        return
      }

      const nextErrors = { ability: null, mastery: null }

      if (abilityResult.status === 'fulfilled') {
        console.log('Ability API Response:', abilityResult.value)
        setAbility(abilityResult.value)
      } else {
        nextErrors.ability = 'We could not load your ability estimate. Please try again shortly.'
        console.error('Failed to fetch ability estimate', abilityResult.reason)
      }

      if (masteryResult.status === 'fulfilled') {
        console.log('Mastery API Response:', masteryResult.value)
        setMastery(masteryResult.value)
      } else {
        nextErrors.mastery = 'We could not load strengths and weaknesses data. Please try again shortly.'
        console.error('Failed to fetch skill mastery', masteryResult.reason)
      }

      setErrors(nextErrors)
      setLoading(false)
    }

    fetchInsights()
    resetSession()

    return () => {
      isMounted = false
    }
  }, [resetSession])

  const strengthWeakness = useMemo(() => {
    const skills = Array.isArray(mastery?.skills) ? mastery.skills : []
    if (skills.length === 0) {
      return { strongest: null, weakest: null }
    }

    return skills.reduce(
      (acc, skill) => {
        if (!acc.strongest || skill.mastery_probability > acc.strongest.mastery_probability) {
          acc.strongest = skill
        }
        if (!acc.weakest || skill.mastery_probability < acc.weakest.mastery_probability) {
          acc.weakest = skill
        }
        return acc
      },
      { strongest: null, weakest: null }
    )
  }, [mastery])

  const formattedSummary = {
    totalQuestions: summaryState?.totalQuestions ?? 0,
    correctAnswers: summaryState?.correctAnswers ?? 0,
    score: summaryState?.score ?? 0
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-sand-dark/30 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-terracotta">Assessment Complete</span>
            <h1 className="font-slab font-semibold text-text-main dark:text-white">Diagnostic Report</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/study-plan')}
          >
            Generate Study Plan <span className="material-symbols-outlined text-sm ml-2">auto_awesome</span>
          </Button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Performance Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Total Questions</p>
              <div className="font-display font-black text-6xl text-text-main dark:text-white">
                {formattedSummary.totalQuestions}
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Questions Attempted</p>
            </Card>

            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Correct</p>
              <div className="font-display font-black text-6xl text-sage">
                {formattedSummary.correctAnswers}
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Correct Answers</p>
            </Card>

            <Card variant="flat" className="text-center p-8 bg-white dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40 mb-4">Raw Score</p>
              <div className="font-display font-black text-6xl text-terracotta">
                {formattedSummary.score}<span className="text-2xl text-text-main/40">%</span>
              </div>
              <p className="text-sm text-text-main/60 dark:text-white/60 mt-2">Accuracy Percentage</p>
            </Card>
          </section>

          {!summaryState && (
            <div className="p-4 bg-sand/20 rounded-xl text-center">
              <p className="text-sm text-text-main/60">
                We didn&rsquo;t detect a recent diagnostic session, so these stats uses defaults. Start a new diagnostic to populate this view.
              </p>
            </div>
          )}

          {/* Analysis Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Ability Estimate */}
            <Card variant="default" className="p-8 bg-white dark:bg-white/5 border border-sand-dark/20 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-slab text-text-main dark:text-white">Ability Estimate</h2>
                <span className="material-symbols-outlined text-text-main/20 dark:text-white/20 text-4xl">psychology</span>
              </div>

              {loading && !ability ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-sand/30 rounded w-3/4"></div>
                  <div className="h-12 bg-sand/30 rounded"></div>
                </div>
              ) : errors.ability ? (
                <p className="text-sm text-red-500">{errors.ability}</p>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-sand/10 dark:bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-main/40 dark:text-white/40 mb-1">Ability θ</p>
                    <p className="text-4xl font-black text-text-main dark:text-white">{ability?.ability_theta?.toFixed(2) ?? '—'}</p>
                  </div>
                  <div className="p-4 bg-sand/10 dark:bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-main/40 dark:text-white/40 mb-1">Confidence</p>
                    <p className="text-4xl font-black text-text-main/60 dark:text-white/60">±{ability?.standard_error?.toFixed(2) ?? '—'}</p>
                  </div>
                  <div className="col-span-2 text-center text-xs text-text-main/40 dark:text-white/40">
                    Last Updated: {ability?.last_updated ? new Date(ability.last_updated).toLocaleString() : '—'}
                  </div>
                </div>
              )}
            </Card>

            {/* Strengths & Weaknesses */}
            <Card variant="default" className="p-8 bg-white dark:bg-white/5 border border-sand-dark/20 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-slab text-text-main dark:text-white">Skill Profile</h2>
                <span className="material-symbols-outlined text-text-main/20 dark:text-white/20 text-4xl">analytics</span>
              </div>

              {loading && !mastery ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-sand/30 rounded-xl"></div>
                  <div className="h-20 bg-sand/30 rounded-xl"></div>
                </div>
              ) : errors.mastery ? (
                <p className="text-sm text-red-500">{errors.mastery}</p>
              ) : (
                <div className="space-y-4">
                  {/* Strength */}
                  <div className="p-4 rounded-2xl bg-sage-soft/30 border border-sage/20 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-sage/20 text-sage flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sage mb-1">Top Strength</p>
                      <p className="text-lg font-bold text-text-main dark:text-white capitalize truncate">
                        {strengthWeakness.strongest?.skill_id ?? 'Not enough data'}
                      </p>
                    </div>
                    {strengthWeakness.strongest && (
                      <div className="text-right">
                        <span className="text-2xl font-black text-sage">
                          {(strengthWeakness.strongest.mastery_probability * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Weakness */}
                  <div className="p-4 rounded-2xl bg-terracotta-soft/30 border border-terracotta/20 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-terracotta/20 text-terracotta flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">trending_down</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-1">Focus Area</p>
                      <p className="text-lg font-bold text-text-main dark:text-white capitalize truncate">
                        {strengthWeakness.weakest?.skill_id ?? 'Not enough data'}
                      </p>
                    </div>
                    {strengthWeakness.weakest && (
                      <div className="text-right">
                        <span className="text-2xl font-black text-terracotta">
                          {(strengthWeakness.weakest.mastery_probability * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticSummary
