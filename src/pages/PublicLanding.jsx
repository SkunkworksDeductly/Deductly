import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils'

export default function PublicLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-sand/30 dark:bg-background-dark font-sans selection:bg-terracotta/20">

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-sand-dark/10 dark:border-white/5 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="size-10 bg-terracotta rounded-xl flex items-center justify-center shadow-soft">
                <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
              </div>
              <span className="text-xl font-black tracking-tight text-text-main dark:text-white uppercase font-serif">Deductly.</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {['Methodology', 'Curriculum', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-bold uppercase tracking-widest text-text-main/60 dark:text-white/60 hover:text-terracotta transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-xs">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm" className="shadow-lg shadow-terracotta/20">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-text-main dark:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-6 border-t border-sand-dark/10 dark:border-white/5 animate-in slide-in-from-top-4">
              <div className="flex flex-col gap-4">
                {['Methodology', 'Curriculum', 'Pricing'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-base font-bold text-text-main dark:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="flex flex-col gap-3 pt-4 border-t border-sand-dark/10 dark:border-white/5">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-center">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="primary" className="w-full justify-center">Start Free Trial</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container px-6 lg:px-12 mx-auto max-w-[1600px] relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">

            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-sand-dark/20 dark:border-white/10 shadow-sm transition-all duration-700 transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Badge variant="primary">New</Badge>
              <span className="text-xs font-bold uppercase tracking-wide text-text-main/60 dark:text-white/60">
                Current LSAT Format Ready
              </span>
            </div>

            <h1 className={cn(
              "text-6xl md:text-8xl lg:text-9xl font-black text-text-main dark:text-white tracking-tighter leading-[0.9] transition-all duration-700 delay-100 transform font-serif",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              Logic <span className="text-terracotta inline-block relative">
                Solved
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-terracotta/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span><br />
              <span className="text-text-main/20 dark:text-white/10">Simplicity.</span>
            </h1>

            <p className={cn(
              "text-xl md:text-2xl text-text-main/60 dark:text-white/60 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              Elite LSAT prep that adapts to you. The personalized coaching of a $2,000 course, democratized through intelligent design.
            </p>

            <div className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 transition-all duration-700 delay-300 transform",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <Link to="/signup">
                <Button size="lg" className="h-14 px-10 text-base shadow-xl shadow-terracotta/20 hover:scale-105 transition-transform">
                  Start Learning Free
                </Button>
              </Link>
              <button className="h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-sm text-text-main/60 dark:text-white/60 border border-sand-dark/20 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined">play_circle</span>
                Watch Methodology
              </button>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sage/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-overlay animate-float-slow" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-terracotta/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-overlay animate-float-slower" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-sand-dark/20 dark:border-white/5 bg-white dark:bg-white/5">
        <div className="container px-6 lg:px-12 mx-auto max-w-[1600px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Average Improvement', value: '+12 pts', icon: 'trending_up' },
              { label: 'Instructor Rating', value: '4.9/5', icon: 'star' },
              { label: 'Practice Questions', value: '8,000+', icon: 'quiz' },
              { label: 'Active Students', value: '1,200+', icon: 'groups' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-sand/50 dark:bg-white/10 text-terracotta mb-2">
                  <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-text-main dark:text-white font-serif">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-text-main/40 dark:text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology / Features */}
      <section id="methodology" className="py-24 lg:py-32">
        <div className="container px-6 lg:px-12 mx-auto max-w-[1600px]">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="mb-4">Our Methodology</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-text-main dark:text-white leading-tight mb-6 font-serif">
                  Intelligence that <br /><span className="text-sage">evolves with you.</span>
                </h2>
                <p className="text-lg text-text-main/60 dark:text-white/60 leading-relaxed max-w-xl">
                  Most LSAT courses are static. Deductly is dynamic. Using advanced psychometrics, we build a cognitive map of your logical reasoning patterns and tailor every drill to close your specific gaps.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { title: 'Adaptive Diagnostics', desc: 'Identify your baseline across 12 distinct logical reasoning skills.', icon: 'psychology' },
                  { title: 'Dynamic Drills', desc: 'Practice sets that get harder as you get sharper.', icon: 'fitness_center' },
                  { title: 'Predictive Analytics', desc: 'Know exactly when you are ready to hit your target score.', icon: 'analytics' },
                ].map((feature, i) => (
                  <Card key={i} variant="flat" className="p-6 flex gap-6 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-default">
                    <div className="size-12 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-text-main/60 dark:text-white/60 leading-relaxed">{feature.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Visual Demo Area */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-terracotta/20 to-sage/20 rounded-[3rem] blur-3xl -z-10" />
              <Card variant="default" className="p-8 rotate-[-2deg] rounded-[2.5rem] bg-white dark:bg-[#1a1c18] border-sand-dark/20 dark:border-white/10 shadow-2xl">
                {/* Mock Interface */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-sand-dark/10 pb-6">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-widest text-text-main/40">Current Session</div>
                      <div className="text-2xl font-black text-text-main dark:text-white font-serif">Logical Reasoning II</div>
                    </div>
                    <Badge variant="primary">Adaptive Mode</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-sand-dark/10 rounded-full" />
                    <div className="h-4 w-1/2 bg-sand-dark/10 rounded-full" />
                    <div className="h-4 w-5/6 bg-sand-dark/10 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-xl bg-sage/5 border border-sage/10 hover:border-sage/30 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-6 rounded-full bg-white text-sage flex items-center justify-center text-xs font-bold border border-sage/20">A</div>
                        <span className="text-sm font-bold text-text-main">Strengthen</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-terracotta/5 border border-terracotta/10 hover:border-terracotta/30 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-6 rounded-full bg-white text-terracotta flex items-center justify-center text-xs font-bold border border-terracotta/20">B</div>
                        <span className="text-sm font-bold text-text-main">Weaken</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Floating Card */}
              <Card variant="elevated" className="absolute -bottom-12 -left-12 p-6 max-w-xs rotate-[4deg] hidden md:block animate-float">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-main/40 uppercase tracking-wider">Skill Gained</div>
                    <div className="text-lg font-black text-text-main">+5.2% Accuracy</div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32 bg-white dark:bg-white/5 border-t border-sand-dark/20 dark:border-white/5">
        <div className="container px-6 lg:px-12 mx-auto max-w-[1600px]">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge variant="outline">Simple Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-text-main dark:text-white font-serif">
              Invest in your future,<br /> not a brand name.
            </h2>
            <p className="text-lg text-text-main/60 dark:text-white/60">
              Transparent membership tiers designed for self-starters and ambitious learners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card variant="flat" className="p-8 relative hover:-translate-y-2 transition-transform duration-300">
              <div className="mb-6 space-y-2">
                <h3 className="text-lg font-bold uppercase tracking-widest text-text-main/60">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-text-main dark:text-white font-serif">$0</span>
                  <span className="text-text-main/40">/ mo</span>
                </div>
                <p className="text-sm text-text-main/60">Perfect for getting a baseline.</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['1 Diagnostic Exam', 'Basic Analytics', '50 Practice Questions', 'Community Access'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-text-main/80">
                    <span className="material-symbols-outlined text-terracotta text-lg">check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </Card>

            {/* Pro Tier (Featured) */}
            <Card variant="elevated" className="p-8 relative transform md:-translate-y-4 border-terracotta/40 dark:border-terracotta/40 shadow-2xl shadow-terracotta/10">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant="primary">Most Popular</Badge>
              </div>
              <div className="mb-6 space-y-2">
                <h3 className="text-lg font-bold uppercase tracking-widest text-terracotta">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-text-main dark:text-white font-serif">$29</span>
                  <span className="text-text-main/40">/ mo</span>
                </div>
                <p className="text-sm text-text-main/60">The complete toolkit for high scorers.</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited Adaptive Drills', 'AI-Powered Insights', 'Full Video Curriculum', '10 Full-Length Practice Tests', 'Priority Support'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-text-main dark:text-white">
                    <span className="material-symbols-outlined text-terracotta text-lg">check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button variant="primary" className="w-full h-12 shadow-lg shadow-terracotta/25">Start Free 7-Day Trial</Button>
              </Link>
            </Card>

            {/* Tutoring Tier */}
            <Card variant="flat" className="p-8 relative hover:-translate-y-2 transition-transform duration-300">
              <div className="mb-6 space-y-2">
                <h3 className="text-lg font-bold uppercase tracking-widest text-text-main/60">Tutoring</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-text-main dark:text-white font-serif">$199</span>
                  <span className="text-text-main/40">/ mo</span>
                </div>
                <p className="text-sm text-text-main/60">1-on-1 coaching for specific goals.</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Pro', '4 Hours 1-on-1 Coaching', 'Custom Study Plan Review', 'Essay Analysis', 'Direct Tutor Chat'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-text-main/80">
                    <span className="material-symbols-outlined text-terracotta text-lg">check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-white/5 border-t border-sand-dark/20 dark:border-white/5">
        <div className="container px-6 lg:px-12 mx-auto max-w-[1600px] text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
            <span className="size-8 rounded bg-text-main dark:bg-white flex items-center justify-center text-white dark:text-text-main font-black font-serif">D</span>
            <span className="font-bold tracking-tight text-lg">Deductly.</span>
          </div>
          <p className="text-sm text-text-main/40 dark:text-white/40">
            &copy; {new Date().getFullYear()} Deductly Inc. Democratizing legal education.
          </p>
        </div>
      </footer>

    </div>
  )
}
