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
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils'

// Styled Dropdown Components
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
    <div className="relative space-y-3" ref={containerRef}>
      <label className="text-xs font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 px-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-2xl px-5 py-4 text-left cursor-pointer transition-all duration-200 border flex items-center justify-between group",
          isOpen
            ? "bg-white dark:bg-white/10 border-terracotta ring-1 ring-terracotta"
            : "bg-sand/30 dark:bg-white/5 border-sand-dark/30 dark:border-white/10 hover:border-terracotta/50"
        )}
      >
        <span className={cn(
          "text-sm font-medium",
          selectedOption ? "text-text-main dark:text-white" : "text-text-main/40 dark:text-white/40"
        )}>
          {summary}
        </span>
        <span className={cn(
          "material-symbols-outlined text-text-main/30 group-hover:text-terracotta transition-colors duration-200",
          isOpen && "rotate-180 text-terracotta"
        )}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-30 mt-2 w-full rounded-2xl bg-white dark:bg-[#2A2D26] border border-sand-dark/20 dark:border-white/10 shadow-soft-xl max-h-60 overflow-y-auto p-2">
          {options.map((option) => {
            const value = getOptionValue(option)
            const labelText = getOptionLabel(option)
            const isActive = value === selected

            return (
              <div
                key={value}
                onClick={() => {
                  onChange(value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-left text-sm flex items-center justify-between cursor-pointer transition-colors mb-1",
                  isActive
                    ? "bg-terracotta-soft text-terracotta font-bold"
                    : "text-text-main dark:text-sand hover:bg-sand/30 dark:hover:bg-white/5"
                )}
              >
                <span>{labelText}</span>
                {isActive && <span className="material-symbols-outlined text-sm">check</span>}
              </div>
            )
          })}
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
    <div className="relative space-y-3" ref={containerRef}>
      <label className="text-xs font-bold uppercase tracking-widest text-text-main/50 dark:text-white/50 px-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-2xl px-5 py-4 text-left cursor-pointer transition-all duration-200 border flex items-center justify-between group",
          isOpen
            ? "bg-white dark:bg-white/10 border-sage ring-1 ring-sage"
            : "bg-sand/30 dark:bg-white/5 border-sand-dark/30 dark:border-white/10 hover:border-sage/50"
        )}
      >
        <span className={cn(
          "text-sm font-medium",
          selected.length > 0 ? "text-text-main dark:text-white" : "text-text-main/40 dark:text-white/40"
        )}>
          {summary}
        </span>
        <span className={cn(
          "material-symbols-outlined text-text-main/30 group-hover:text-sage transition-colors duration-200",
          isOpen && "rotate-180 text-sage"
        )}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-30 mt-2 w-full rounded-2xl bg-white dark:bg-[#2A2D26] border border-sand-dark/20 dark:border-white/10 shadow-soft-xl max-h-80 overflow-y-auto p-2">
          <div className="flex justify-between items-center px-4 py-2 border-b border-sand-dark/10 dark:border-white/5 mb-2">
            <button onClick={() => onChange(options)} className="text-xs font-bold uppercase text-sage hover:text-sage-dark transition-colors">Select All</button>
            {showClear && <button onClick={() => onChange([])} className="text-xs font-bold uppercase text-text-main/40 hover:text-terracotta transition-colors">Clear</button>}
          </div>
          {options.map((option) => {
            const isActive = selected.includes(option)
            return (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-left text-sm flex items-center justify-between cursor-pointer transition-colors mb-1",
                  isActive
                    ? "bg-sage-soft text-sage font-bold"
                    : "text-text-main dark:text-sand hover:bg-sand/30 dark:hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    isActive ? "bg-sage border-sage" : "border-text-main/30 bg-white"
                  )}>
                    {isActive && <span className="material-symbols-outlined text-white text-[10px]">check</span>}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            )
          })}
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
        drill_type: 'practice',
        exclusion_mode: drillConfig.allowRepeatedQuestions ? 'none' : 'all_seen'
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
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-sand-dark/30 dark:border-white/5 pb-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-terracotta font-sans">Practice Center</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-main dark:text-white leading-[0.9]">
            Drill<br />
            <span className="text-text-main/40 dark:text-white/40 font-medium tracking-tight">Focus &amp; Sharpen.</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-7 space-y-8">
          <Card variant="flat" className="bg-white dark:bg-white/5 p-8 border border-sand-dark/30 dark:border-white/10">
            <h2 className="text-2xl font-bold font-slab text-text-main dark:text-white mb-2">Build Custom Drill</h2>
            <p className="text-text-main/60 dark:text-sand/60 mb-8 max-w-lg">
              Customize a focused practice set. Pick question count, difficulty, and specific reasoning skills.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SingleSelectDropdown
                  label="Question Count"
                  options={DRILL_QUESTION_COUNTS.map((count) => ({
                    value: count,
                    label: `${count} questions`
                  }))}
                  selected={drillConfig.questionCount}
                  placeholder="Select count"
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
              </div>

              <div className="grid grid-cols-1 gap-6">
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
                  label="Target Skills"
                  options={DRILL_SKILLS}
                  selected={drillConfig.skills}
                  placeholder="All Skills (Mixed)"
                  showClear={true}
                  onChange={(values) => {
                    setDrillConfig((prev) => ({ ...prev, skills: values }))
                  }}
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-colors duration-300",
                    drillConfig.allowRepeatedQuestions ? "bg-terracotta" : "bg-sand-dark"
                  )}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={drillConfig.allowRepeatedQuestions}
                      onChange={() => setDrillConfig((prev) => ({ ...prev, allowRepeatedQuestions: !prev.allowRepeatedQuestions }))}
                    />
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300",
                      drillConfig.allowRepeatedQuestions ? "left-7" : "left-1"
                    )} />
                  </div>
                  <span className="text-sm font-medium text-text-main/70 group-hover:text-text-main transition-colors">Allow Repeats</span>
                </label>

                <button
                  type="button"
                  className="text-xs font-bold uppercase tracking-widest text-text-main/40 hover:text-terracotta transition-colors"
                  onClick={handleResetConfiguration}
                  disabled={isLoading}
                >
                  Reset Config
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-8">
          {/* Summary Card */}
          <Card variant="featured" className="bg-sage-soft/50 dark:bg-sage/10 border-sage/20 sticky top-8">
            <div className="flex items-center gap-2 mb-6 text-sage">
              <span className="material-symbols-outlined">analytics</span>
              <span className="text-xs font-bold uppercase tracking-widest">Session Preview</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline border-b border-sage/10 pb-3">
                <span className="text-sm text-text-main/60 dark:text-sand/60">Questions</span>
                <span className="text-2xl font-bold font-slab text-text-main dark:text-white">{drillConfig.questionCount}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-sage/10 pb-3">
                <span className="text-sm text-text-main/60 dark:text-sand/60">Skills</span>
                <span className="text-right font-medium text-text-main dark:text-white max-w-[200px] truncate">
                  {drillConfig.skills.length > 0 ? `${drillConfig.skills.length} Selected` : 'Mixed (All)'}
                </span>
              </div>
              <div className="flex justify-between items-baseline pb-3">
                <span className="text-sm text-text-main/60 dark:text-sand/60">Difficulty</span>
                <span className="text-right font-medium text-text-main dark:text-white">
                  {drillConfig.difficulties.join(', ')}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex gap-2">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                {errorMessage}
              </div>
            )}

            <Button
              size="lg"
              className="w-full text-lg shadow-soft-xl hover:scale-[1.02]"
              disabled={isLoading || drillConfig.difficulties.length === 0}
              onClick={startDrillSession}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin material-symbols-outlined text-base">refresh</span>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Launch Drill
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DrillBuilder
