import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Kick off your LSAT prep with curated practice and guidance.',
      cta: 'Start Practicing',
      url: '/signup',
      features: [
        'Daily question warmups',
        'Baseline diagnostic quiz',
        'Progress dashboard snapshot'
      ]
    },
    {
      name: 'All-Access',
      price: '$39 / mo',
      highlight: 'Most Popular',
      description: 'Unlock guided study plans and drill builders tailored to you.',
      cta: 'Unlock All-Access',
      url: '/signup',
      features: [
        'Personalized study roadmap',
        'Adaptive drill builder',
        'Full analytics suite'
      ]
    },
    {
      name: 'Premium',
      price: '$89 / mo',
      description: 'Everything in All-Access plus live coaching and priority support.',
      cta: 'Upgrade to Premium',
      url: '/signup',
      features: [
        'Weekly strategy sessions',
        'Unlimited proctored exams',
        '1:1 insights from tutors'
      ]
    }
  ]

  return (
    <div className="flex flex-col gap-16 px-4 py-10 text-white">
      <section className="flex flex-col gap-8 rounded-3xl bg-gradient-to-br from-matte-red/80 via-matte-red to-matte-purple/80 px-6 py-12 md:px-12 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">LSAT mastery, simplified</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Personalized prep that adapts to the way you learn.
          </h1>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            Deductly brings your diagnostics, study plans, and practice drills together so every study session
            builds confidence for test day.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            to="/signup"
            className="flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold tracking-wide text-matte-red transition hover:bg-white/90"
          >
            Create your account
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-base font-semibold tracking-wide text-white transition hover:border-white"
          >
            Explore the platform
          </Link>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">Why students choose Deductly</h2>
          <p className="text-base text-white/70">
            From adaptive drills to actionable insights, Deductly gives you the structure of a tutor with the
            flexibility of an on-demand study partner.
          </p>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-lg font-semibold">Adaptive Practice</p>
              <p className="mt-2 text-sm text-white/70">
                Smart drills surface the exact logic games, arguments, and reading passages you need next.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-lg font-semibold">Guided Study Plans</p>
              <p className="mt-2 text-sm text-white/70">
                Diagnose strengths, focus your schedule, and stay accountable with weekly milestones.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-lg font-semibold">Insights that Matter</p>
              <p className="mt-2 text-sm text-white/70">
                Score trends, section timing, and accuracy breakdowns help you adjust faster between practice tests.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Trusted by test takers</p>
          <h3 className="mt-4 text-2xl font-semibold md:text-3xl">Built by tutors, refined by students</h3>
          <p className="mt-4 text-base text-white/70">
            We partnered with top scorers and veteran instructors to craft drills and analytics that leave guesswork
            behind. Every release is shaped by real feedback from students who raised their scores 10+ points.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-matte-red/30 p-3">
                <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11.5A4.5 4.5 0 016.5 7h7A4.5 4.5 0 0118 11.5V16h-2v-4.5A2.5 2.5 0 0013.5 9h-7A2.5 2.5 0 004 11.5V16H2v-4.5z" />
                  <path d="M5.5 4A4.5 4.5 0 0110 8.5 4.5 4.5 0 015.5 13 4.5 4.5 0 011 8.5 4.5 4.5 0 015.5 4zM14.5 1A3.5 3.5 0 1111 4.5 3.5 3.5 0 0114.5 1z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold">4.8 / 5 instructor rating</p>
                <p className="text-sm text-white/60">Based on 500+ post-session surveys</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-matte-red/30 p-3">
                <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 17a1 1 0 102 0V4h3a1 1 0 100-2H4a1 1 0 000 2h3v13a1 1 0 102 0V4h2v13z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold">12 point average improvement</p>
                <p className="text-sm text-white/60">Across first three practice exams on the platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Choose your plan</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Subscription tiers for every stage</h2>
          <p className="mt-3 text-base text-white/70 md:text-lg">
            Start for free and upgrade when you are ready for deeper personalization and support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-left backdrop-blur ${
                tier.highlight ? 'ring-2 ring-matte-red/70' : ''
              }`}
            >
              {tier.highlight && (
                <span className="inline-flex w-fit items-center rounded-full bg-matte-red/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {tier.highlight}
                </span>
              )}
              <div>
                <p className="text-lg font-semibold">{tier.name}</p>
                <p className="mt-2 text-2xl font-bold">{tier.price}</p>
                <p className="mt-2 text-sm text-white/70">{tier.description}</p>
              </div>
              <ul className="flex flex-1 list-disc flex-col gap-2 pl-4 text-sm text-white/80 marker:text-matte-red">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                to={tier.url}
                className="flex items-center justify-center rounded-lg bg-matte-red px-4 py-2 text-sm font-semibold tracking-wide text-white transition hover:bg-matte-red/80"
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
