import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  DRILL_QUESTION_COUNTS
} from '../config/skillBuilder'

const DrillContext = createContext()

const createDefaultConfig = () => ({
  questionCount: DRILL_QUESTION_COUNTS[0],
  difficulties: ['Medium'],
  skills: [],
  timePercentage: 100,
  allowRepeatedQuestions: false  // Default: exclude previously seen questions
})

export const useDrill = () => useContext(DrillContext)

export function DrillProvider({ children }) {
  const [drillConfig, setDrillConfig] = useState(createDefaultConfig)
  const [drillSession, setDrillSessionInternal] = useState(null)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Wrap setDrillSession to ensure user_highlights is always present
  const setDrillSession = useCallback((sessionOrUpdater) => {
    setDrillSessionInternal(prev => {
      const newSession = typeof sessionOrUpdater === 'function'
        ? sessionOrUpdater(prev)
        : sessionOrUpdater

      // Ensure user_highlights exists
      if (newSession && !newSession.user_highlights) {
        return { ...newSession, user_highlights: {} }
      }

      return newSession
    })
  }, [])

  const resetSession = useCallback(() => {
    setDrillSessionInternal(null)
    setSelectedAnswers({})
    setCurrentQuestionIndex(0)
  }, [])

  const resetAll = useCallback(() => {
    setDrillConfig(createDefaultConfig())
    resetSession()
  }, [resetSession])

  return (
    <DrillContext.Provider
      value={{
        drillConfig,
        setDrillConfig,
        drillSession,
        setDrillSession,
        selectedAnswers,
        setSelectedAnswers,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        resetSession,
        resetAll,
        createDefaultConfig
      }}
    >
      {children}
    </DrillContext.Provider>
  )
}
