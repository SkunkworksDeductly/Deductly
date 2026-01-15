import React from 'react'
import { useTimer } from '../hooks/useTimer'

/**
 * DrillTimer component displays countdown or elapsed time for drill sessions
 *
 * For timed drills: shows countdown with color warnings
 * For untimed drills: shows elapsed time counting up
 *
 * @param {Object} props
 * @param {number|null} props.timeLimitSeconds - Time limit in seconds, null for untimed
 * @param {string|null} props.startedAt - ISO timestamp when drill started
 * @param {function} props.onTimeExpired - Callback when countdown reaches zero
 */
const DrillTimer = ({ timeLimitSeconds, startedAt, onTimeExpired }) => {
  const {
    formattedTime,
    isTimed,
    warningLevel,
    hasExpired
  } = useTimer({
    timeLimitSeconds,
    startedAt,
    onTimeExpired
  })

  // Determine text color based on warning level
  const getColorClass = () => {
    if (!isTimed) return 'text-text-secondary'

    switch (warningLevel) {
      case 'critical':
        return 'text-danger'
      case 'warning':
        return 'text-warning'
      default:
        return 'text-text-primary'
    }
  }

  // Determine background color
  const getBgClass = () => {
    if (!isTimed) return 'bg-bg-tertiary border-border'

    switch (warningLevel) {
      case 'critical':
        return 'bg-danger/10 border-danger/30'
      case 'warning':
        return 'bg-warning/10 border-warning/30'
      default:
        return 'bg-bg-tertiary border-border'
    }
  }

  // Animation class for critical state
  const getAnimationClass = () => {
    if (isTimed && warningLevel === 'critical' && !hasExpired) {
      return 'animate-pulse'
    }
    return ''
  }

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg border
        transition-all duration-300
        ${getBgClass()}
        ${getAnimationClass()}
      `}
    >
      {/* Clock icon */}
      <svg
        className={`w-4 h-4 ${getColorClass()}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Time display */}
      <span className={`font-mono text-sm font-medium ${getColorClass()}`}>
        {formattedTime}
      </span>

      {/* Label */}
      <span className="text-xs text-text-tertiary">
        {isTimed ? (hasExpired ? "Time's up!" : 'remaining') : 'elapsed'}
      </span>
    </div>
  )
}

export default DrillTimer
