import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OTPPage from './pages/OTPPage'
import AccountPage from './pages/AccountPage'
import DashboardPage from './pages/DashboardPage'
import ElectionsPage from './pages/ElectionsPage'
import CandidatesPage from './pages/CandidatesPage'
import UsersPage from './pages/UsersPage'
import TenantsPage from './pages/TenantsPage'
import ResultsPage from './pages/ResultsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import CandidateCommitteesPage from './pages/CandidateCommitteesPage'
import TargetsPage from './pages/TargetsPage'
import RevenuePage from './pages/RevenuePage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import ElectionDetailPage from './pages/ElectionDetailPage'
import NominationsPage from './pages/NominationsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import SettingsPage from './pages/SettingsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

import { getMe } from './store/slices/authSlice'

// ─── PrivateRoute ─────────────────────────────────────────────────────────────
function PrivateRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1a337e] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// ─── RootRedirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1a337e] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state) => state.auth)
  const token = localStorage.getItem('token')

  useEffect(() => {
    // Only fetch user if we have a token but aren't authenticated yet
    if (token && !isAuthenticated) {
      dispatch(getMe())
    }
  }, [dispatch, token, isAuthenticated])

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp" element={<OTPPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Dashboard - unified for all roles */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardSwitch />
            </PrivateRoute>
          } 
        />

        {/* Protected Routes */}
        <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        
        {/* Admin/Moderator Routes */}
        <Route path="/elections" element={<PrivateRoute roles={['admin', 'superadmin', 'moderator']}><ElectionsPage /></PrivateRoute>} />
        <Route path="/elections/:id" element={<PrivateRoute roles={['admin', 'superadmin', 'moderator']}><ElectionDetailPage /></PrivateRoute>} />
        <Route path="/candidates" element={<PrivateRoute roles={['admin', 'superadmin', 'moderator']}><CandidatesPage /></PrivateRoute>} />
        <Route path="/nominations" element={<PrivateRoute roles={['admin', 'superadmin', 'moderator']}><NominationsPage /></PrivateRoute>} />
        <Route path="/announcements" element={<PrivateRoute roles={['admin', 'superadmin']}><AnnouncementsPage /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute roles={['admin', 'superadmin']}><UsersPage /></PrivateRoute>} />
        <Route path="/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
        <Route path="/results/:id" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
        
        {/* SuperAdmin Only */}
        <Route path="/tenants" element={<PrivateRoute roles={['superadmin']}><TenantsPage /></PrivateRoute>} />
        <Route path="/audit-logs" element={<PrivateRoute roles={['superadmin', 'admin']}><AuditLogsPage /></PrivateRoute>} />
        <Route path="/revenue" element={<PrivateRoute roles={['admin', 'superadmin']}><RevenuePage /></PrivateRoute>} />
        <Route path="/targets" element={<PrivateRoute roles={['admin', 'superadmin']}><TargetsPage /></PrivateRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function DashboardSwitch() {
  const { user } = useSelector((state) => state.auth)
  return user?.role === 'superadmin' ? <SuperAdminDashboard /> : <DashboardPage />
}
