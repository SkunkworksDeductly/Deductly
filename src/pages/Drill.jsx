import React, { useState, useEffect } from 'react'

const Drill = () => {
  const [drillSession, setDrillSession] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [sessionResults, setSessionResults] = useState(null)
  const [drillSettings, setDrillSettings] = useState({
    subject: 'Mathematics',
    difficulty: 'Medium',
    questionCount: 5
  })

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'General']
  const difficulties = ['Easy', 'Medium', 'Hard']
  const questionCounts = [5, 10, 15, 20]

  const startDrillSession = async () => {
    try {
      setIsLoading(true)

      // Mock drill questions - will connect to backend later
      const mockSession = {
        session_id: 'drill_' + Date.now(),
        subject: drillSettings.subject,
        difficulty: drillSettings.difficulty,
        questions: [
          {
            id: 1,
            question: `${drillSettings.subject} practice question 1 - ${drillSettings.difficulty} level`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: 'Option A',
            difficulty: drillSettings.difficulty,
            explanation: 'This is the correct answer because of fundamental principles.'
          },
          {
            id: 2,
            question: `${drillSettings.subject} practice question 2 - ${drillSettings.difficulty} level`,
            options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
            correct_answer: 'Choice 2',
            difficulty: drillSettings.difficulty,
            explanation: 'Choice 2 is correct due to the underlying concept being tested.'
          },
          {
            id: 3,
            question: `${drillSettings.subject} practice question 3 - ${drillSettings.difficulty} level`,
            options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
            correct_answer: 'Answer C',
            difficulty: drillSettings.difficulty,
            explanation: 'Answer C follows the correct methodology for this type of problem.'
          },
          {
            id: 4,
            question: `${drillSettings.subject} practice question 4 - ${drillSettings.difficulty} level`,
            options: ['Solution 1', 'Solution 2', 'Solution 3', 'Solution 4'],
            correct_answer: 'Solution 3',
            difficulty: drillSettings.difficulty,
            explanation: 'Solution 3 applies the correct formula and reasoning.'
          },
          {
            id: 5,
            question: `${drillSettings.subject} practice question 5 - ${drillSettings.difficulty} level`,
            options: ['Response A', 'Response B', 'Response C', 'Response D'],
            correct_answer: 'Response B',
            difficulty: drillSettings.difficulty,
            explanation: 'Response B demonstrates the proper understanding of the concept.'
          }
        ].slice(0, drillSettings.questionCount)
      }

      setTimeout(() => {
        setDrillSession(mockSession)
        setCurrentQuestion(0)
        setSelectedAnswers({})
        setShowResults(false)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error starting drill session:', error)
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answer
    })
  }

  const handleNext = () => {
    if (currentQuestion < drillSession.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      finishDrill()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const finishDrill = () => {
    let correct = 0
    const results = drillSession.questions.map((question, index) => {
      const isCorrect = selectedAnswers[index] === question.correct_answer
      if (isCorrect) correct++
      return {
        question: question.question,
        userAnswer: selectedAnswers[index] || 'No answer',
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation
      }
    })

    const score = Math.round((correct / drillSession.questions.length) * 100)

    setSessionResults({
      sessionId: drillSession.session_id,
      totalQuestions: drillSession.questions.length,
      correctAnswers: correct,
      score,
      results,
      feedback: score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good job!' : 'Keep practicing!'
    })
    setShowResults(true)
  }

  const resetDrill = () => {
    setDrillSession(null)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowResults(false)
    setSessionResults(null)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-300'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Hard': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your drill session...</p>
        </div>
      </div>
    )
  }

  if (showResults && sessionResults) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white ${
                sessionResults.score >= 80 ? 'bg-green-500' : sessionResults.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {sessionResults.score}%
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Drill Complete!</h2>
              <p className="text-lg text-gray-600">{sessionResults.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-blue-900">Total Questions</h3>
                <p className="text-2xl font-bold text-blue-600">{sessionResults.totalQuestions}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-green-900">Correct</h3>
                <p className="text-2xl font-bold text-green-600">{sessionResults.correctAnswers}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-purple-900">Score</h3>
                <p className="text-2xl font-bold text-purple-600">{sessionResults.score}%</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Answers</h3>
              <div className="space-y-4">
                {sessionResults.results.map((result, index) => (
                  <div key={index} className={`p-4 border-l-4 ${
                    result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}>
                    <p className="font-medium text-gray-900 mb-2">
                      Q{index + 1}: {result.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Your Answer: </span>
                        <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {result.userAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Correct Answer: </span>
                        <span className="text-green-700">{result.correctAnswer}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Explanation: </span>
                      {result.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={resetDrill}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                New Drill Session
              </button>
              <button
                onClick={() => window.location.href = '/study-plan'}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300"
              >
                Back to Study Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (drillSession) {
    const currentQ = drillSession.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / drillSession.questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Drill Practice - {drillSession.subject}
              </h1>
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {drillSession.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 text-sm rounded-full border ${getDifficultyColor(currentQ.difficulty)}`}>
                {currentQ.difficulty} Level
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <label key={index} className="block">
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswers[currentQuestion] === option}
                    onChange={() => handleAnswerSelect(option)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition duration-300 ${
                    selectedAnswers[currentQuestion] === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-lg transition duration-300 ${
                currentQuestion === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion]}
              className={`px-6 py-3 rounded-lg transition duration-300 ${
                !selectedAnswers[currentQuestion]
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentQuestion === drillSession.questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Practice Drills</h1>
          <p className="text-lg text-gray-600">
            Customize your practice session and test your knowledge with targeted exercises.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Drill Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={drillSettings.subject}
                onChange={(e) => setDrillSettings({...drillSettings, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={drillSettings.difficulty}
                onChange={(e) => setDrillSettings({...drillSettings, difficulty: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Questions</label>
              <select
                value={drillSettings.questionCount}
                onChange={(e) => setDrillSettings({...drillSettings, questionCount: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {questionCounts.map(count => (
                  <option key={count} value={count}>{count} Questions</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startDrillSession}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 text-lg font-medium"
            >
              Start Drill Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Drill