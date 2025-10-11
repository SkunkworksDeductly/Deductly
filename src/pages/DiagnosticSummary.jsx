import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useDrill } from '../contexts/DrillContext'

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
    <div className="py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <section className="rounded-2xl border border-border-light bg-white p-8 text-text-primary shadow-md">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Diagnostic Summary</h1>
          <p className="text-text-secondary">
            Here&rsquo;s how you performed on your latest diagnostic session.
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
              We didn&rsquo;t detect a recent diagnostic session, so the stats above are showing defaults.
              Start a new diagnostic to populate this view.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border-light bg-white p-6 text-text-primary shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Ability Estimate</h2>
          {loading && !ability ? (
            <p className="text-text-secondary">Loading your latest ability estimate...</p>
          ) : errors.ability ? (
            <p className="text-sm text-red-300">{errors.ability}</p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary uppercase tracking-wide">Ability θ</p>
                <p className="text-3xl font-bold mt-1">{ability?.ability_theta?.toFixed(2) ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary uppercase tracking-wide">Std. Error</p>
                <p className="text-xl font-semibold mt-1">{ability?.standard_error?.toFixed(2) ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary uppercase tracking-wide">Last Updated</p>
                <p className="text-sm mt-1 text-text-secondary">
                  {ability?.last_updated ? new Date(ability.last_updated).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border-light bg-white p-6 text-text-primary shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Strengths &amp; Weaknesses</h2>
          {loading && !mastery ? (
            <p className="text-text-secondary">Analyzing your skill profile...</p>
          ) : errors.mastery ? (
            <p className="text-sm text-red-600">{errors.mastery}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-accent-mint/10 border border-accent-mint rounded-xl p-4">
                <p className="text-sm text-text-secondary uppercase tracking-wide">Strength</p>
                <p className="text-xl font-semibold text-accent-mint mt-1">
                  {strengthWeakness.strongest?.skill_id ?? 'Coming soon'}
                </p>
                {strengthWeakness.strongest && (
                  <p className="text-sm text-text-secondary mt-2">
                    Mastery probability: {(strengthWeakness.strongest.mastery_probability * 100).toFixed(0)}%
                  </p>
                )}
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-text-secondary uppercase tracking-wide">Weakness</p>
                <p className="text-xl font-semibold text-red-600 mt-1">
                  {strengthWeakness.weakest?.skill_id ?? 'Coming soon'}
                </p>
                {strengthWeakness.weakest && (
                  <p className="text-sm text-text-secondary mt-2">
                    Mastery probability: {(strengthWeakness.weakest.mastery_probability * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-accent-peach hover:bg-accent-peach/80 transition text-white"
            onClick={() => navigate('/study-plan')}
          >
            Generate Study Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticSummary
