import React, { useEffect, useRef, useState } from 'react'

export const SingleSelectDropdown = ({
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
        className="w-full rounded-lg px-3 py-2 text-left text-text-primary flex items-center justify-between bg-white border border-border-light hover:bg-surface-hover transition"
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
                      : 'text-text-primary hover:bg-surface-hover'
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

export const MultiSelectDropdown = ({
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

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option))
    } else {
      onChange([...selected, option])
    }
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
        className="w-full rounded-lg px-3 py-2 text-left text-text-primary flex items-center justify-between bg-white border border-border-light hover:bg-surface-hover transition"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="truncate text-sm">{summary}</span>
        <span className="ml-3 text-text-secondary text-xs">v</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-full rounded-xl bg-white border border-border-light shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border-light py-2 px-3 flex gap-2">
              <button
                type="button"
                className={`text-xs font-semibold text-primary hover:text-primary/80 transition ${showClear ? 'flex-1 text-left' : 'w-full text-left'}`}
                onClick={() => onChange(options)}
              >
                Select All
              </button>
              {showClear && (
                <button
                  type="button"
                  className="flex-1 text-xs font-semibold text-primary hover:text-primary/80 transition text-right"
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
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition ${
                      isActive
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-text-primary hover:bg-surface-hover'
                    }`}
                    onClick={() => toggleOption(option)}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
                    />
                    <span>{option}</span>
                  </button>
                )
              })}
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-text-secondary">No options</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
