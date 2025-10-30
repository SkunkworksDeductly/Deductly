import React from 'react'
import { Link } from 'react-router-dom'

export default function MarketingLanding() {
  const features = [
    {
      title: "Diagnostic Assessments",
      description: "Identify your strengths and weaknesses with comprehensive LSAT diagnostic tests that pinpoint exactly where you need to improve.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Personalized Study Plans",
      description: "Get a customized study roadmap based on your diagnostic results. Focus your time on what matters most for your target score.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Targeted Practice Drills",
      description: "Master specific question types with focused practice sessions. Track your progress and watch your accuracy improve over time.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Video Curriculum",
      description: "Learn LSAT concepts from expert instructors with our comprehensive video library covering all question types and strategies.",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      )
    }
  ]

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Basic diagnostic assessment",
        "5 practice drills per month",
        "Study plan access",
        "Progress tracking",
        "Community support"
      ],
      cta: "Get Started Free",
      highlight: false
    },
    {
      name: "Premium",
      price: "$20",
      period: "per month",
      description: "Everything you need to succeed",
      features: [
        "Unlimited practice drills",
        "Full video curriculum",
        "Advanced analytics & insights",
        "Personalized recommendations",
        "Priority email support",
        "Downloadable study materials"
      ],
      cta: "Start Premium Trial",
      highlight: true
    },
    {
      name: "Premium Annual",
      price: "$199",
      period: "per year",
      savings: "Save $41",
      description: "Best value for serious students",
      features: [
        "All Premium features",
        "2 months free",
        "Priority support",
        "Early access to new content",
        "1-on-1 strategy session",
        "Score improvement guarantee"
      ],
      cta: "Go Annual",
      highlight: false
    }
  ]

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Navigation */}
      <nav className="bg-surface-primary border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-text-primary">Deductly</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-text-secondary hover:text-text-primary font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-button-primary hover:bg-button-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-warning-bg via-surface-primary to-accent-info-bg opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary mb-6 tracking-tight">
              Master the LSAT with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gradient-from to-gradient-to">
                Personalized Preparation
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Adaptive diagnostics, targeted practice, and expert instruction designed to help you achieve your dream LSAT score.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="bg-button-primary hover:bg-button-primary-hover text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg"
              >
                Start Free Today
              </Link>
              <a
                href="#features"
                className="bg-button-secondary hover:bg-button-secondary-hover text-text-primary px-8 py-4 rounded-lg text-lg font-bold transition-colors border-2 border-border-default"
              >
                Learn More
              </a>
            </div>
            <p className="mt-6 text-text-tertiary text-sm">
              No credit card required • Start practicing immediately
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Our comprehensive platform combines proven study methods with cutting-edge technology to maximize your LSAT score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-surface-secondary rounded-xl p-8 border border-border-default hover:border-border-active transition-all hover:shadow-lg"
              >
                <div className="text-button-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Choose Your Path to Success
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Start free and upgrade anytime. All plans include our core features to help you succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-xl p-8 border-2 transition-all ${
                  tier.highlight
                    ? 'border-button-primary bg-surface-primary shadow-2xl scale-105 relative'
                    : 'border-border-default bg-surface-primary hover:border-border-active hover:shadow-lg'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-button-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-4xl font-extrabold text-text-primary">
                      {tier.price}
                    </span>
                    <span className="text-text-secondary ml-2">{tier.period}</span>
                  </div>
                  {tier.savings && (
                    <div className="inline-block bg-status-success-bg text-status-success-text px-3 py-1 rounded-full text-sm font-medium">
                      {tier.savings}
                    </div>
                  )}
                  <p className="text-text-secondary text-sm mt-2">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-text-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
                    tier.highlight
                      ? 'bg-button-primary hover:bg-button-primary-hover text-white'
                      : 'bg-button-secondary hover:bg-button-secondary-hover text-text-primary border-2 border-border-default'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="py-20 bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-button-primary mb-2">
                10,000+
              </div>
              <div className="text-text-secondary text-lg">Practice Questions</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-button-primary mb-2">
                15+
              </div>
              <div className="text-text-secondary text-lg">Average Score Increase</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-button-primary mb-2">
                95%
              </div>
              <div className="text-text-secondary text-lg">Student Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-warning-bg to-accent-info-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
            Ready to Achieve Your Target Score?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join thousands of students who have transformed their LSAT preparation with Deductly.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-button-primary hover:bg-button-primary-hover text-white px-10 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg"
          >
            Start Your Free Account
          </Link>
          <p className="mt-4 text-text-tertiary text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-text-link hover:text-text-link-hover font-medium">
              Log in here
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-primary border-t border-border-default py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-text-primary mb-4">Deductly</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The most comprehensive LSAT preparation platform, designed to help you achieve your dream law school score through personalized, adaptive learning.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/signup" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@deductly.com" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-default mt-8 pt-8 text-center">
            <p className="text-text-tertiary text-sm">
              © 2025 Deductly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
