import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ScaleBar } from '../components/ui/ScaleBar'
import { Badge } from '../components/ui/Badge'

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

  // Process mastery data for Radar Chart
  const radarData = useMemo(() => {
    if (!mastery || !mastery.skills) return []
    // Take top 6 skills or specific categories for the radar
    // For now taking first 6 for demo purposes
    return mastery.skills.slice(0, 6).map(s => ({
      label: s.skill_name || s.skill_id,
      value: s.mastery_probability ? s.mastery_probability * 100 : 50
    }))
  }, [mastery])

  // Generate path string for radar chart
  const radarPath = useMemo(() => {
    if (radarData.length === 0) return ""
    const count = radarData.length
    const radius = 100
    const center = { x: 150, y: 150 }

    return radarData.map((d, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      const valueScale = d.value / 100 // assuming value is 0-100
      const x = center.x + radius * valueScale * Math.cos(angle)
      const y = center.y + radius * valueScale * Math.sin(angle)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ') + 'Z'
  }, [radarData])

  return (
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-sand-dark/30 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-main dark:text-white tracking-tight mb-2">
            Performance Analytics
          </h1>
          <p className="text-text-main/60 dark:text-sand/60 font-medium font-serif italic text-lg">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Charts */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50">Score Progress</h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-terracotta"></span>
                <span className="text-xs font-bold text-text-main/40 dark:text-white/40">Ability Estimate</span>
              </div>
            </div>
            {/* Placeholder Line Chart */}
            <div className="h-64 flex items-end justify-between gap-2 px-4 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 25, 50, 75, 100].map(i => (
                  <div key={i} className="w-full h-px bg-sand-dark/10 dark:bg-white/5"></div>
                ))}
              </div>

              {/* Mock Data Bars for visual - replace with real history later */}
              {[142, 145, 148, 146, 150, 152, 155, 158, 160, 164].map((h, i) => (
                <div key={i} className="w-full bg-terracotta/20 rounded-t-sm hover:bg-terracotta/40 transition-colors relative group" style={{ height: `${(h - 120) / (180 - 120) * 100}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Radar Chart Section */}
            <Card variant="flat" className="relative">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 mb-6">Skill Mastery Profile</h3>

              <div className="flex justify-center py-6">
                {loading ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-terracotta border-t-transparent"></div>
                ) : radarData.length > 0 ? (
                  <svg viewBox="0 0 300 300" className="w-64 h-64 overflow-visible">
                    {/* Grid Circles */}
                    <circle cx="150" cy="150" r="100" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                    <circle cx="150" cy="150" r="75" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                    <circle cx="150" cy="150" r="50" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                    <circle cx="150" cy="150" r="25" fill="none" stroke="currentColor" strokeOpacity="0.1" />

                    {/* Axes */}
                    {radarData.map((d, i) => {
                      const count = radarData.length
                      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
                      const x = 150 + 100 * Math.cos(angle)
                      const y = 150 + 100 * Math.sin(angle)
                      return <line key={i} x1="150" y1="150" x2={x} y2={y} stroke="currentColor" strokeOpacity="0.1" />
                    })}

                    {/* Data Path */}
                    <path
                      d={radarPath}
                      fill="rgba(224, 122, 95, 0.2)"
                      stroke="#E07A5F"
                      strokeWidth="2"
                    />

                    {/* Labels */}
                    {radarData.map((d, i) => {
                      const count = radarData.length
                      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
                      const x = 150 + 120 * Math.cos(angle)
                      const y = 150 + 120 * Math.sin(angle)
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-[10px] font-bold uppercase fill-current opacity-60"
                        >
                          {d.label.substring(0, 10)}
                        </text>
                      )
                    })}
                  </svg>
                ) : (
                  <div className="text-center py-12 text-sm opacity-50">
                    No mastery data available yet.
                  </div>
                )}
              </div>
            </Card>

            {/* Weakest Concepts / Action Items */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50">Needs Improvement</h3>

              {loading ? (
                <div className="h-40 bg-sand-dark/10 animate-pulse rounded-xl" />
              ) : mastery?.skills ? (
                mastery.skills
                  .sort((a, b) => (a.mastery_probability || 0) - (b.mastery_probability || 0))
                  .slice(0, 3)
                  .map((s, idx) => (
                    <Card key={idx} variant="interactive" className="p-4" onClick={() => navigate('/drill')}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-text-main dark:text-white">{s.skill_name || s.skill_id}</h4>
                        <span className="text-terracotta font-bold text-sm">
                          {Math.round((s.mastery_probability || 0) * 100)}%
                        </span>
                      </div>
                      <ScaleBar score={120 + ((s.mastery_probability || 0) * 60)} min={120} max={180} className="h-1.5" />
                      <div className="mt-3 flex justify-end">
                        <span className="text-[10px] uppercase font-bold text-text-main/40 dark:text-white/40 hover:text-terracotta cursor-pointer transition-colors">
                          Drill This Concept &rarr;
                        </span>
                      </div>
                    </Card>
                  ))
              ) : (
                <p className="opacity-50 text-sm">No data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stats Summary */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-text-main text-sand-light dark:bg-white dark:text-text-main border-none">
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-8">Current Ability</h2>

            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-6xl font-black">{ability?.ability_theta ? (150 + ability.ability_theta * 10).toFixed(0) : '—'}</span>
              <span className="text-lg font-serif italic opacity-70">Estimated Score</span>
            </div>

            <p className="text-sm opacity-60 leading-relaxed mb-8">
              Based on your Item Response Theory (θ) rating of {ability?.ability_theta?.toFixed(2) || '0.00'}.
              This places you in the <span className="font-bold text-terracotta">Advanced</span> percentile.
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 dark:border-black/10 pt-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Confidence</span>
                <span className="text-xl font-bold">High</span>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Std Error</span>
                <span className="text-xl font-bold">±{ability?.standard_error?.toFixed(2) || '0.0'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 mb-6">Recent Milestones</h2>
            <ul className="space-y-6 relative">
              {/* Timeline Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-sand-dark/20 dark:bg-white/10"></div>

              {[
                { title: "Crossed 160 Threshold", date: "2 days ago", icon: "emoji_events" },
                { title: "Completed Diagnostic", date: "1 week ago", icon: "assignment_turned_in" },
                { title: "Account Created", date: "2 weeks ago", icon: "person_add" }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-4 relative">
                  <div className="z-10 bg-background-light dark:bg-background-dark p-1">
                    <div className="w-2 h-2 rounded-full bg-sage ring-4 ring-background-light dark:ring-background-dark"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main dark:text-white">{item.title}</h4>
                    <p className="text-xs text-text-main/40 dark:text-white/40">{item.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Analytics
