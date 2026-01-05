import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef(null)

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Diagnostic', path: '/diagnostics' },
    { name: 'Study Plan', path: '/study-plan' },
    { name: 'Practice', path: '/drill' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Curriculum', path: '/curriculum' }
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'

    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset image error state when user changes
  useEffect(() => {
    setImageError(false)
  }, [currentUser])

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0.85) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <div className="flex items-center justify-between px-6 sm:px-10 py-4 max-w-[1400px] mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div
            className="size-10 transition-all duration-200 group-hover:scale-110"
            style={{ color: '#6366f1' }}
          >
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h1
            className="text-2xl leading-tight"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              letterSpacing: '-0.02em',
              color: '#ffffff'
            }}
          >
            Deductly
          </h1>
        </Link>

        <nav className="hidden md:flex flex-1 justify-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="relative py-2 px-1 text-[15px] font-medium transition-all duration-200"
              style={{
                color: isActive(item.path) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.color = '#ffffff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.color = 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              {item.name}
              {isActive(item.path) && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                  }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer transition-all duration-200 hover:scale-110"
                style={{
                  backgroundImage: (currentUser.photoURL && !imageError)
                    ? `url("${currentUser.photoURL}")`
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: dropdownOpen
                    ? '0 0 0 2px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                {currentUser.photoURL && !imageError && (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    className="hidden"
                    onError={() => setImageError(true)}
                  />
                )}
                {(!currentUser.photoURL || imageError) && (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-xl py-2 z-50"
                  style={{
                    background: 'linear-gradient(165deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 28, 0.98) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset'
                  }}
                >
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
                  >
                    <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                      {currentUser.displayName || 'User'}
                    </p>
                    <p className="text-xs truncate mt-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-2"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
