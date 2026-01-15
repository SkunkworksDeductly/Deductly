import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [error, setError] = useState('')

  async function handleLogout() {
    try {
      setError('')
      await logout()
      navigate('/login')
    } catch {
      setError('Failed to log out')
    }
  }

  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: 'grid_view',
      activeColor: 'text-terracotta',
      bgActive: 'bg-terracotta-soft/30'
    },
    {
      path: '/diagnostics',
      name: 'Diagnostics',
      icon: 'psychology',
      activeColor: 'text-sage',
      bgActive: 'bg-sage-soft/30'
    },
    {
      path: '/curriculum',
      name: 'Lessons',
      icon: 'auto_stories',
      activeColor: 'text-sage',
      bgActive: 'bg-sage-soft/30'
    },
    {
      path: '/drill',
      name: 'Practice',
      icon: 'quiz',
      activeColor: 'text-terracotta',
      bgActive: 'bg-terracotta-soft/30'
    },
    {
      path: '/analytics',
      name: 'Analytics',
      icon: 'analytics',
      activeColor: 'text-sage',
      bgActive: 'bg-sage-soft/30'
    }
  ]

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/landing'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 h-full w-64 bg-white dark:bg-white/5 border-r border-sand-dark/50 dark:border-white/10 flex flex-col justify-between py-10 transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        <div className="flex flex-col gap-12 px-6">
          <div className="flex items-center gap-4">
            <div className="size-10 shrink-0 text-terracotta bg-terracotta-soft dark:bg-white/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">spa</span>
            </div>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-text-main dark:text-white opacity-80 decoration-0">
              Deductly
            </h2>
          </div>

          <nav className="flex flex-col gap-2 w-full">
            {menuItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isOpen && toggleSidebar()}
                  className={`group relative flex items-center gap-4 py-3 px-4 w-full rounded-xl transition-all ${active
                    ? `${item.bgActive} dark:bg-white/5 ${item.activeColor}`
                    : 'opacity-60 hover:opacity-100 text-text-main dark:text-white'
                    }`}
                >
                  {active && (
                    <div className={`absolute left-0 w-1 h-6 rounded-r-full ${item.activeColor.replace('text-', 'bg-')}`}></div>
                  )}
                  <span className={`material-symbols-outlined text-2xl ${!active && `group-hover:${item.activeColor}`}`}>
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-6 px-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 py-3 px-4 text-text-main/50 hover:text-terracotta transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-4 px-4">
              <div className="size-10 shrink-0 rounded-full overflow-hidden border border-sand-dark dark:border-white/20">
                {currentUser.photoURL ? (
                  <img
                    alt="Profile"
                    className="w-full h-full object-cover"
                    src={currentUser.photoURL}
                  />
                ) : (
                  <div className="w-full h-full bg-sand-dark/30 flex items-center justify-center text-text-main font-bold">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-text-main dark:text-white truncate">
                  {currentUser.displayName || 'Student'}
                </span>
                <span className="text-[10px] text-text-main/40 dark:text-white/40 uppercase tracking-tight">
                  Pro Plan
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar