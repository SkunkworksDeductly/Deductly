import React, { useState, useEffect } from 'react'

const StudyPlan = () => {
  const [studyPlans, setStudyPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudyPlans()
  }, [])

  const fetchStudyPlans = async () => {
    try {
      setIsLoading(true)
      // Mock data - will connect to backend later
      const mockPlans = [
        {
          id: 1,
          subject: 'Mathematics',
          level: 'Beginner',
          topics: ['Basic Arithmetic', 'Simple Algebra', 'Geometry Basics'],
          duration: '4 weeks',
          progress: 25,
          description: 'Master fundamental mathematical concepts with step-by-step guidance.',
          estimatedHours: 20,
          difficulty: 'Easy'
        },
        {
          id: 2,
          subject: 'Science',
          level: 'Intermediate',
          topics: ['Physics Fundamentals', 'Chemistry Basics', 'Biology Introduction'],
          duration: '6 weeks',
          progress: 60,
          description: 'Explore the fascinating world of science across multiple disciplines.',
          estimatedHours: 35,
          difficulty: 'Medium'
        },
        {
          id: 3,
          subject: 'English',
          level: 'Advanced',
          topics: ['Advanced Grammar', 'Literature Analysis', 'Writing Techniques'],
          duration: '8 weeks',
          progress: 10,
          description: 'Enhance your English language skills and literary understanding.',
          estimatedHours: 40,
          difficulty: 'Hard'
        }
      ]

      setTimeout(() => {
        setStudyPlans(mockPlans)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching study plans:', error)
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-status-success-bg text-status-success-text'
      case 'Medium': return 'bg-status-warning-bg text-status-warning-text'
      case 'Hard': return 'bg-status-error-bg text-status-error-text'
      default: return 'bg-surface-tertiary text-text-secondary'
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-status-success'
    if (progress >= 50) return 'bg-status-warning'
    return 'bg-button-primary'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your study plans...</p>
        </div>
      </div>
    )
  }

  if (selectedPlan) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => setSelectedPlan(null)}
            className="mb-6 flex items-center text-text-secondary hover:text-text-primary transition duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Study Plans
          </button>

          <div className="bg-surface-primary rounded-xl p-8 border border-border-default shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-text-primary">{selectedPlan.subject}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(selectedPlan.difficulty)} border border-border-default`}>
                {selectedPlan.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-accent-info-bg p-4 rounded-lg border border-border-default">
                <h3 className="font-semibold text-text-secondary">Duration</h3>
                <p className="text-xl font-bold text-text-primary">{selectedPlan.duration}</p>
              </div>
              <div className="bg-accent-success-bg p-4 rounded-lg border border-border-default">
                <h3 className="font-semibold text-text-secondary">Progress</h3>
                <p className="text-xl font-bold text-status-success">{selectedPlan.progress}%</p>
              </div>
              <div className="bg-accent-warning-bg p-4 rounded-lg border border-border-default">
                <h3 className="font-semibold text-text-secondary">Est. Hours</h3>
                <p className="text-xl font-bold text-text-primary">{selectedPlan.estimatedHours}h</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Progress Overview</h3>
              <div className="w-full bg-border-light rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(selectedPlan.progress)}`}
                  style={{ width: `${selectedPlan.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-text-secondary mt-2">{selectedPlan.progress}% complete</p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-text-primary mb-4">Course Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPlan.topics.map((topic, index) => (
                  <div key={index} className="flex items-center p-4 border border-border-default rounded-lg bg-accent-info-bg">
                    <div className={`w-4 h-4 rounded-full mr-3 ${index < Math.floor(selectedPlan.topics.length * selectedPlan.progress / 100) ? 'bg-status-success' : 'bg-border-light'}`}></div>
                    <span className="text-text-primary">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4 flex-wrap gap-2">
              <button className="bg-button-primary text-white px-6 py-3 rounded-lg hover:bg-button-primary-hover transition duration-300">
                Continue Learning
              </button>
              <button className="bg-button-secondary border border-border-default text-text-primary px-6 py-3 rounded-lg hover:bg-surface-hover transition duration-300">
                Practice Drills
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-4">Your Study Plans</h1>
          <p className="text-lg text-text-secondary">
            Personalized learning paths designed to help you achieve your educational goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyPlans.map((plan) => (
            <div key={plan.id} className="bg-surface-primary rounded-xl overflow-hidden hover:bg-surface-hover transition duration-300 border border-border-default shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-text-primary">{plan.subject}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(plan.difficulty)} border border-border-default`}>
                    {plan.level}
                  </span>
                </div>

                <p className="text-text-secondary mb-4">{plan.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-text-secondary mb-1">
                    <span>Progress</span>
                    <span>{plan.progress}%</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(plan.progress)}`}
                      style={{ width: `${plan.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Duration:</span>
                    <span className="font-medium text-text-primary">{plan.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Topics:</span>
                    <span className="font-medium text-text-primary">{plan.topics.length} modules</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="w-full bg-button-primary text-white py-2 px-4 rounded-lg hover:bg-button-primary-hover transition duration-300"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {studyPlans.length === 0 && (
          <div className="text-center py-12 bg-surface-primary rounded-xl border border-border-default shadow-sm">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-text-primary mb-2">No Study Plans Available</h3>
            <p className="text-text-secondary mb-4">Complete a diagnostic assessment to get personalized study plans.</p>
            <button
              onClick={() => window.location.href = '/diagnostics'}
              className="bg-button-primary text-white px-6 py-3 rounded-lg hover:bg-button-primary-hover transition duration-300"
            >
              Take Diagnostic
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyPlan