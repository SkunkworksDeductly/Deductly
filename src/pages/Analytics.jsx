import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Analytics = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [ability, setAbility] = useState(null)
  const [mastery, setMastery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({ ability: null, mastery: null })

  useEffect(() => {
    let isMounted = true
    const userId = currentUser?.uid || 'anonymous'

    const fetchStats = async () => {
      setLoading(true)
      const [abilityRes, masteryRes] = await Promise.allSettled([
        api.getAbilityEstimate(userId),
        api.getSkillMastery(userId)
      ])

      if (!isMounted) return

      const nextErrors = { ability: null, mastery: null }

      if (abilityRes.status === 'fulfilled') {
        setAbility(abilityRes.value)
      } else {
        nextErrors.ability = 'Failed to load ability estimate.'
        setAbility(null)
      }

      if (masteryRes.status === 'fulfilled') {
        setMastery(masteryRes.value)
      } else {
        nextErrors.mastery = 'Failed to load mastery profile.'
        setMastery(null)
      }

      setErrors(nextErrors)
      setLoading(false)
    }

    fetchStats()
    return () => { isMounted = false }
  }, [currentUser])

  const hasAbility = useMemo(() => {
    return ability && typeof ability.ability_theta !== 'undefined'
  }, [ability])

  const hasMastery = useMemo(() => {
    return mastery && Array.isArray(mastery.skills) && mastery.skills.length > 0
  }, [mastery])

  // Helper to convert Elo rating to display tier
  const getRatingTier = (rating) => {
    if (rating >= 1800) return { label: 'Advanced', color: 'text-green-400' }
    if (rating >= 1600) return { label: 'Proficient', color: 'text-blue-400' }
    if (rating >= 1400) return { label: 'Developing', color: 'text-yellow-400' }
    if (rating >= 1200) return { label: 'Foundational', color: 'text-orange-400' }
    return { label: 'Beginning', color: 'text-red-400' }
  }

  return (
    <div className='min-h-screen px-4 py-12'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='font-serif text-text-primary text-5xl font-normal leading-tight text-left pb-8 tracking-tight'>
          Analytics
        </h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Ability Card */}
          <section className='rounded-3xl border border-border-default bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 p-8 text-text-primary shadow-xl backdrop-blur-xl'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='font-serif text-2xl font-normal tracking-tight'>Current Ability (IRT)</h2>
            </div>

            {loading && !ability ? (
              <div className='flex items-center gap-3 mt-4'>
                <div className='w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin'></div>
                <p className='text-text-secondary'>Loading ability estimate...</p>
              </div>
            ) : hasAbility ? (
              <div className='mt-6 flex items-center gap-12'>
                <div>
                  <p className='text-[11px] text-text-tertiary uppercase tracking-wider mb-2'>Ability θ</p>
                  <p className='font-serif text-5xl font-normal text-text-primary'>{ability.ability_theta?.toFixed(2)}</p>
                </div>
                {typeof ability.standard_error !== 'undefined' && (
                  <div>
                    <p className='text-[11px] text-text-tertiary uppercase tracking-wider mb-2'>Std. Error</p>
                    <p className='font-serif text-3xl font-normal text-text-secondary'>{ability.standard_error?.toFixed(2)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className='mt-6'>
                <p className='text-text-secondary mb-4'>No Data Yet!</p>
                <button
                  type='button'
                  className='px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 text-white font-semibold shadow-lg transform hover:-translate-y-0.5'
                  onClick={() => navigate('/diagnostics')}
                >
                  Take Diagnostic
                </button>
                {errors.ability && (
                  <p className='text-xs text-danger mt-3'>{errors.ability}</p>
                )}
              </div>
            )}
          </section>

          {/* Skill Ratings Card */}
          <section className='rounded-3xl border border-border-default bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 p-8 text-text-primary shadow-xl backdrop-blur-xl'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='font-serif text-2xl font-normal tracking-tight'>Skill Ratings (Elo)</h2>
            </div>

            {loading && !mastery ? (
              <div className='flex items-center gap-3 mt-4'>
                <div className='w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin'></div>
                <p className='text-text-secondary'>Loading skill ratings...</p>
              </div>
            ) : hasMastery ? (
              <div className='mt-6 max-h-80 overflow-auto pr-2 custom-scrollbar'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {mastery.skills.slice(0, 10).map((s, idx) => {
                    const tier = getRatingTier(s.rating || 1500)
                    return (
                      <div key={idx} className='border border-border-subtle rounded-2xl p-4 bg-bg-primary/30 backdrop-blur-sm hover:border-border-hover transition-all duration-200'>
                        <p className='text-[11px] text-text-tertiary uppercase tracking-wider mb-2'>{s.skill_name || s.skill_id || `Skill ${idx + 1}`}</p>
                        {typeof s.rating !== 'undefined' ? (
                          <div className='flex items-baseline gap-2'>
                            <p className='font-serif text-2xl font-normal text-text-primary'>{Math.round(s.rating)}</p>
                            <span className={`text-xs ${tier.color}`}>{tier.label}</span>
                          </div>
                        ) : typeof s.mastery_probability !== 'undefined' ? (
                          <p className='font-serif text-2xl font-normal text-text-primary'>{(s.mastery_probability * 100).toFixed(0)}%</p>
                        ) : (
                          <p className='font-serif text-2xl font-normal text-text-secondary'>—</p>
                        )}
                        {s.num_updates > 0 && (
                          <p className='text-[10px] text-text-tertiary mt-1'>{s.num_updates} responses</p>
                        )}
                      </div>
                    )
                  })}
                </div>
                {mastery.skills.length > 10 && (
                  <p className='text-xs text-text-tertiary mt-4'>Showing first 10 of {mastery.skills.length} skills</p>
                )}
              </div>
            ) : (
              <div className='mt-6'>
                <p className='text-text-secondary mb-4'>No Data Yet!</p>
                <button
                  type='button'
                  className='px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 text-white font-semibold shadow-lg transform hover:-translate-y-0.5'
                  onClick={() => navigate('/diagnostics')}
                >
                  Take Diagnostic
                </button>
                {errors.mastery && (
                  <p className='text-xs text-danger mt-3'>{errors.mastery}</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Analytics
