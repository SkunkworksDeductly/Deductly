import React, { useState, useEffect } from 'react'

const Diagnostics = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  const fetchDiagnostics = async () => {
    try {
      setIsLoading(true)
      // For now, using mock data - will connect to backend later
      const mockQuestions = [
        {
          id: 1,
          subject: 'Mathematics',
          topic: 'Algebra',
          question: 'Solve for x: 2x + 5 = 13',
          options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
          correct_answer: 'x = 4'
        },
        {
          id: 2,
          subject: 'Science',
          topic: 'Physics',
          question: 'What is the speed of light in vacuum?',
          options: ['299,792,458 m/s', '300,000,000 m/s', '299,000,000 m/s', '298,000,000 m/s'],
          correct_answer: '299,792,458 m/s'
        },
        {
          id: 3,
          subject: 'Mathematics',
          topic: 'Geometry',
          question: 'What is the area of a circle with radius 5?',
          options: ['25π', '10π', '15π', '20π'],
          correct_answer: '25π'
        }
      ]

      setTimeout(() => {
        setQuestions(mockQuestions)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching diagnostics:', error)
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
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResults()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateResults = () => {
    let correctCount = 0
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctCount++
      }
    })
    setScore(Math.round((correctCount / questions.length) * 100))
    setShowResults(true)
  }

  const resetDiagnostic = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setShowResults(false)
    setScore(0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading diagnostic questions...</p>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white ${
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {score}%
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Diagnostic Complete!</h2>

            <p className="text-lg text-gray-600 mb-6">
              You scored {score}% on your diagnostic assessment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Total Questions</h3>
                <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Correct Answers</h3>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((score / 100) * questions.length)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900">Performance</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={resetDiagnostic}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 mr-4"
              >
                Retake Diagnostic
              </button>
              <button
                onClick={() => window.location.href = '/study-plan'}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300"
              >
                View Study Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Diagnostic Assessment</h1>
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
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
            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {currentQ?.subject} - {currentQ?.topic}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQ?.question}
          </h2>

          <div className="space-y-3">
            {currentQ?.options?.map((option, index) => (
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
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics