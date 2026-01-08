import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DRILL_DIFFICULTIES,
  DRILL_QUESTION_COUNTS,
  DRILL_SKILLS,
  DRILL_TIME_OPTIONS
} from '../config/skillBuilder'
import { useDrill } from '../contexts/DrillContext'
import { useAuth } from '../contexts/AuthContext'

const SingleSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const getOptionValue = (option) => (
    option && typeof option === 'object' && 'value' in option ? option.value : option
  )

  const getOptionLabel = (option) => (
    option && typeof option === 'object' && 'label' in option ? option.label : String(option)
  )

  const selectedOption = options.find((option) => getOptionValue(option) === selected) || null
  const summary = selectedOption ? getOptionLabel(selectedOption) : placeholder

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">{label}</label>
      <button
        type="button"
        className="w-full rounded-xl px-4 py-3 text-left text-text-primary flex items-center justify-between bg-bg-secondary border border-border-default hover:border-border-hover transition-all duration-200"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`truncate text-sm ${selectedOption ? 'text-text-primary' : 'text-text-secondary'}`}>
          {summary}
        </span>
        <svg className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl bg-bg-secondary border border-border-default shadow-xl backdrop-blur-xl">
          <div className="py-2">
            {options.map((option) => {
              const value = getOptionValue(option)
              const labelText = getOptionLabel(option)
              const isActive = value === selected

              return (
                <button
                  key={value}
                  type="button"
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-primary/20 text-brand-primary font-medium border-l-2 border-brand-primary'
                      : 'text-text-primary hover:bg-bg-tertiary'
                  }`}
                  onClick={() => {
                    onChange(value)
                    setIsOpen(false)
                  }}
                >
                  <span>{labelText}</span>
                  {isActive && <span className="text-brand-primary text-xs font-semibold">✓</span>}
                </button>
              )
            })}

            {options.length === 0 && (
              <div className="px-4 py-2.5 text-sm text-text-secondary">No options</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  placeholder,
  showClear = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleOption = (value) => {
    const nextValues = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(nextValues)
  }

  const summary = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.slice(0, 2).join(', ')} +${selected.length - 2} more`

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">{label}</label>
      <button
        type="button"
        className="w-full rounded-xl px-4 py-3 text-left text-text-primary flex items-center justify-between bg-bg-secondary border border-border-default hover:border-border-hover transition-all duration-200"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="truncate text-sm text-text-secondary">{summary}</span>
        <svg className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl bg-bg-secondary border border-border-default shadow-xl backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto">
            <div className="sticky top-0 bg-bg-secondary border-b border-border-subtle py-2 px-4 flex gap-2">
              <button
                type="button"
                className={`text-xs font-semibold text-brand-primary hover:text-brand-secondary transition ${showClear ? 'flex-1 text-left' : 'w-full text-left'}`}
                onClick={() => onChange(options)}
              >
                Select All
              </button>
              {showClear && (
                <button
                  type="button"
                  className="flex-1 text-xs font-semibold text-brand-primary hover:text-brand-secondary transition text-right"
                  onClick={() => onChange([])}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="py-2">
              {options.map((option) => {
                const isActive = selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-primary/20 text-brand-primary font-medium border-l-2 border-brand-primary'
                        : 'text-text-primary hover:bg-bg-tertiary'
                    }`}
                    onClick={() => toggleOption(option)}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-border-default bg-bg-primary text-brand-primary focus:ring-brand-primary focus:ring-offset-0 pointer-events-none"
                    />
                    <span>{option}</span>
                  </button>
                )
              })}
              {options.length === 0 && (
                <div className="px-4 py-2.5 text-sm text-text-secondary">No options</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DrillBuilder = () => {
  const navigate = useNavigate()
  const { currentUser, getAuthHeaders } = useAuth()
  const {
    drillConfig,
    setDrillConfig,
    setDrillSession,
    setSelectedAnswers,
    setCurrentQuestionIndex,
    resetAll
  } = useDrill()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const startDrillSession = async () => {
    try {
      setErrorMessage(null)
      setIsLoading(true)

      const payload = {
        user_id: currentUser?.uid || 'anonymous',
        question_count: drillConfig.questionCount,
        difficulties: drillConfig.difficulties,
        skills: drillConfig.skills,
        time_percentage: drillConfig.timePercentage,
        drill_type: 'practice'
      }

      const headers = await getAuthHeaders()

      const response = await fetch('/api/skill-builder/drill', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Unable to generate drill session')
      }

      const session = await response.json()

      setDrillSession({
        ...session,
        origin: 'practice'
      })
      setSelectedAnswers({})
      setCurrentQuestionIndex(0)
      navigate('/drill/session')
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong while generating the drill.')
      setDrillSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetConfiguration = () => {
    resetAll()
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="rounded-3xl border border-border-default bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 p-10 shadow-xl backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-text-primary mb-3 tracking-tight">Build Your LSAT Drill</h1>
            <p className="text-text-secondary text-base max-w-3xl leading-relaxed">
              Customize a focused practice set by choosing the question mix that matches your study goals.
              Pick the number of questions, dial in the difficulty, and highlight the reasoning skills you want to sharpen.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <SingleSelectDropdown
                label="Question Count"
                options={DRILL_QUESTION_COUNTS.map((count) => ({
                  value: count,
                  label: `${count} questions`
                }))}
                selected={drillConfig.questionCount}
                placeholder="Select question count"
                onChange={(value) => {
                  const nextValue = typeof value === 'number' ? value : Number(value)
                  setDrillConfig((prev) => ({ ...prev, questionCount: nextValue }))
                }}
              />

              <SingleSelectDropdown
                label="Timing"
                options={DRILL_TIME_OPTIONS}
                selected={drillConfig.timePercentage}
                placeholder="Select timing"
                onChange={(value) => {
                  const nextValue = value === 'untimed' ? 'untimed' : Number(value)
                  setDrillConfig((prev) => ({ ...prev, timePercentage: nextValue }))
                }}
              />

              <MultiSelectDropdown
                label="Difficulty"
                options={DRILL_DIFFICULTIES}
                selected={drillConfig.difficulties}
                placeholder="Select difficulty levels"
                onChange={(values) => {
                  const next = values.length === 0 ? ['Medium'] : values
                  setDrillConfig((prev) => ({ ...prev, difficulties: next }))
                }}
              />

              <MultiSelectDropdown
                label="Skills"
                options={DRILL_SKILLS}
                selected={drillConfig.skills}
                placeholder="Select targeted skills (optional)"
                showClear={true}
                onChange={(values) => {
                  setDrillConfig((prev) => ({ ...prev, skills: values }))
                }}
              />
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border-default bg-bg-primary/40 p-6 space-y-5 backdrop-blur-sm">
                <h3 className="text-xl font-medium text-text-primary">Drill Summary</h3>
                <div className="space-y-3 text-sm text-text-secondary">
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary">Questions</span>
                    <span className="text-base font-medium text-text-primary">{drillConfig.questionCount}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-border-subtle">
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary">Difficulty mix</span>
                    <span className="text-base font-medium text-text-primary text-right">{[...drillConfig.difficulties]
                      .sort((a, b) => {
                        const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Challenging': 4 }
                        return order[a] - order[b]
                      })
                      .join(', ')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary">Timing</span>
                    <span className="text-base font-medium text-text-primary">{
                      DRILL_TIME_OPTIONS.find((option) => option.value === drillConfig.timePercentage)?.label
                      || `${drillConfig.timePercentage}%`
                    }</span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary">Skills</span>
                    <span className="text-base font-medium text-text-primary text-right">{drillConfig.skills.length > 0 ? drillConfig.skills.join(', ') : 'Any available'}</span>
                  </div>
                </div>
                {errorMessage && (
                  <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
                    {errorMessage}
                  </div>
                )}
                {drillConfig.difficulties.length === 0 && (
                  <div className="text-sm text-text-secondary bg-bg-tertiary/50 border border-border-subtle rounded-xl px-4 py-3">
                    Please select at least one difficulty level to continue
                  </div>
                )}
                <button
                  type="button"
                  className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transform hover:-translate-y-0.5"
                  onClick={startDrillSession}
                  disabled={isLoading || drillConfig.difficulties.length === 0}
                >
                  {isLoading ? 'Generating...' : 'Generate Drill'}
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 bg-transparent border border-border-default hover:bg-bg-tertiary rounded-xl text-text-secondary text-sm transition-all duration-200"
                  onClick={handleResetConfiguration}
                  disabled={isLoading}
                >
                  Reset configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border-default bg-gradient-to-br from-bg-secondary/90 to-bg-tertiary/95 p-10 shadow-xl backdrop-blur-xl">
          <h2 className="font-serif text-3xl font-normal mb-4 text-text-primary tracking-tight">Ready when you are</h2>
          <p className="text-text-secondary max-w-2xl text-base leading-relaxed">
            Choose your drill configuration above and tap <span className="text-text-primary font-semibold">Generate Drill</span> to pull a fresh set of questions from the Deductly skill library.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border-subtle bg-bg-primary/30 p-6 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold mb-2 text-base">Adaptive mix</p>
              <p className="text-sm text-text-secondary leading-relaxed">We'll fill any gaps in your request with similar questions so every drill reaches your requested length.</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-primary/30 p-6 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold mb-2 text-base">Real LSAT content</p>
              <p className="text-sm text-text-secondary leading-relaxed">Questions map directly to LSAT reasoning skills so you always know what you're sharpening.</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-bg-primary/30 p-6 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold mb-2 text-base">Flexible pacing</p>
              <p className="text-sm text-text-secondary leading-relaxed">Dial the timer from tight to untimed to mirror your practice strategy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrillBuilder
