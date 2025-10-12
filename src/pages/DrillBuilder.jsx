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
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-text-primary flex items-center justify-between bg-white border border-border-light hover:bg-stone-50 transition"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`truncate text-sm ${selectedOption ? 'text-text-primary' : 'text-text-secondary'}`}>
          {summary}
        </span>
        <span className="ml-3 text-text-secondary text-xs">v</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl bg-white border border-border-light shadow-lg">
          <div className="py-2">
            {options.map((option) => {
              const value = getOptionValue(option)
              const labelText = getOptionLabel(option)
              const isActive = value === selected

              return (
                <button
                  key={value}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition ${
                    isActive
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-text-primary hover:bg-stone-50'
                  }`}
                  onClick={() => {
                    onChange(value)
                    setIsOpen(false)
                  }}
                >
                  <span>{labelText}</span>
                  {isActive && <span className="text-primary text-xs font-semibold">selected</span>}
                </button>
              )
            })}

            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-secondary">No options</div>
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
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <button
        type="button"
        className="w-full rounded-lg px-3 py-2 text-left text-text-primary flex items-center justify-between bg-white border border-border-light hover:bg-stone-50 transition"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="truncate text-sm">{summary}</span>
        <span className="ml-3 text-text-secondary text-xs">v</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl bg-white border border-border-light shadow-lg">
          <div className="max-h-64 overflow-y-auto py-2">
            {options.map((option) => {
              const isActive = selected.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition ${
                    isActive
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-text-primary hover:bg-stone-50'
                  }`}
                  onClick={() => toggleOption(option)}
                >
                  <span>{option}</span>
                  {isActive && <span className="text-primary text-xs font-semibold">selected</span>}
                </button>
              )
            })}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-secondary">No options</div>
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => (
            <span
              key={value}
              className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary"
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const DrillBuilder = () => {
  const navigate = useNavigate()
  const { getAuthHeaders } = useAuth()
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
        question_count: drillConfig.questionCount,
        difficulties: drillConfig.difficulties,
        skills: drillConfig.skills,
        time_percentage: drillConfig.timePercentage
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
    <div className="py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="rounded-2xl border border-border-light bg-white p-8 shadow-md">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Build Your LSAT Drill</h1>
            <p className="text-text-secondary max-w-3xl">
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
                onChange={(values) => {
                  setDrillConfig((prev) => ({ ...prev, skills: values }))
                }}
              />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border-light bg-accent-lavender/20 p-5 space-y-4">
                <h3 className="text-lg font-semibold text-text-primary">Drill Summary</h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>
                    <span className="font-semibold text-text-primary">Questions:</span> {drillConfig.questionCount}
                  </p>
                  <p>
                    <span className="font-semibold text-text-primary">Difficulty mix:</span> {drillConfig.difficulties.join(', ')}
                  </p>
                  <p>
                    <span className="font-semibold text-text-primary">Timing:</span>{' '}
                    {
                      DRILL_TIME_OPTIONS.find((option) => option.value === drillConfig.timePercentage)?.label
                      || `${drillConfig.timePercentage}%`
                    }
                  </p>
                  <p>
                    <span className="font-semibold text-text-primary">Skills:</span>{' '}
                    {drillConfig.skills.length > 0 ? drillConfig.skills.join(', ') : 'Any available'}
                  </p>
                </div>
                {errorMessage && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {errorMessage}
                  </div>
                )}
                <button
                  type="button"
                  className="w-full py-2.5 bg-accent-peach hover:bg-accent-peach/80 rounded-lg text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  onClick={startDrillSession}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Drill'}
                </button>
                <button
                  type="button"
                  className="w-full py-2 bg-white border border-border-light hover:bg-stone-50 rounded-lg text-text-secondary text-sm transition"
                  onClick={handleResetConfiguration}
                  disabled={isLoading}
                >
                  Reset configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-light bg-white p-8 text-text-primary shadow-md">
          <h2 className="text-2xl font-semibold mb-3">Ready when you are</h2>
          <p className="text-text-secondary max-w-2xl">
            Choose your drill configuration above and tap <span className="text-text-primary font-semibold">Generate Drill</span> to pull a fresh set of questions from the Deductly skill library.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm text-text-secondary">
            <div className="rounded-xl border border-border-light bg-accent-lavender/10 p-4">
              <p className="text-text-primary font-semibold">Adaptive mix</p>
              <p className="mt-2">We'll fill any gaps in your request with similar questions so every drill reaches your requested length.</p>
            </div>
            <div className="rounded-xl border border-border-light bg-accent-lavender/10 p-4">
              <p className="text-text-primary font-semibold">Real LSAT content</p>
              <p className="mt-2">Questions map directly to LSAT reasoning skills so you always know what you're sharpening.</p>
            </div>
            <div className="rounded-xl border border-border-light bg-accent-lavender/10 p-4">
              <p className="text-text-primary font-semibold">Flexible pacing</p>
              <p className="mt-2">Dial the timer from tight to untimed to mirror your practice strategy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrillBuilder
