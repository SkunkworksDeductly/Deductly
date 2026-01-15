import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header = ({ toggleSidebar }) => {
  const { currentUser } = useAuth()
  const location = useLocation()

  // Get current page title based on path
  const getPageTitle = (path) => {
    if (path.includes('dashboard') || path === '/' || path.includes('landing')) return 'Student Portal'
    if (path.includes('drill')) return 'Practice Center'
    if (path.includes('analytics')) return 'Performance'
    if (path.includes('study-plan')) return 'Study Plan'
    if (path.includes('curriculum')) return 'Curriculum'
    if (path.includes('diagnostics')) return 'Diagnostics'
    return 'Deductly'
  }

  return (
    <header className="flex lg:hidden items-center justify-between px-6 py-4 border-b border-sand-dark/30 dark:border-white/5 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-text-main dark:text-white hover:bg-sand dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta font-sans">
            {getPageTitle(location.pathname)}
          </p>
          <h1 className="text-lg font-bold text-text-main dark:text-white leading-none">
            Deductly
          </h1>
        </div>
      </div>

      {currentUser && (
        <div className="size-8 rounded-full overflow-hidden border border-sand-dark dark:border-white/20">
          {currentUser.photoURL ? (
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src={currentUser.photoURL}
            />
          ) : (
            <div className="w-full h-full bg-sand-dark/30 flex items-center justify-center text-text-main font-bold text-xs">
              {currentUser.displayName?.[0] || 'U'}
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Header
