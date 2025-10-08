import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  DRILL_QUESTION_COUNTS
} from '../config/skillBuilder'

const DrillContext = createContext()

const createDefaultConfig = () => ({
  questionCount: DRILL_QUESTION_COUNTS[0],
  difficulties: ['Medium'],
  skills: [],
  timePercentage: 100
})

export const useDrill = () => useContext(DrillContext)

export function DrillProvider({ children }) {
  const [drillConfig, setDrillConfig] = useState(createDefaultConfig)
  const [drillSession, setDrillSession] = useState(null)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const resetSession = useCallback(() => {
    setDrillSession(null)
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
