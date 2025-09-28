import React from 'react'
import { Link } from 'react-router-dom'

const Landing = () => {
  const features = [
    {
      title: 'Smart Diagnostics',
      description: 'Assess your knowledge with our intelligent diagnostic tests to identify your strengths and areas for improvement.',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/diagnostics'
    },
    {
      title: 'Personalized Study Plans',
      description: 'Get customized learning paths tailored to your individual needs and learning pace.',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      link: '/study-plan'
    },
    {
      title: 'Interactive Drills',
      description: 'Practice with targeted exercises and drills to reinforce your learning and build confidence.',
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      link: '/drill'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Welcome to</span>
            <span className="block text-blue-600">Deductly</span>
          </h1>
          <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your intelligent education companion. Assess, learn, and master new concepts with personalized study plans and interactive practice sessions.
          </p>
          <div className="max-w-md mx-auto mt-5 sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/diagnostics"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform combines assessment, planning, and practice to optimize your learning journey.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition duration-300">
                  <div className="flex items-center justify-center w-16 h-16 bg-white rounded-lg shadow-sm mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900 text-center">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-gray-600 text-center">
                    {feature.description}
                  </p>
                  <div className="mt-6 text-center">
                    <Link
                      to={feature.link}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition duration-300"
                    >
                      Learn More
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start learning?</span>
            <span className="block text-blue-200">Begin your assessment today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/diagnostics"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition duration-300"
              >
                Start Diagnostic
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing