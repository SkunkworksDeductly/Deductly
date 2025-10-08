import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DrillProvider } from './contexts/DrillContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Diagnostics from './pages/Diagnostics'
import StudyPlan from './pages/StudyPlan'
import DrillBuilder from './pages/DrillBuilder'
import DrillSession from './pages/DrillSession'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DiagnosticSummary from './pages/DiagnosticSummary'
import DrillSummary from './pages/DrillSummary'

const routerBaseName = import.meta.env.BASE_URL.replace(/\/+$/, '')

function App() {
  return (
    <AuthProvider>
      <DrillProvider>
        <Router basename={routerBaseName}>
          <Routes>
            {/* Public routes - temporarily disabled login */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* All routes temporarily accessible without authentication */}
            <Route path="/*" element={
              <div className="relative flex h-auto min-h-screen w-full flex-col bg-matte-purple">
                <div className="layout-container flex h-full grow flex-col">
                  <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
                    <div className="layout-content-container flex flex-col max-w-[1200px] flex-1">
                      <Header />

                      <main className="flex-1">
                        <Routes>
                          <Route index element={<Home />} />
                          <Route path="dashboard" element={<Landing />} />
                          <Route path="diagnostics" element={<Diagnostics />} />
                          <Route path="diagnostics/session" element={<DrillSession />} />
                          <Route path="diagnostics/summary" element={<DiagnosticSummary />} />
                          <Route path="study-plan" element={<StudyPlan />} />
                          <Route path="drill" element={<DrillBuilder />} />
                          <Route path="drill/session" element={<DrillSession />} />
                          <Route path="drill/summary" element={<DrillSummary />} />
                        </Routes>
                      </main>

                      <Footer />
                    </div>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </Router>
      </DrillProvider>
    </AuthProvider>
  )
}

export default App
