import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Landing = () => {
  const { currentUser } = useAuth()
  const userName = currentUser?.displayName?.split(' ')[0] || 'Student'

  return (
    <div>
      <div className="px-4 py-8">
        <h1 className="text-text-primary tracking-light text-[32px] font-bold leading-tight text-left pb-3">
          Welcome back, {userName}!
        </h1>
        <p className="text-text-secondary text-base">Here's a look at your progress. Keep up the great work!</p>
      </div>

      <div className="flex justify-stretch mb-8">
        <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
          <Link to="/drill">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-button-primary hover:bg-button-primary-hover text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors">
              <span className="truncate">Start New Practice Test</span>
            </button>
          </Link>
          <Link to="/study-plan">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-overlay-light hover:bg-surface-active text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors">
              <span className="truncate">Continue Last Lesson</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Progress */}
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-primary border border-border-default shadow-sm">
              <p className="text-text-secondary text-base font-medium leading-normal">Overall Progress</p>
              <div className="flex items-center gap-4">
                <div className="relative size-24">
                  <svg className="size-full" height="36" viewBox="0 0 36 36" width="36" xmlns="http://www.w3.org/2000/svg">
                    <circle className="stroke-current text-border-light" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                    <circle className="stroke-current text-button-primary" cx="18" cy="18" fill="none" r="16" strokeDasharray="75 100" strokeDashoffset="25" strokeLinecap="round" strokeWidth="3"></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-text-primary text-lg font-bold">75%</span>
                  </div>
                </div>
                <div>
                  <p className="text-text-primary tracking-light text-[32px] font-bold leading-tight">Good</p>
                  <div className="flex gap-1">
                    <p className="text-text-secondary text-base font-normal leading-normal">All Time</p>
                    <p className="text-status-success text-base font-medium leading-normal">+5%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Trend */}
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-primary border border-border-default shadow-sm">
              <p className="text-text-secondary text-base font-medium leading-normal">Score Trend</p>
              <p className="text-text-primary tracking-light text-[32px] font-bold leading-tight truncate">168</p>
              <div className="flex gap-1">
                <p className="text-text-secondary text-base font-normal leading-normal">Last 30 Days</p>
                <p className="text-status-success text-base font-medium leading-normal">+12</p>
              </div>
            </div>
          </div>

          {/* Score Improvement Chart */}
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-primary border border-border-default shadow-sm">
            <p className="text-text-secondary text-base font-medium leading-normal mb-4">Score Improvement</p>
            <div className="flex min-h-[200px] flex-1 flex-col gap-8">
              <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 475 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#9D3C40" strokeLinecap="round" strokeWidth="3"></path>
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
                    <stop stopColor="#9D3C40" stopOpacity="0.3"></stop>
                    <stop offset="1" stopColor="#9D3C40" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#paint0_linear)"></path>
              </svg>
              <div className="flex justify-around">
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">Jan</p>
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">Feb</p>
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">Mar</p>
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">Apr</p>
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">May</p>
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">Jun</p>
                <p className="text-text-secondary text-[13px] font-bold leading-normal tracking-[0.015em]">Jul</p>
              </div>
            </div>
          </div>

          {/* Question Type Breakdown */}
          <div>
            <h2 className="text-text-primary text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Question Type Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 rounded-lg p-4 text-center bg-surface-primary border border-border-default shadow-sm">
                <p className="text-text-secondary text-base font-medium">Logical Reasoning</p>
                <p className="text-text-primary text-3xl font-bold">85%</p>
                <p className="text-status-success text-sm">+5%</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg p-4 text-center bg-surface-primary border border-border-default shadow-sm">
                <p className="text-text-secondary text-base font-medium">Reading Comp</p>
                <p className="text-text-primary text-3xl font-bold">78%</p>
                <p className="text-status-success text-sm">+2%</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg p-4 text-center bg-surface-primary border border-border-default shadow-sm">
                <p className="text-text-secondary text-base font-medium">Logic Games</p>
                <p className="text-text-primary text-3xl font-bold">92%</p>
                <p className="text-status-error text-sm">-1%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Recent Activity */}
          <div className="rounded-xl p-6 bg-surface-primary border border-border-default shadow-sm">
            <h2 className="text-text-primary text-lg font-bold mb-4">Recent Activity</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div className="bg-accent-warning-bg rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-button-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-text-primary font-medium">Practice Test #5</p>
                  <p className="text-text-secondary text-sm">Completed 2 days ago</p>
                </div>
                <p className="text-text-primary ml-auto font-bold">170</p>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-accent-peach/20 rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-accent-peach" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-text-primary font-medium">Advanced Logic Games</p>
                  <p className="text-text-secondary text-sm">Completed 4 days ago</p>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-accent-warning-bg rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-button-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-text-primary font-medium">Practice Test #4</p>
                  <p className="text-text-secondary text-sm">Completed 1 week ago</p>
                </div>
                <p className="text-text-primary ml-auto font-bold">165</p>
              </li>
            </ul>
          </div>

          {/* Study Plan */}
          <div className="rounded-xl p-6 bg-surface-primary border border-border-default shadow-sm">
            <h2 className="text-text-primary text-lg font-bold mb-4">Study Plan</h2>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent-warning-bg">
              <svg className="w-8 h-8 text-button-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <div>
                <p className="text-text-primary font-bold">Next Up: Reading Comprehension</p>
                <p className="text-text-secondary text-sm">Focus on identifying main ideas.</p>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="rounded-xl p-6 bg-surface-primary border border-border-default shadow-sm">
            <p className="text-text-secondary italic text-center">
              "The will to win is important, but the will to prepare is vital." - Joe Paterno
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing