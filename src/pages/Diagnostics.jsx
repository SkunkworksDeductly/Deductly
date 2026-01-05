import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrill } from '../contexts/DrillContext'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

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

      const response = await fetch('/api/personalization/diagnostic', {
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
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Main Card */}
        <Card variant="elevated" className="p-10 md:p-12">
          <h1 className="font-display text-4xl md:text-5xl text-primary mb-6 tracking-tight">
            LSAT Diagnostic
          </h1>
          <p className="text-secondary text-lg mb-8 leading-relaxed">
            Kick off your prep with a focused 5-question diagnostic that mirrors the LSAT's logical reasoning workload.
            You'll get a clear read on your baseline and the skills to sharpen next.
          </p>

          {/* Info Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-6">
              <p className="text-brand-primary font-semibold mb-3 text-sm uppercase tracking-wider">Why take it</p>
              <p className="text-secondary text-sm leading-relaxed">
                Surface strengths and blind spots so your study plan targets the right mix of skills.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-6">
              <p className="text-brand-primary font-semibold mb-3 text-sm uppercase tracking-wider">What to expect</p>
              <p className="text-secondary text-sm leading-relaxed">
                5 official-style LSAT questions spanning core reasoning skills, delivered one at a time.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-6">
              <p className="text-brand-primary font-semibold mb-3 text-sm uppercase tracking-wider">How it works</p>
              <p className="text-secondary text-sm leading-relaxed">
                Navigate forward and back between questions and review performance the moment you finish.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-8 rounded-2xl bg-danger/15 border border-danger/30 px-6 py-4">
              <p className="text-danger text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStartDiagnostic}
            disabled={isStarting}
            size="lg"
            className="w-full md:w-auto"
          >
            {isStarting ? 'Starting...' : 'Start Diagnostic'}
          </Button>
        </Card>

        {/* Tip Card */}
        <Card className="bg-brand-primary/5 border-brand-primary/15">
          <div className="flex items-start gap-4">
            <div className="bg-brand-primary/20 rounded-full p-3 flex-shrink-0">
              <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-xl text-primary mb-2 tracking-tight">PACE TIP</h2>
              <p className="text-secondary text-sm leading-relaxed">
                Plan for about 10 minutes end-to-end. You can pause between questions, but
                giving yourself steady pressure will make the insights more actionable.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Diagnostics
