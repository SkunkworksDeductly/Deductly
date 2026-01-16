import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import api from '../services/api'

const Diagnostics = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user has already completed a diagnostic
  useEffect(() => {
    const checkDiagnosticStatus = async () => {
      if (!currentUser?.uid) {
        setIsLoading(false)
        return
      }

      try {
        const status = await api.getDiagnosticStatus(currentUser.uid)

        if (status.status === 'completed') {
          // User has completed diagnostic - redirect to summary
          navigate('/diagnostics/summary', {
            state: {
              sessionId: status.session_id,
              summary: {
                totalQuestions: status.summary.total_questions,
                correctAnswers: status.summary.correct_answers,
                score: status.summary.score_percentage,
              },
            },
            replace: true,
          })
        }
      } catch (error) {
        console.error('Error checking diagnostic status:', error)
        // On error, just show the page normally
      } finally {
        setIsLoading(false)
      }
    }

    checkDiagnosticStatus()
  }, [currentUser, navigate])

  const handleStartDiagnostic = async () => {
    try {
      setErrorMessage(null)
      setIsStarting(true)

      // Start adaptive diagnostic session
      const session = await api.startAdaptiveDiagnostic(currentUser?.uid)

      // Navigate to adaptive session page with session data
      navigate('/diagnostics/adaptive', {
        state: {
          sessionId: session.session_id,
          question: session.question,
          progress: session.progress,
          resumed: session.resumed || false,
        }
      })
    } catch (error) {
      console.error('Error starting diagnostic:', error)
      setErrorMessage(error.message || 'Something went wrong while starting the diagnostic.')
    } finally {
      setIsStarting(false)
    }
  }

  // Show loading state while checking diagnostic status
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="size-12 border-4 border-sand-dark/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-main/60 dark:text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-sand-dark/30 dark:border-white/5 pb-8">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-widest text-terracotta font-sans">Assessment</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-main dark:text-white leading-[0.9]">
            Diagnostic Center<br />
            <span className="text-text-main/40 dark:text-white/40 font-medium tracking-tight">Establish Your Baseline.</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-7 space-y-8">
          <Card variant="flat" className="bg-white dark:bg-white/5 p-8 md:p-12 border border-sand-dark/30 dark:border-white/10">
            <h2 className="text-3xl font-bold font-slab text-text-main dark:text-white mb-6">Logical Reasoning Assessment</h2>
            <p className="text-lg text-text-main/70 dark:text-sand/70 mb-10 leading-relaxed max-w-2xl">
              Take our adaptive 30-question diagnostic to generate your initial skill profile.
              The engine adjusts difficulty in real-time to pinpoint your exact ability level across all LSAT reasoning types.
            </p>

            <div className="grid gap-6 md:grid-cols-3 mb-10">
              <div className="p-4 rounded-2xl bg-sand/20 dark:bg-white/5 border border-sand-dark/20 space-y-2">
                <span className="material-symbols-outlined text-sage text-2xl">auto_graph</span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-main dark:text-white">Adaptive</h3>
                  <p className="text-xs text-text-main/60 dark:text-white/60 mt-1">Adjusts to your skill level live.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-sand/20 dark:bg-white/5 border border-sand-dark/20 space-y-2">
                <span className="material-symbols-outlined text-terracotta text-2xl">psychology</span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-main dark:text-white">Comprehensive</h3>
                  <p className="text-xs text-text-main/60 dark:text-white/60 mt-1">Covers all major logical patterns.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-sand/20 dark:bg-white/5 border border-sand-dark/20 space-y-2">
                <span className="material-symbols-outlined text-text-main/60 dark:text-white/60 text-2xl">timer_off</span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-main dark:text-white">Untimed</h3>
                  <p className="text-xs text-text-main/60 dark:text-white/60 mt-1">Focus on accuracy, not speed.</p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800/30 flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartDiagnostic}
                disabled={isStarting}
                className="bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {isStarting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initializing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Start Diagnostic <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </span>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card variant="default" className="p-8 bg-sand/30 dark:bg-white/5 border-none">
            <div className="flex items-start gap-4">
              <div className="bg-white dark:bg-white/10 p-3 rounded-full shadow-sm">
                <span className="material-symbols-outlined text-terracotta">lightbulb</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-text-main dark:text-white">Before You Begin</h3>
                <ul className="space-y-3 text-sm text-text-main/70 dark:text-white/70">
                  <li className="flex gap-3">
                    <span className="size-1.5 rounded-full bg-sand-dark mt-2 shrink-0" />
                    Set aside 45-60 minutes.
                  </li>
                  <li className="flex gap-3">
                    <span className="size-1.5 rounded-full bg-sand-dark mt-2 shrink-0" />
                    Find a quiet environment.
                  </li>
                  <li className="flex gap-3">
                    <span className="size-1.5 rounded-full bg-sand-dark mt-2 shrink-0" />
                    You can pause, but continuous is best.
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics
