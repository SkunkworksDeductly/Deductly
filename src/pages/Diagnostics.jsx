import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { useAuth } from '../contexts/AuthContext'

const Diagnostics = () => {
  const navigate = useNavigate()
  const { currentUser, getAuthHeaders } = useAuth()
  const {
    setDrillSession,
    setSelectedAnswers,
    setCurrentQuestionIndex,
    resetSession
  } = useDrill()
  const [isStarting, setIsStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    resetSession()
  }, [resetSession])

  const handleStartDiagnostic = async () => {
    try {
      setErrorMessage(null)
      setIsStarting(true)

      const headers = await getAuthHeaders()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

      const response = await fetch(`${apiBaseUrl}/personalization/diagnostic`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: currentUser?.uid || 'anonymous'
        })
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Unable to start diagnostic right now.')
      }

      const session = await response.json()
      setDrillSession({
        ...session,
        origin: 'diagnostic'
      })
      setSelectedAnswers({})
      setCurrentQuestionIndex(0)
      navigate('/diagnostics/session')
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong while starting the diagnostic.')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <section className="rounded-2xl border border-border-default bg-surface-primary p-8 shadow-md">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">LSAT Diagnostic</h1>
          <p className="text-text-secondary text-lg mb-6">
            Kick off your prep with a focused 5-question diagnostic that mirrors the LSAT's logical reasoning workload.
            You'll get a clear read on your baseline and the skills to sharpen next.
          </p>
          <div className="grid gap-4 md:grid-cols-3 text-sm text-text-secondary">
            <div className="rounded-xl border border-border-default bg-accent-info-bg p-4">
              <p className="text-text-primary font-semibold mb-2">Why take it</p>
              <p>Surface strengths and blind spots so your study plan targets the right mix of skills.</p>
            </div>
            <div className="rounded-xl border border-border-default bg-accent-info-bg p-4">
              <p className="text-text-primary font-semibold mb-2">What to expect</p>
              <p>5 official-style LSAT questions spanning core reasoning skills, delivered one at a time.</p>
            </div>
            <div className="rounded-xl border border-border-default bg-accent-info-bg p-4">
              <p className="text-text-primary font-semibold mb-2">How it works</p>
              <p>Navigate forward and back between questions and review performance the moment you finish.</p>
            </div>
          </div>
          {errorMessage && (
            <div className="mt-6 rounded-lg bg-status-error-bg border border-status-error-border px-4 py-3 text-sm text-status-error-text">
              {errorMessage}
            </div>
          )}
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-button-primary px-6 py-3 font-semibold text-white transition hover:bg-button-primary-hover disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
            onClick={handleStartDiagnostic}
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'Start Diagnostic'}
          </button>
        </section>

        <section className="rounded-2xl border border-border-default bg-status-info-bg p-6 text-text-secondary shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-3">PACE TIP</h2>
          <p className="text-sm">
            Plan for about 10 minutes end-to-end. You can pause between questions, but
            giving yourself steady pressure will make the insights more actionable.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Diagnostics
