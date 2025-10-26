import { useCallback } from 'react'
import { useDrill } from '../contexts/DrillContext'

/**
 * Custom hook for managing text highlights across drill questions
 *
 * Highlights are stored per question in the format:
 * {
 *   question_id_1: [[start1, end1], [start2, end2], ...],
 *   question_id_2: [[start1, end1], ...],
 *   ...
 * }
 *
 * @returns {Object} Highlight management functions and state
 */
export const useHighlights = () => {
  const { drillSession, setDrillSession } = useDrill()

  const userHighlights = drillSession?.user_highlights || {}

  /**
   * Get highlights for a specific question
   */
  const getQuestionHighlights = useCallback((questionId) => {
    if (!questionId) return []
    return userHighlights[questionId] || []
  }, [userHighlights])

  /**
   * Update highlights for a specific question
   */
  const setQuestionHighlights = useCallback((questionId, highlights) => {
    if (!questionId) return

    setDrillSession(prev => {
      if (!prev) return prev

      const updatedHighlights = {
        ...prev.user_highlights,
        [questionId]: highlights
      }

      // Remove empty highlight arrays to keep data clean
      if (highlights.length === 0) {
        delete updatedHighlights[questionId]
      }

      return {
        ...prev,
        user_highlights: updatedHighlights
      }
    })
  }, [setDrillSession])

  /**
   * Add a highlight range to a question (merges with existing)
   */
  const addHighlight = useCallback((questionId, range) => {
    if (!questionId || !range) return

    const existingHighlights = getQuestionHighlights(questionId)
    const newHighlights = [...existingHighlights, range]

    // Sort and merge overlapping ranges
    newHighlights.sort((a, b) => a[0] - b[0])

    const merged = []
    let current = newHighlights[0]

    for (let i = 1; i < newHighlights.length; i++) {
      const next = newHighlights[i]

      if (next[0] <= current[1]) {
        current = [current[0], Math.max(current[1], next[1])]
      } else {
        merged.push(current)
        current = next
      }
    }
    merged.push(current)

    setQuestionHighlights(questionId, merged)
  }, [getQuestionHighlights, setQuestionHighlights])

  /**
   * Remove a specific highlight range from a question
   */
  const removeHighlight = useCallback((questionId, range) => {
    if (!questionId || !range) return

    const existingHighlights = getQuestionHighlights(questionId)
    const filtered = existingHighlights.filter(
      ([start, end]) => !(start === range[0] && end === range[1])
    )

    setQuestionHighlights(questionId, filtered)
  }, [getQuestionHighlights, setQuestionHighlights])

  /**
   * Clear all highlights for a specific question
   */
  const clearQuestionHighlights = useCallback((questionId) => {
    if (!questionId) return
    setQuestionHighlights(questionId, [])
  }, [setQuestionHighlights])

  /**
   * Clear all highlights for the entire drill
   */
  const clearAllHighlights = useCallback(() => {
    setDrillSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        user_highlights: {}
      }
    })
  }, [setDrillSession])

  return {
    // State
    userHighlights,

    // Getters
    getQuestionHighlights,

    // Setters
    setQuestionHighlights,
    addHighlight,
    removeHighlight,
    clearQuestionHighlights,
    clearAllHighlights
  }
}
