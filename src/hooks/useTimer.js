import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for managing drill timer (countdown or elapsed time)
 *
 * For timed drills: counts down from time_limit_seconds
 * For untimed drills: counts up from 0 (elapsed time)
 *
 * @param {Object} options
 * @param {number|null} options.timeLimitSeconds - Total time limit in seconds, null for untimed
 * @param {string|null} options.startedAt - ISO timestamp when drill started
 * @param {function} options.onTimeExpired - Callback when time runs out
 * @returns {Object} Timer state and controls
 */
export const useTimer = ({ timeLimitSeconds, startedAt, onTimeExpired }) => {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasExpired, setHasExpired] = useState(false)
  const intervalRef = useRef(null)
  const onTimeExpiredRef = useRef(onTimeExpired)
  const hasTriggeredExpiredRef = useRef(false)

  // Keep callback ref updated
  useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired
  }, [onTimeExpired])

  // Determine if this is a timed drill
  const isTimed = timeLimitSeconds !== null && timeLimitSeconds !== undefined && timeLimitSeconds > 0

  // Calculate initial time based on started_at
  const calculateInitialTime = useCallback(() => {
    if (!startedAt) {
      // Drill hasn't started yet - return full time for timed, 0 for untimed
      return isTimed ? timeLimitSeconds : 0
    }

    const startTime = new Date(startedAt).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - startTime) / 1000)

    if (isTimed) {
      const remaining = timeLimitSeconds - elapsedSeconds
      return Math.max(0, remaining)
    } else {
      return elapsedSeconds
    }
  }, [startedAt, timeLimitSeconds, isTimed])

  // Initialize timer when startedAt changes
  useEffect(() => {
    const initialTime = calculateInitialTime()
    setSeconds(initialTime)
    hasTriggeredExpiredRef.current = false

    if (isTimed && initialTime <= 0) {
      setHasExpired(true)
      setIsRunning(false)
      // Trigger callback for already-expired drills
      if (!hasTriggeredExpiredRef.current) {
        hasTriggeredExpiredRef.current = true
        setTimeout(() => onTimeExpiredRef.current?.(), 0)
      }
    } else if (startedAt) {
      // Only start running if drill has been started
      setHasExpired(false)
      setIsRunning(true)
    }
  }, [calculateInitialTime, isTimed, startedAt])

  // Timer tick effect
  useEffect(() => {
    if (!isRunning || hasExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (isTimed) {
          // Countdown
          const newValue = prev - 1
          if (newValue <= 0) {
            setHasExpired(true)
            setIsRunning(false)
            // Trigger callback on next tick to avoid state update during render
            if (!hasTriggeredExpiredRef.current) {
              hasTriggeredExpiredRef.current = true
              setTimeout(() => onTimeExpiredRef.current?.(), 0)
            }
            return 0
          }
          return newValue
        } else {
          // Count up for untimed
          return prev + 1
        }
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, hasExpired, isTimed])

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  // Resume timer
  const resume = useCallback(() => {
    if (!hasExpired && startedAt) {
      setIsRunning(true)
    }
  }, [hasExpired, startedAt])

  // Format time as MM:SS or HH:MM:SS for longer times
  const formatTime = useCallback((totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Determine warning state for timed drills
  const getWarningLevel = useCallback(() => {
    if (!isTimed) return 'normal'
    if (seconds <= 60) return 'critical' // 1 minute or less
    if (seconds <= 120) return 'warning' // 2 minutes or less
    return 'normal'
  }, [isTimed, seconds])

  return {
    // State
    seconds,
    isRunning,
    hasExpired,
    isTimed,

    // Derived values
    formattedTime: formatTime(seconds),
    warningLevel: getWarningLevel(),

    // Controls
    pause,
    resume
  }
}
