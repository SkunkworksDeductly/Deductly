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

  return (
    <div className='px-4 py-8'>
      <h1 className='text-text-primary tracking-light text-[32px] font-bold leading-tight text-left pb-3'>
        Analytics
      </h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Ability Card */}
        <section className='rounded-2xl border border-border-light bg-white p-6 text-text-primary shadow-md'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>Current Ability (IRT)</h2>
          </div>

          {loading && !ability ? (
            <p className='text-text-secondary mt-3'>Loading ability estimate...</p>
          ) : hasAbility ? (
            <div className='mt-4 flex items-center gap-8'>
              <div>
                <p className='text-sm text-text-secondary uppercase tracking-wide'>Ability θ</p>
                <p className='text-3xl font-bold mt-1'>{ability.ability_theta?.toFixed(2)}</p>
              </div>
              {typeof ability.standard_error !== 'undefined' && (
                <div>
                  <p className='text-sm text-text-secondary uppercase tracking-wide'>Std. Error</p>
                  <p className='text-xl font-semibold mt-1'>{ability.standard_error?.toFixed(2)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className='mt-4'>
              <p className='text-text-secondary'>No Data Yet!</p>
              <button
                type='button'
                className='mt-3 px-4 py-2 rounded-lg bg-button-primary hover:bg-button-primary-hover transition text-white'
                onClick={() => navigate('/diagnostics')}
              >
                Take Diagnostic
              </button>
              {errors.ability && (
                <p className='text-xs text-red-500 mt-2'>{errors.ability}</p>
              )}
            </div>
          )}
        </section>

        {/* Mastery Vector Card */}
        <section className='rounded-2xl border border-border-light bg-white p-6 text-text-primary shadow-md'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>Mastery Vector (GLMM)</h2>
          </div>

          {loading && !mastery ? (
            <p className='text-text-secondary mt-3'>Loading mastery profile...</p>
          ) : hasMastery ? (
            <div className='mt-4 max-h-64 overflow-auto pr-1'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {mastery.skills.slice(0, 10).map((s, idx) => (
                  <div key={idx} className='border border-border-light rounded-lg p-3'>
                    <p className='text-sm text-text-secondary'>{s.skill_name || s.skill_id || `Skill ${idx + 1}`}</p>
                    {typeof s.mastery_probability !== 'undefined' && (
                      <p className='text-lg font-semibold mt-1'>{(s.mastery_probability * 100).toFixed(0)}%</p>
                    )}
                  </div>
                ))}
              </div>
              {mastery.skills.length > 10 && (
                <p className='text-xs text-text-secondary mt-3'>Showing first 10 skills</p>
              )}
            </div>
          ) : (
            <div className='mt-4'>
              <p className='text-text-secondary'>No Data Yet!</p>
              <button
                type='button'
                className='mt-3 px-4 py-2 rounded-lg bg-button-primary hover:bg-button-primary-hover transition text-white'
                onClick={() => navigate('/diagnostics')}
              >
                Take Diagnostic
              </button>
              {errors.mastery && (
                <p className='text-xs text-red-500 mt-2'>{errors.mastery}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Analytics
