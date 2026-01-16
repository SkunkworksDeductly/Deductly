import React, { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { useDrill } from '../contexts/DrillContext'

// Helper to convert theta estimate to LSAT score range
const thetaToLSATScore = (theta, accuracy) => {
  // LSAT scores range from 120-180
  // theta typically ranges from -3.5 to 3.5
  // Use a combination of theta and accuracy to estimate score

  // If theta is 0 (placeholder), use accuracy-based estimation
  if (theta === 0 || theta === null) {
    // Map accuracy (0-1) to LSAT range (120-180)
    // 50% accuracy ~ 150, 100% accuracy ~ 175
    const baseScore = 120 + (accuracy * 60)
    return {
      score: Math.round(baseScore),
      low: Math.round(baseScore - 4),
      high: Math.round(baseScore + 4),
      percentile: Math.round(accuracy * 100)
    }
  }

  // Map theta to LSAT score
  // theta of 0 = 150, theta of 3.5 = 180, theta of -3.5 = 120
  const score = Math.round(150 + (theta * (30 / 3.5)))
  const clampedScore = Math.max(120, Math.min(180, score))

  return {
    score: clampedScore,
    low: Math.max(120, clampedScore - 4),
    high: Math.min(180, clampedScore + 4),
    percentile: Math.round(((clampedScore - 120) / 60) * 100)
  }
}

// Radar chart component for cognitive fingerprint
const CognitiveRadarChart = ({ metrics }) => {
  // 6 dimensions for the radar
  const dimensions = [
    { label: 'Logical Reasoning', key: 'logical', angle: 270 },
    { label: 'Accuracy', key: 'accuracy', angle: 330 },
    { label: 'Deduction', key: 'deduction', angle: 30 },
    { label: 'Reading Comp', key: 'reading', angle: 90 },
    { label: 'Speed', key: 'speed', angle: 150 },
    { label: 'Analysis', key: 'analysis', angle: 210 },
  ]

  // Default values if no metrics
  const values = useMemo(() => ({
    logical: metrics?.logical ?? 0.7,
    accuracy: metrics?.accuracy ?? 0.65,
    deduction: metrics?.deduction ?? 0.6,
    reading: metrics?.reading ?? 0.5,
    speed: metrics?.speed ?? 0.55,
    analysis: metrics?.analysis ?? 0.75,
  }), [metrics])

  // Convert polar to cartesian
  const polarToCartesian = (angle, radius) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad)
    }
  }

  // Generate polygon points
  const dataPoints = dimensions.map(d => {
    const radius = values[d.key] * 45 // Max radius 45 (from center 50)
    return polarToCartesian(d.angle, radius)
  })

  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Grid lines (concentric hexagons)
  const gridRadii = [15, 30, 45]
  const gridPolygons = gridRadii.map(r => {
    const points = dimensions.map(d => polarToCartesian(d.angle, r))
    return points.map(p => `${p.x},${p.y}`).join(' ')
  })

  // Axis lines
  const axisLines = dimensions.map(d => {
    const end = polarToCartesian(d.angle, 45)
    return { x1: 50, y1: 50, x2: end.x, y2: end.y }
  })

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Grid lines */}
        <g className="stroke-sand-dark dark:stroke-white/20" strokeWidth="0.5" fill="none">
          {gridPolygons.map((points, i) => (
            <polygon key={i} points={points} />
          ))}
        </g>

        {/* Axis lines */}
        <g className="stroke-sand-dark dark:stroke-white/20" strokeWidth="0.5">
          {axisLines.map((line, i) => (
            <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </g>

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(129, 178, 154, 0.4)"
          stroke="#81B29A"
          strokeWidth="2"
          className="drop-shadow-lg"
        />

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="2.5"
            className={values[dimensions[i].key] >= 0.6 ? 'fill-sage' : 'fill-terracotta'}
          />
        ))}
      </svg>

      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[10px] font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60 whitespace-nowrap">
        Logical Reasoning
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-[10px] font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60 whitespace-nowrap">
        Reading Comp
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 text-[10px] font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60 writing-mode-vertical">
        Speed
      </div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 text-[10px] font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60 writing-mode-vertical">
        Accuracy
      </div>
    </div>
  )
}

// Icon mapping for strengths/weaknesses
const SKILL_ICONS = {
  'S_01': 'psychology',
  'S_02': 'account_tree',
  'S_03': 'compare_arrows',
  'S_04': 'mediation',
  'FL_01': 'rule',
  'FL_02': 'swap_horiz',
  'FL_03': 'linear_scale',
  'FL_04': 'analytics',
  'FL_05': 'join_inner',
  'FL_06': 'tune',
  'FL_07': 'warning',
  'RH_01': 'science',
  'RH_02': 'alt_route',
  'RH_03': 'add_circle',
  'RH_04': 'remove_circle',
  'RH_05': 'query_stats',
  'RH_06': 'person_off',
  'RH_07': 'balance',
  'RH_08': 'zoom_out_map',
  'ABS_01': 'hub',
  'ABS_02': 'bug_report',
  'ABS_03': 'gavel',
}

