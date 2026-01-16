import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

const Home = () => {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Kick off your LSAT prep with curated practice and guidance.',
      cta: 'Get Started',
      url: '/signup',
      features: [
        'Daily question warmups',
        'Baseline diagnostic quiz',
        'Progress dashboard snapshot',
        'Basic practice drills',
        'Community support'
      ]
    },
    {
      name: 'All-Access',
      price: '$20 / mo',
      highlight: 'Most Popular',
      description: 'Full platform access with personalized study tools.',
      cta: 'Get Started',
      url: '/signup',
      features: [
        'Full website access',
        'Personalized study roadmap',
        'Adaptive drill builder',
        'Full analytics suite',
        'Priority support'
      ]
    },
    {
      name: 'Premium',
      price: 'Custom',
      description: 'Personalized 1:1 tutoring tailored to your learning needs.',
      cta: 'Contact Us',
      url: '/signup',
      features: [
        '1:1 tutoring sessions',
        'Customized lesson plans',
        'Flexible scheduling',
        'Expert LSAT instructors',
        'Performance tracking'
      ]
    }
  ]

  return (
    <div className="flex flex-col gap-24 py-16 px-4">
      {/* Hero Section */}
      <section className="relative">
        <Card variant="featured" className="overflow-hidden p-12 md:p-16">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-sage/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl -z-10" />

          <div className="max-w-3xl relative z-10">
            <p className="text-xs uppercase tracking-[0.3em] text-muted mb-6">LSAT mastery, simplified</p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-primary leading-[1.1] mb-6 tracking-tight">
              Personalized prep that adapts to the way you learn.
            </h1>
            <p className="text-secondary text-lg md:text-xl mb-10 leading-relaxed max-w-2xl">
              Deductly brings your diagnostics, study plans, and practice drills together so every study session
              builds confidence for test day.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button size="lg">
                  Create your account
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="secondary" size="lg">
                  Explore the platform
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="grid gap-16 lg:grid-cols-2 max-w-7xl mx-auto">
        {/* Left Column - Text Content */}
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-primary mb-6 tracking-tight leading-tight">
              Why students choose Deductly
            </h2>
            <p className="text-secondary text-lg leading-relaxed">
              From adaptive drills to actionable insights, Deductly gives you the structure of a tutor with the
              flexibility of an on-demand study partner.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <Card variant="interactive">
              <p className="font-display text-2xl text-primary mb-3 tracking-tight">Adaptive Practice</p>
              <p className="text-secondary leading-relaxed">
                Smart drills surface the exact logic games, arguments, and reading passages you need next.
              </p>
            </Card>

            <Card variant="interactive">
              <p className="font-display text-2xl text-primary mb-3 tracking-tight">Guided Study Plans</p>
              <p className="text-secondary leading-relaxed">
                Diagnose strengths, focus your schedule, and stay accountable with weekly milestones.
              </p>
            </Card>

            <Card variant="interactive">
              <p className="font-display text-2xl text-primary mb-3 tracking-tight">Insights that Matter</p>
              <p className="text-secondary leading-relaxed">
                Score trends, section timing, and accuracy breakdowns help you adjust faster between practice tests.
              </p>
            </Card>
          </div>
        </div>

        {/* Right Column - Trust Card */}
        <div>
          <Card className="bg-sage/5 border-sage/20 h-full flex flex-col">
            <p className="text-xs uppercase tracking-[0.3em] text-muted mb-6">Trusted by test takers</p>
            <h3 className="font-display text-3xl md:text-4xl text-primary mb-6 tracking-tight leading-tight">
              Built by tutors, refined by students
            </h3>
            <p className="text-secondary leading-relaxed mb-10 flex-1">
              We partnered with top scorers and veteran instructors to craft drills and analytics that leave guesswork
              behind. Every release is shaped by real feedback from students who raised their scores 10+ points.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-5">
                <div className="bg-sage/15 rounded-2xl p-4 flex-shrink-0">
                  <svg className="w-7 h-7 text-sage" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-primary font-semibold text-lg mb-1">4.8 / 5 instructor rating</p>
                  <p className="text-secondary text-sm">Based on 500+ post-session surveys</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="bg-success/15 rounded-2xl p-4 flex-shrink-0">
                  <svg className="w-7 h-7 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-primary font-semibold text-lg mb-1">12 point average improvement</p>
                  <p className="text-secondary text-sm">Across first three practice exams on the platform</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="flex flex-col gap-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-muted mb-4">Choose your plan</p>
          <h2 className="font-display text-4xl md:text-5xl text-primary mb-6 tracking-tight">
            Subscription tiers for every stage
          </h2>
          <p className="text-secondary text-lg leading-relaxed">
            Start for free and upgrade when you are ready for deeper personalization and support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              variant={tier.highlight ? "featured" : "default"}
              className={`flex flex-col ${tier.highlight ? 'border-sage/40 transform scale-105' : ''}`}
            >
              {/* Highlight Badge */}
              <div className="h-8 mb-4">
                {tier.highlight && (
                  <Badge variant="default" className="bg-sage text-white border-0">
                    {tier.highlight}
                  </Badge>
                )}
              </div>

              {/* Tier Info */}
              <div className="mb-8">
                <p className="text-xl font-semibold text-primary mb-3">{tier.name}</p>
                <p className="font-display text-5xl text-primary mb-4 tracking-tight">{tier.price}</p>
                <p className="text-secondary leading-relaxed">{tier.description}</p>
              </div>

              {/* Features List */}
              <ul className="flex-1 flex flex-col gap-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-secondary">
                    <svg className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link to={tier.url} className="mt-auto">
                <Button
                  variant={tier.highlight ? "primary" : "secondary"}
                  className="w-full"
                >
                  {tier.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
