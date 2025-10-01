import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import PrivateRoute from './components/PrivateRoute'
import Landing from './pages/Landing'
import Diagnostics from './pages/Diagnostics'
import StudyPlan from './pages/StudyPlan'
import Drill from './pages/Drill'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/*" element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

                {/* Header with hamburger menu */}
                <header className="bg-white shadow-sm border-b">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <button
                      onClick={toggleSidebar}
                      className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>

                    <h1 className="text-xl font-bold text-gray-900">Deductly</h1>

                    <div className="w-10"></div> {/* Spacer for center alignment */}
                  </div>
                </header>

                {/* Main content */}
                <main className="transition-all duration-300">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/diagnostics" element={<Diagnostics />} />
                    <Route path="/study-plan" element={<StudyPlan />} />
                    <Route path="/drill" element={<Drill />} />
                  </Routes>
                </main>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  ></div>
                )}
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App