import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Card } from '../components/ui/Card'

// Helper to convert theta to LSAT scale (120-180)
const thetaToLSAT = (theta) => {
  if (theta === null || theta === undefined) return null
  // Clamp theta to reasonable range and convert
  const clamped = Math.max(-3.5, Math.min(3.5, theta))
  return Math.round(150 + clamped * 8.5)
}

// Helper to convert raw Elo rating to percentage for progress bars (1000-2000 range)
const eloToPercent = (rating) => {
  const min = 1000
  const max = 2000
  return Math.max(0, Math.min(100, ((rating - min) / (max - min)) * 100))
}

// Skill categorization - LR skills start with S_, FL_, RH_, ABS_
// RC skills start with RC_
const isLRSkill = (skillId) => /^(S_|FL_|RH_|ABS_)/.test(skillId)
const isRCSkill = (skillId) => /^RC_/.test(skillId)

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

  // Calculate domain scores from raw Elo ratings
  const domainScores = useMemo(() => {
    if (!mastery?.skills) return { lr: null, rc: null }

    const lrSkills = mastery.skills.filter(s => isLRSkill(s.skill_id))
    const rcSkills = mastery.skills.filter(s => isRCSkill(s.skill_id))

    const avgRating = (skills) => {
      if (skills.length === 0) return null
      return skills.reduce((sum, s) => sum + (s.rating || 1500), 0) / skills.length
    }

    return {
      lr: avgRating(lrSkills),
      rc: avgRating(rcSkills)
    }
  }, [mastery])

  // Separate skills by domain for the matrix
  const skillsByDomain = useMemo(() => {
    if (!mastery?.skills) return { lr: [], rc: [] }

    return {
      lr: mastery.skills
        .filter(s => isLRSkill(s.skill_id))
        .sort((a, b) => (b.rating || 1500) - (a.rating || 1500)),
      rc: mastery.skills
        .filter(s => isRCSkill(s.skill_id))
        .sort((a, b) => (b.rating || 1500) - (a.rating || 1500))
    }
  }, [mastery])

  // Find weakest skills for recommendations
  const weakestSkills = useMemo(() => {
    if (!mastery?.skills) return []
    return [...mastery.skills]
      .sort((a, b) => (a.rating || 1500) - (b.rating || 1500))
      .slice(0, 3)
  }, [mastery])

  // Calculate reliability from standard error (inverse relationship)
  const reliability = useMemo(() => {
    if (!ability?.standard_error) return null
    // SE of 0 = 100% reliability, SE of 1 = ~50% reliability
    return Math.max(0.5, 1 - ability.standard_error * 0.5)
  }, [ability])

  const lsatScore = thetaToLSAT(ability?.ability_theta)

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-14 flex flex-col gap-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-sand-dark/30 dark:border-white/5 pb-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-terracotta">Psychometrics</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-main dark:text-white leading-[0.9]">
            Latent Ability<br/>
            <span className="text-text-main/40 dark:text-white/40 font-medium tracking-tight">Analytics.</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Hero Card - Latent Ability Assessment */}
          <div className="bg-terracotta text-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-terracotta/20 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div>
                <div className="flex items-center gap-3 mb-2 opacity-90">
                  <span className="material-symbols-outlined text-lg">psychology_alt</span>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Latent Ability Assessment</p>
                </div>
                <h4 className="text-xs opacity-70 font-medium mb-6 max-w-xs leading-relaxed">
                  Rasch-model estimation of true ability independent of test difficulty variance.
                </h4>

                {loading ? (
                  <div className="flex items-baseline gap-4">
                    <div className="h-20 w-32 bg-white/20 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-4">
                    <span className="text-7xl md:text-8xl font-slab font-bold leading-none tracking-tight">
                      {lsatScore || '—'}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded text-center">
                        ± {ability?.standard_error ? (ability.standard_error * 8.5).toFixed(1) : '—'} SEM
                      </span>
                      <span className="text-[10px] uppercase tracking-widest opacity-80 text-center">Confidence Band</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest">Reliability Index</span>
                  <span className="font-slab font-bold text-xl">
                    {reliability ? reliability.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${(reliability || 0) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed">
                  {reliability && reliability > 0.9
                    ? "High convergence. Your performance consistency suggests this score is a robust predictor of test-day outcomes."
                    : "More practice data will improve estimation confidence."}
                </p>
              </div>
            </div>
          </div>

          {/* Domain Score Cards - Only LR and RC (no Logic Games) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logical Reasoning */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-sand-dark/20 dark:border-white/5 shadow-soft flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60">Logical Reasoning</h5>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-slab font-bold text-text-main dark:text-white">
                      {lsatScore || '—'}
                    </span>
                    <span className="text-xs font-bold text-sage">IRT</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sage/80 text-2xl">balance</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 z-0 opacity-40">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,35 Q20,30 40,20 T100,5" fill="none" stroke="#81B29A" strokeWidth="2"/>
                  <defs>
                    <linearGradient id="gradSage" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#81B29A', stopOpacity:1}}/>
                      <stop offset="100%" style={{stopColor:'#81B29A', stopOpacity:0}}/>
                    </linearGradient>
                  </defs>
                  <path d="M0,40 L0,35 Q20,30 40,20 T100,5 L100,40 Z" fill="url(#gradSage)" opacity="0.2"/>
                </svg>
              </div>
            </div>

            {/* Reading Comprehension */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-sand-dark/20 dark:border-white/5 shadow-soft flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60">Reading Comp</h5>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-slab font-bold text-text-main dark:text-white">
                      {lsatScore || '—'}
                    </span>
                    <span className="text-xs font-bold text-terracotta">IRT</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-terracotta/80 text-2xl">menu_book</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 z-0 opacity-40">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <defs>
                    <linearGradient id="gradTerracotta" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#E07A5F', stopOpacity:1}}/>
                      <stop offset="100%" style={{stopColor:'#E07A5F', stopOpacity:0}}/>
                    </linearGradient>
                  </defs>
                  <path d="M0,20 Q30,15 50,25 T100,20" fill="none" stroke="#E07A5F" strokeWidth="2"/>
                  <path d="M0,40 L0,20 Q30,15 50,25 T100,20 L100,40 Z" fill="url(#gradTerracotta)" opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Cognitive Mastery Matrix */}
          <Card className="!rounded-[2rem]">
            <div className="flex justify-between items-end mb-8 border-b border-sand-dark/10 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-xl font-bold">Cognitive Mastery Matrix</h3>
                <p className="text-xs opacity-50 font-medium mt-1 uppercase tracking-wider">Skill Proficiency by Elo Rating</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: '#E8F0ED', color: '#3D7A68' }}>Strong</span>
                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: '#EBF5F1', color: '#81B29A' }}>Proficient</span>
                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: '#F7F3E8', color: '#C9A962' }}>Developing</span>
                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: '#F8EBE8', color: '#E07A5F' }}>Emerging</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-8 bg-sand-dark/10 animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Logical Reasoning Skills */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/40 dark:text-white/40 mb-2">Logical Reasoning ({skillsByDomain.lr.length} skills)</h4>
                  {skillsByDomain.lr.map((skill, idx) => {
                    const rating = skill.rating || 1500
                    const tierColor = skill.tier_color || '#F59E0B'
                    return (
                      <div key={idx} className="group">
                        <div className="flex justify-between text-xs mb-1 font-bold">
                          <span className="truncate pr-2">{skill.skill_name}</span>
                          <span className="font-slab" style={{ color: tierColor }}>
                            {Math.round(rating)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-sand-dark/20 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${eloToPercent(rating)}%`, backgroundColor: tierColor }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                  {skillsByDomain.lr.length === 0 && (
                    <p className="text-xs opacity-50">No LR skills tracked yet.</p>
                  )}
                </div>

                {/* Reading Comprehension Skills */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-main/40 dark:text-white/40 mb-2">Reading Comprehension ({skillsByDomain.rc.length} skills)</h4>
                  {skillsByDomain.rc.map((skill, idx) => {
                    const rating = skill.rating || 1500
                    const tierColor = skill.tier_color || '#F59E0B'
                    return (
                      <div key={idx} className="group">
                        <div className="flex justify-between text-xs mb-1 font-bold">
                          <span className="truncate pr-2">{skill.skill_name}</span>
                          <span className="font-slab" style={{ color: tierColor }}>
                            {Math.round(rating)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-sand-dark/20 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${eloToPercent(rating)}%`, backgroundColor: tierColor }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                  {skillsByDomain.rc.length === 0 && (
                    <p className="text-xs opacity-50">No RC skills tracked yet.</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Performance Metrics */}
          <Card className="flex-1">
            <h3 className="text-xl font-bold mb-8">Performance Metrics</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-sand dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-sage-soft text-sage">
                    <span className="material-symbols-outlined text-xl">psychology</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">Theta (θ)</span>
                </div>
                <span className="font-slab font-bold text-lg">
                  {ability?.ability_theta?.toFixed(2) || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-sand dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-terracotta-soft text-terracotta">
                    <span className="material-symbols-outlined text-xl">error</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">Std Error</span>
                </div>
                <span className="font-slab font-bold text-lg">
                  ±{ability?.standard_error?.toFixed(3) || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-sand dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-sage-soft text-sage">
                    <span className="material-symbols-outlined text-xl">quiz</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">Skills Tracked</span>
                </div>
                <span className="font-slab font-bold text-lg">
                  {mastery?.skills?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-terracotta-soft text-terracotta">
                    <span className="material-symbols-outlined text-xl">target</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">Model</span>
                </div>
                <span className="font-slab font-bold text-lg">IRT + ELO</span>
              </div>
            </div>
          </Card>

          {/* Focus Areas */}
          <Card className="h-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Focus Areas</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta bg-terracotta-soft px-2 py-1 rounded">
                {weakestSkills.length > 0 ? 'Recommended' : 'No Data'}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-sand-dark/10 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : weakestSkills.length > 0 ? (
              <div className="space-y-4">
                {weakestSkills.map((skill, idx) => {
                  const tierColor = skill.tier_color || '#F97316'
                  const tierBgColor = skill.tier_bg_color || '#FFEDD5'
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                      style={{ backgroundColor: tierBgColor + '40' }}
                      onClick={() => navigate('/drill')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tierColor }}></div>
                        <span className="text-sm font-medium truncate max-w-[160px]">{skill.skill_name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: tierColor }}>{Math.round(skill.rating || 1500)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm opacity-50 text-center py-4">Complete drills to get personalized recommendations.</p>
            )}
          </Card>

          {/* Insight Card */}
          {weakestSkills.length > 0 && (
            <div className="bg-sand-dark/20 dark:bg-white/5 p-6 rounded-2xl flex items-start gap-4 border border-sand-dark/10 dark:border-white/5">
              <span className="material-symbols-outlined shrink-0 mt-1" style={{ color: weakestSkills[0]?.tier_color || '#F97316' }}>lightbulb</span>
              <div>
                <p className="text-xs font-medium leading-relaxed text-text-main dark:text-white">
                  Focus on <span className="font-bold" style={{ color: weakestSkills[0]?.tier_color || '#F97316' }}>{weakestSkills[0]?.skill_name}</span> to see the biggest improvement.
                  Consider targeted drills on this skill area.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
