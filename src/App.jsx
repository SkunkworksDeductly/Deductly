import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DrillProvider } from './contexts/DrillContext'
import PrivateRoute from './components/PrivateRoute'
import PublicLanding from './pages/PublicLanding'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DesignDemo from './pages/DesignDemo'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Diagnostics from './pages/Diagnostics'
import AdaptiveDiagnosticSession from './pages/AdaptiveDiagnosticSession'
import DiagnosticSummary from './pages/DiagnosticSummary'
import DrillBuilder from './pages/DrillBuilder'
import DrillSession from './pages/DrillSession'
import DrillResults from './pages/DrillResults'
import DrillSummary from './pages/DrillSummary'
import Analytics from './pages/Analytics'
import StudyPlan from './pages/StudyPlan'
import Curriculum from './pages/Curriculum'
import VideoDetail from './pages/VideoDetail'

import Header from './components/Header'
import Sidebar from './components/Sidebar'

const routerBaseName = import.meta.env.BASE_URL

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-sand overflow-hidden h-screen flex transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="flex-1 overflow-y-auto no-scrollbar relative bg-background-light dark:bg-background-dark w-full">
        <Header toggleSidebar={toggleSidebar} />
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <DrillProvider>
        <Router basename={routerBaseName}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/design-demo" element={<DesignDemo />} />

            {/* Protected routes */}
            <Route path="/*" element={
              <PrivateRoute>
                <AppLayout>
                  <Routes>
                    <Route index element={<Home />} />
                    <Route path="dashboard" element={<Landing />} />
                    <Route path="diagnostics" element={<Diagnostics />} />
                    <Route path="diagnostics/adaptive" element={<AdaptiveDiagnosticSession />} />
                    <Route path="diagnostics/summary" element={<DiagnosticSummary />} />
                    <Route path="study-plan" element={<StudyPlan />} />
                    <Route path="curriculum" element={<Curriculum />} />
                    <Route path="curriculum/:videoId" element={<VideoDetail />} />
                    <Route path="drill" element={<DrillBuilder />} />
                    <Route path="drill/session" element={<DrillSession />} />
                    <Route path="drill/summary" element={<DrillSummary />} />
                    <Route path="drill/results/:drillId" element={<DrillResults />} />
                    <Route path="analytics" element={<Analytics />} />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </DrillProvider>
    </AuthProvider>
  )
}

export default App