const DiagnosticSummary = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()
  const { resetSession } = useDrill()

  const sessionId = location.state?.sessionId || null
  const summaryState = location.state?.summary || null
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchEvaluation = async () => {
      if (!sessionId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const result = await api.getDiagnosticEvaluation(sessionId, currentUser?.uid)
        if (isMounted) {
          console.log('Evaluation API Response:', result)
          setEvaluation(result)
        }
      } catch (err) {
        console.error('Failed to fetch evaluation:', err)
        if (isMounted) {
          setError('We could not load your diagnostic evaluation. Please try again shortly.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEvaluation()
    resetSession()

    return () => {
      isMounted = false
    }
  }, [sessionId, currentUser, resetSession])

  const formattedSummary = {
    totalQuestions: summaryState?.total_questions ?? summaryState?.totalQuestions ?? 0,
    correctAnswers: summaryState?.correct_answers ?? summaryState?.correctAnswers ?? 0,
    score: summaryState?.score_percentage ?? summaryState?.score ?? 0
  }

  // Calculate LSAT score estimate
  const lsatEstimate = useMemo(() => {
    const accuracy = formattedSummary.score / 100
    const theta = evaluation?.theta_estimate ?? 0
    return thetaToLSATScore(theta, accuracy)
  }, [evaluation, formattedSummary.score])

  // Build radar chart metrics from evaluation
  const radarMetrics = useMemo(() => {
    if (!evaluation) return null

    const strengths = evaluation.strengths || []
    const weaknesses = evaluation.weaknesses || []

    // Calculate average accuracy from strengths and weaknesses
    const allSkillAccuracies = [
      ...strengths.map(s => s.accuracy || 0.5),
      ...weaknesses.map(w => 0.3) // Weaknesses assumed lower
    ]

    const avgAccuracy = allSkillAccuracies.length > 0
      ? allSkillAccuracies.reduce((a, b) => a + b, 0) / allSkillAccuracies.length
      : 0.5

    return {
      logical: Math.min(1, avgAccuracy + 0.1),
      accuracy: formattedSummary.score / 100,
      deduction: strengths.some(s => s.skill_id?.startsWith('FL')) ? 0.7 : 0.5,
      reading: 0.5, // RC not tested in LR diagnostic
      speed: 0.6,   // Default
      analysis: weaknesses.length < 3 ? 0.75 : 0.55,
    }
  }, [evaluation, formattedSummary.score])

  return (
    <div className="flex-1 flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-sand-dark/30 dark:border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage mb-1">Initial Assessment</p>
          <h1 className="text-2xl md:text-3xl font-slab font-semibold text-text-main dark:text-white">
            Diagnostic Evaluation
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-sand-dark/50 hover:bg-sand transition-colors text-xs font-bold uppercase tracking-wider text-text-main/60 dark:text-white/60">
            <span className="material-symbols-outlined text-base">download</span>
            Export PDF
          </button>
          <button
            onClick={() => navigate('/study-plan')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-text-main dark:bg-white text-white dark:text-text-main hover:bg-black dark:hover:bg-sand transition-colors text-xs font-bold uppercase tracking-wider"
          >
            View Plan
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-5xl mx-auto p-8 md:p-12 lg:p-16 flex flex-col gap-10">

          {/* Hero Section - Estimated LSAT Score */}
          <section className="relative bg-white dark:bg-white/5 rounded-[2.5rem] p-12 text-center shadow-soft-xl border border-sand-dark/20 overflow-hidden">
            {/* Gradient bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sage to-terracotta opacity-60"></div>

            {/* Decorative blurs */}
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-sage-soft rounded-full blur-3xl opacity-50 dark:opacity-10"></div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-terracotta-soft rounded-full blur-3xl opacity-50 dark:opacity-10"></div>

            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-main/40 dark:text-white/40">
                Estimated LSAT Score
              </p>

              {loading ? (
                <div className="animate-pulse">
                  <div className="h-32 w-40 bg-sand/30 rounded-xl"></div>
                </div>
              ) : (
                <>
                  <div className="font-slab font-bold text-[8rem] leading-none text-text-main dark:text-white tracking-tighter">
                    {lsatEstimate.score}
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap justify-center">
                    <span className="px-3 py-1 bg-sage-soft text-sage rounded-full text-xs font-bold uppercase tracking-wider border border-sage/20">
                      {lsatEstimate.percentile}th Percentile
                    </span>
                    <span className="text-text-main/40 dark:text-white/40 text-sm font-medium">
                      Potential Range: {lsatEstimate.low} - {lsatEstimate.high}
                    </span>
                  </div>
                  {/* Raw score for testing */}
                  {evaluation?.total_questions > 0 && (
                    <div className="mt-4 text-text-main/50 dark:text-white/50 text-sm">
                      Raw Score: {evaluation.correct_count} / {evaluation.total_questions} correct
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* No session state */}
          {!sessionId && !loading && (
            <div className="p-4 bg-sand/20 rounded-xl text-center">
              <p className="text-sm text-text-main/60">
                We didn&rsquo;t detect a recent diagnostic session. Start a new diagnostic to see your personalized evaluation.
              </p>
            </div>
          )}

          {/* Cognitive Fingerprint Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Description */}
            <div className="lg:col-span-1 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-terracotta text-3xl">fingerprint</span>
                <h3 className="text-xl font-bold font-slab text-text-main dark:text-white">
                  Cognitive Fingerprint
                </h3>
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-sand/30 rounded w-full"></div>
                  <div className="h-4 bg-sand/30 rounded w-5/6"></div>
                  <div className="h-4 bg-sand/30 rounded w-4/6"></div>
                </div>
              ) : (
                <p className="text-text-main/70 dark:text-sand/70 leading-relaxed text-sm">
                  {evaluation?.cognitive_fingerprint?.interaction_summary ||
                   "Your assessment reveals your unique cognitive profile across the LSAT's core reasoning domains. This shape represents your current baseline and highlights areas for growth."}
                </p>
              )}
            </div>

            {/* Right - Radar Chart */}
            <div className="lg:col-span-2 bg-sand/30 dark:bg-white/5 rounded-3xl p-8 border border-sand-dark/20 flex items-center justify-center relative min-h-[300px]">
              {/* Background circles */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-64 h-64 rounded-full border border-text-main"></div>
                <div className="absolute w-48 h-48 rounded-full border border-text-main"></div>
                <div className="absolute w-32 h-32 rounded-full border border-text-main"></div>
              </div>

              {loading ? (
                <div className="animate-pulse w-64 h-64 rounded-full bg-sand/30"></div>
              ) : (
                <CognitiveRadarChart metrics={radarMetrics} />
              )}
            </div>
          </section>

          {/* Divider */}
          <div className="h-px w-full bg-sand-dark/30 dark:bg-white/10"></div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-12">

            {/* Strengths */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sage-soft flex items-center justify-center text-sage">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-text-main dark:text-white">
                  Top 3 Strengths
                </h4>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 bg-sand/30 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-sand/30 rounded w-1/2"></div>
                        <div className="h-3 bg-sand/30 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : evaluation?.strengths?.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {evaluation.strengths.slice(0, 3).map((strength, idx) => (
                    <div key={idx} className="group flex items-start gap-4">
                      <span className="material-symbols-outlined text-sage mt-1">
                        {SKILL_ICONS[strength.skill_id] || 'psychology'}
                      </span>
                      <div>
                        <h5 className="text-base font-bold text-text-main dark:text-white group-hover:text-sage transition-colors">
                          {strength.skill_name}
                        </h5>
                        <p className="text-sm text-text-main/60 dark:text-white/60 mt-1 leading-snug">
                          {strength.evidence}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-main/50 dark:text-sand/50 text-center py-8">
                  Complete a diagnostic to see your strengths
                </p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-terracotta-soft flex items-center justify-center text-terracotta">
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-text-main dark:text-white">
                  Top 3 Focus Areas
                </h4>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 bg-sand/30 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-sand/30 rounded w-1/2"></div>
                        <div className="h-3 bg-sand/30 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : evaluation?.weaknesses?.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {evaluation.weaknesses.slice(0, 3).map((weakness, idx) => (
                    <div key={idx} className="group flex items-start gap-4">
                      <span className="material-symbols-outlined text-terracotta mt-1">
                        {SKILL_ICONS[weakness.skill_id] || 'timer_off'}
                      </span>
                      <div>
                        <h5 className="text-base font-bold text-text-main dark:text-white group-hover:text-terracotta transition-colors">
                          {weakness.skill_name}
                        </h5>
                        <p className="text-sm text-text-main/60 dark:text-white/60 mt-1 leading-snug">
                          {weakness.root_cause}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-main/50 dark:text-sand/50 text-center py-8">
                  Complete a diagnostic to see your focus areas
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DiagnosticSummary
