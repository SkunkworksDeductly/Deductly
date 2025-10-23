import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PublicLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dashboardVisible, setDashboardVisible] = useState(false)

  useEffect(() => {
    // Trigger animations when component mounts
    const timer = setTimeout(() => setDashboardVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 75%;
          }
        }

        @keyframes drawLine {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out forwards;
        }

        .animate-progress {
          animation: progressBar 1.5s ease-out forwards;
        }

        .animate-draw-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 2s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }
      `}</style>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-button-primary to-button-primary-hover rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-text-primary">Deductly</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                About
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-button-primary hover:bg-button-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border-default">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                  Features
                </a>
                <a href="#testimonials" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                  Testimonials
                </a>
                <a href="#pricing" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                  Pricing
                </a>
                <a href="#about" className="text-sm text-text-secondary hover:text-button-primary transition-colors">
                  About
                </a>
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    className="text-sm text-center text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-button-primary hover:bg-button-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50 -z-10" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center space-y-8 mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 rounded-full shadow-sm">
              <svg className="w-4 h-4 text-button-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-text-primary">Affordable, personalized LSAT prep</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto text-text-primary">
                Ace the LSAT without the price tag
              </h1>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Elite LSAT prep that adapts to you. Get the personalized coaching of a premium course at a fraction of the cost.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="bg-button-primary hover:bg-button-primary-hover text-white px-8 py-3 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
              >
                Start Learning Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button className="border-2 border-button-primary text-button-primary hover:bg-pink-50 px-8 py-3 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 border-2 border-white shadow-sm" />
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white shadow-sm" />
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 border-2 border-white shadow-sm" />
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 border-2 border-white shadow-sm" />
                </div>
                <span className="text-sm font-medium text-text-secondary">6,000+ students studying</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-text-secondary">Average 12-point score improvement</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview - Condensed & Animated */}
          <div
            className="relative max-w-5xl mx-auto transition-all duration-700 ease-out"
            style={{
              opacity: dashboardVisible ? 1 : 0,
              transform: dashboardVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)'
            }}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white transform hover:scale-[1.02] transition-transform duration-300">
              {/* Condensed Dashboard Header */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Welcome back, Samantha!</h3>
                    <p className="text-text-secondary text-xs mt-0.5">Keep up the great work!</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold shadow-md text-sm">
                    S
                  </div>
                </div>
              </div>

              {/* Condensed Dashboard Content */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Score Card */}
                  <div
                    className="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-600 ease-out"
                    style={{
                      opacity: dashboardVisible ? 1 : 0,
                      transform: dashboardVisible ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: '200ms'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-button-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+13</span>
                    </div>
                    <div className="text-3xl font-bold text-text-primary mb-0.5">168</div>
                    <div className="text-xs text-text-secondary">Current Score</div>
                  </div>

                  {/* Progress Card */}
                  <div
                    className="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-600 ease-out"
                    style={{
                      opacity: dashboardVisible ? 1 : 0,
                      transform: dashboardVisible ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: '300ms'
                    }}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-text-primary mb-0.5">75%</div>
                    <div className="text-xs text-text-secondary mb-2">Progress</div>
                    <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-button-primary to-brand-primary h-1.5 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: dashboardVisible ? '75%' : '0%',
                          transitionDelay: '500ms'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Streak Card */}
                  <div
                    className="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-600 ease-out"
                    style={{
                      opacity: dashboardVisible ? 1 : 0,
                      transform: dashboardVisible ? 'translateY(0)' : 'translateY(20px)',
                      transitionDelay: '400ms'
                    }}
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-text-primary mb-0.5">7</div>
                    <div className="text-xs text-text-secondary">Day Streak</div>
                  </div>
                </div>

                {/* Score Improvement Chart - Condensed */}
                <div
                  className="bg-white border border-gray-200 rounded-lg p-5 transition-all duration-600 ease-out"
                  style={{
                    opacity: dashboardVisible ? 1 : 0,
                    transform: dashboardVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: '500ms'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-semibold text-text-primary">Score Improvement</h4>
                      <p className="text-xs text-text-secondary mt-0.5">12 weeks of progress</p>
                    </div>
                    <div className="text-xs text-text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-button-primary rounded-full"></span>
                      <span>Score</span>
                    </div>
                  </div>

                  {/* Condensed Chart */}
                  <div className="relative h-48">
                    <svg viewBox="0 0 800 180" className="w-full h-full">
                      {/* Grid lines */}
                      <line x1="60" y1="150" x2="760" y2="150" stroke="#E5E7EB" strokeWidth="1"/>
                      <line x1="60" y1="110" x2="760" y2="110" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3"/>
                      <line x1="60" y1="70" x2="760" y2="70" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3"/>
                      <line x1="60" y1="30" x2="760" y2="30" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3"/>

                      {/* Y-axis labels */}
                      <text x="50" y="155" fontSize="10" fill="#9CA3AF" textAnchor="end">150</text>
                      <text x="50" y="115" fontSize="10" fill="#9CA3AF" textAnchor="end">160</text>
                      <text x="50" y="75" fontSize="10" fill="#9CA3AF" textAnchor="end">165</text>
                      <text x="50" y="35" fontSize="10" fill="#9CA3AF" textAnchor="end">170</text>

                      {/* X-axis labels */}
                      <text x="90" y="170" fontSize="10" fill="#9CA3AF" textAnchor="middle">Wk 1</text>
                      <text x="270" y="170" fontSize="10" fill="#9CA3AF" textAnchor="middle">Wk 4</text>
                      <text x="450" y="170" fontSize="10" fill="#9CA3AF" textAnchor="middle">Wk 7</text>
                      <text x="630" y="170" fontSize="10" fill="#9CA3AF" textAnchor="middle">Wk 10</text>

                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#FCA5A5', stopOpacity: 0.3}} />
                          <stop offset="100%" style={{stopColor: '#FCA5A5', stopOpacity: 0}} />
                        </linearGradient>
                      </defs>

                      {/* Area under the line */}
                      <path
                        d="M 90,142 L 150,138 L 210,130 L 270,125 L 330,115 L 390,105 L 450,95 L 510,80 L 570,65 L 630,50 L 690,30 L 690,150 L 90,150 Z"
                        fill="url(#scoreGrad)"
                        className="animate-fade-in animation-delay-600"
                      />

                      {/* Line chart - showing improvement from 155 to 168 */}
                      <path
                        d="M 90,142 L 150,138 L 210,130 L 270,125 L 330,115 L 390,105 L 450,95 L 510,80 L 570,65 L 630,50 L 690,30"
                        stroke="#F87171"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={dashboardVisible ? 'animate-draw-line' : ''}
                        style={{opacity: dashboardVisible ? 1 : 0}}
                      />

                      {/* Data points */}
                      <g className="animate-fade-in animation-delay-800">
                        <circle cx="90" cy="142" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="150" cy="138" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="210" cy="130" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="270" cy="125" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="330" cy="115" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="390" cy="105" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="450" cy="95" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="510" cy="80" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="570" cy="65" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="630" cy="50" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>
                        <circle cx="690" cy="30" r="4" fill="#FCA5A5" stroke="white" strokeWidth="2"/>

                        {/* Highlight last point */}
                        <circle cx="690" cy="30" r="6" fill="#F87171" stroke="white" strokeWidth="2.5"/>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Bottom Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Recent Activity - Condensed */}
                  <div
                    className="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-600 ease-out"
                    style={{
                      opacity: dashboardVisible ? 1 : 0,
                      transform: dashboardVisible ? 'translateX(0)' : 'translateX(-20px)',
                      transitionDelay: '700ms'
                    }}
                  >
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-text-primary">Logical Reasoning Drill</p>
                          <p className="text-xs text-text-tertiary">18/20 • 2h ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-text-primary">Practice Test #5</p>
                          <p className="text-xs text-text-tertiary">168 • 2d ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Up - Condensed */}
                  <div
                    className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 transition-all duration-600 ease-out"
                    style={{
                      opacity: dashboardVisible ? 1 : 0,
                      transform: dashboardVisible ? 'translateX(0)' : 'translateX(20px)',
                      transitionDelay: '700ms'
                    }}
                  >
                    <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-button-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Next: Reading Comp
                    </h4>
                    <p className="text-xs text-text-secondary mb-3">Main ideas & tone</p>
                    <button className="w-full bg-button-primary hover:bg-button-primary-hover text-white font-semibold py-2 px-3 rounded-lg transition-colors text-xs">
                      Continue Lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-24 bg-white" id="about">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
              Master the LSAT Without Breaking the Bank
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              We're making elite LSAT prep accessible to everyone. Our platform delivers the personalized coaching experience you'd expect from a $2,000 course—at a fraction of the cost.
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 md:p-12 mb-12">
            <p className="text-lg text-center leading-relaxed mb-8 text-text-primary">
              Using advanced learning science and adaptive technology, we create a study plan that evolves with you. Every practice question, every lesson, and every recommendation is tailored to your unique strengths and areas for growth.
            </p>
            <div className="text-center">
              <p className="text-2xl md:text-3xl italic text-text-primary">
                World-class LSAT prep shouldn't be a luxury. It should be a <span className="text-button-primary font-semibold">launchpad</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-button-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-text-primary">Affordable Excellence</h3>
              <p className="text-text-secondary">Premium LSAT prep at a price that makes sense</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-text-primary">Personalized Learning</h3>
              <p className="text-text-secondary">Adaptive technology that evolves with your progress</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-text-primary">Proven Results</h3>
              <p className="text-text-secondary">Learning science backed by data and student success</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Everything you need to ace the LSAT
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Comprehensive tools designed to maximize your score
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Adaptive Practice */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Adaptive Practice</h3>
              <p className="text-text-secondary leading-relaxed">Questions that target your weak areas and reinforce your strengths.</p>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Analytics Dashboard</h3>
              <p className="text-text-secondary leading-relaxed">Track your progress across all LSAT sections with detailed metrics.</p>
            </div>

            {/* Expert Video Lessons */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Expert Video Lessons</h3>
              <p className="text-text-secondary leading-relaxed">Learn strategies from top scorers who mastered the LSAT.</p>
            </div>

            {/* Smart Study Plans */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Smart Study Plans</h3>
              <p className="text-text-secondary leading-relaxed">Personalized schedules that adapt to your pace and test date.</p>
            </div>

            {/* Flexible Scheduling */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Flexible Scheduling</h3>
              <p className="text-text-secondary leading-relaxed">Study on your time with plans that fit your lifestyle.</p>
            </div>

            {/* Score Prediction */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-text-primary">Score Prediction</h3>
              <p className="text-text-secondary leading-relaxed">See your projected LSAT score based on your performance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-gradient-to-br from-button-primary to-brand-primary text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Results that speak for themselves
            </h2>
            <p className="text-xl text-pink-100 max-w-2xl mx-auto">
              Join thousands of students who've improved their LSAT scores
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '5,000+', label: 'LSAT Students' },
              { value: '+12 pts', label: 'Average Score Increase' },
              { value: '10,000+', label: 'Practice Questions' },
              { value: '90%', label: 'Would Recommend' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-pink-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gray-50" id="testimonials">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Real students. Real score improvements.
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              See how Deductly helped these students reach their target scores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Scored 172 • UCLA Law',
                content: 'Deductly helped me jump from 158 to 172. The adaptive practice focused exactly on my weak spots without wasting time.',
                initials: 'SJ',
                gradient: 'from-pink-400 to-purple-400'
              },
              {
                name: 'Michael Chen',
                role: 'Scored 168 • NYU Law',
                content: 'I couldn\'t afford the $2k courses. Deductly gave me the same quality for less than $200. Best investment I made.',
                initials: 'MC',
                gradient: 'from-purple-400 to-blue-400'
              },
              {
                name: 'Emma Rodriguez',
                role: 'Scored 170 • Columbia Law',
                content: 'The analytics showed me exactly where to focus. Went from 162 to 170 in 3 months. Game changer.',
                initials: 'ER',
                gradient: 'from-blue-400 to-pink-400'
              }
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-text-secondary mb-8 leading-relaxed">{testimonial.content}</p>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{testimonial.name}</p>
                    <p className="text-sm text-text-secondary">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-gray-50" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Choose the plan that works best for your LSAT prep journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-2">Free</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold text-text-primary">$0</span>
                  <span className="text-text-secondary ml-2">/month</span>
                </div>
                <p className="text-sm text-text-secondary">Perfect for getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Access to 100 practice questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Basic progress tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">1 diagnostic test</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Community support</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-text-primary font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Monthly Tier - Featured */}
            <div className="bg-white border-2 border-button-primary rounded-2xl p-8 hover:shadow-xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-button-primary text-white text-xs font-semibold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-2">Monthly</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl font-bold text-text-primary">$20</span>
                  <span className="text-text-secondary ml-2">/month</span>
                </div>
                <p className="text-sm text-text-secondary">Full access, billed monthly</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary font-medium">Everything in Free, plus:</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Unlimited practice questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Personalized study plans</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">All video lessons</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Score predictions</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="block w-full text-center bg-button-primary hover:bg-button-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Annual Tier */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-2">Annual</h3>
                <div className="flex items-baseline mb-1">
                  <span className="text-5xl font-bold text-text-primary">$16</span>
                  <span className="text-text-secondary ml-2">/month</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-text-tertiary line-through">$240/year</span>
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">Save 20%</span>
                </div>
                <p className="text-sm text-text-secondary">$192 billed annually</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary font-medium">Everything in Monthly, plus:</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">20% discount ($48 savings)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">Early access to new features</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-text-primary">1-on-1 strategy session</span>
                </li>
              </ul>

              <Link
                to="/signup"
                className="block w-full text-center bg-brand-primary hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Additional info */}
          <div className="text-center mt-12">
            <p className="text-sm text-text-secondary">
              All plans include a 7-day free trial. Cancel anytime, no questions asked.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-button-primary via-pink-600 to-brand-primary p-12 md:p-16 text-white text-center">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to boost your LSAT score?
              </h2>
              <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
                Join thousands of students who've improved their scores with Deductly
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="bg-white text-button-primary hover:bg-gray-100 px-8 py-3 rounded-lg text-base font-semibold transition-colors inline-flex items-center gap-2"
                >
                  Get Started Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg text-base font-semibold transition-colors">
                  Book a Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-border-default">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            {/* Logo and description */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-button-primary to-button-primary-hover rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-text-primary">Deductly</span>
              </div>
              <p className="text-sm text-text-secondary">
                Empowering students to learn smarter and achieve their goals.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm text-text-primary">Product</h4>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Testimonials', 'FAQ'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-text-primary">Resources</h4>
              <ul className="space-y-3">
                {['Blog', 'Help Center', 'Video Tutorials', 'Community'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-text-primary">Company</h4>
              <ul className="space-y-3">
                {['About', 'Careers', 'Contact', 'Press Kit'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-text-primary">Legal</h4>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Security', 'Cookies'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border-default flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              © 2025 Deductly. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Twitter
              </a>
              <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
