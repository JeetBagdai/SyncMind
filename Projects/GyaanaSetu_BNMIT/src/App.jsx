// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Learning from './pages/Learning'
import Attendance from './pages/Attendance'
import Timetable from './pages/Timetable'
import Admin from './pages/Admin'
import Chatbot from './pages/Chatbot'
import Quiz from './pages/Quiz'
import TimetableManage from './pages/TimetableManage'
import Profile from './pages/Profile'
import TeacherPerformance from './pages/TeacherPerformance'
import CodeITList from './pages/CodeITList'
import CodeITEditor from './pages/CodeITEditor'
import './services/i18n'


function RootRedirect() {
  const { profile } = useAuth()
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
}

function AppLayout({ children }) {
  const { profile } = useAuth()
  const location = useLocation()
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (location.pathname === '/learning' || location.pathname === '/quiz' || location.pathname.startsWith('/codeit/')) return false
    return window.innerWidth > 768
  })

  useEffect(() => {
    if (location.pathname === '/learning' || location.pathname === '/quiz' || location.pathname.startsWith('/codeit/')) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div className={`page-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar className={sidebarOpen ? 'open' : ''} />
      <div className="main-content">
        <Navbar onMenuClick={() => setSidebarOpen(o => !o)} />
        {children}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <AppLayout><Learning /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/codeit" element={
              <ProtectedRoute>
                <AppLayout><CodeITList /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/codeit/:problemId" element={
              <ProtectedRoute>
                <AppLayout><CodeITEditor /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <AppLayout><Attendance /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/timetable" element={
              <ProtectedRoute>
                <AppLayout><Timetable /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/timetable-manage" element={
              <ProtectedRoute>
                <AppLayout><TimetableManage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/performance" element={
              <ProtectedRoute>
                <AppLayout><TeacherPerformance /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/chatbot" element={
              <ProtectedRoute>
                <AppLayout><Chatbot /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/quiz" element={
              <ProtectedRoute>
                <AppLayout><Quiz /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><Admin /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout><Profile /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
