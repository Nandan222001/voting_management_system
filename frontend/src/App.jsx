import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
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
import SettingsPage from './pages/SettingsPage'
import { selectIsAuthenticated, selectCurrentUser, getMe } from './store/slices/authSlice'
import { Toaster } from 'react-hot-toast'

// ─── PrivateRoute ─────────────────────────────────────────────────────────────
// Requires authenticated user. Shows spinner while auth is resolving.
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1B4FD8] border-t-transparent rounded-full animate-spin" />
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

// ─── SuperAdminRoute ──────────────────────────────────────────────────────────
// Requires authenticated user with role === 'superadmin'.
// Redirects non-superadmins to /dashboard.
function SuperAdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ─── RootRedirect ─────────────────────────────────────────────────────────────
// Decides where / goes based on auth state and role.
function RootRedirect() {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1B4FD8] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export default function App() {
  const dispatch = useDispatch()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (token) {
      dispatch(getMe())
    }
  }, [dispatch, token])

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/otp" element={<OTPPage />} />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute roles={['superadmin']}>
              <SuperAdminDashboard />
            </PrivateRoute>
          } 
        />

      {/* Protected routes for all authenticated users */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/account"
        element={
          <PrivateRoute>
            <AccountPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/elections"
        element={
          <PrivateRoute>
            <ElectionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/elections/:id"
        element={
          <PrivateRoute>
            <ElectionDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/candidates"
        element={
          <PrivateRoute>
            <CandidatesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/results"
        element={
          <PrivateRoute>
            <ResultsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <PrivateRoute>
            <AuditLogsPage />
          </PrivateRoute>
        }
      />

        <Route 
          path="/elections" 
          element={
            <PrivateRoute>
              <ElectionsPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/elections/:id" 
          element={
            <PrivateRoute>
              <ElectionDetailPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/candidates" 
          element={
            <PrivateRoute roles={['admin', 'moderator']}>
              <CandidatesPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/results" 
          element={
            <PrivateRoute>
              <ResultsPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/results/:id" 
          element={
            <PrivateRoute>
              <ResultsPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/revenue" 
          element={
            <PrivateRoute roles={['admin']}>
              <RevenuePage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/users" 
          element={
            <PrivateRoute roles={['admin']}>
              <UsersPage />
            </PrivateRoute>
          } 
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        <Route 
          path="/audit-logs" 
          element={
            <PrivateRoute roles={["superadmin"]}>
              <AuditLogsPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/candidate-committees" 
          element={
            <PrivateRoute roles={['admin']}>
              <CandidateCommitteesPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/targets" 
          element={
            <PrivateRoute roles={['superadmin', 'admin']}>
              <TargetsPage />
            </PrivateRoute>
          } 
        />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
