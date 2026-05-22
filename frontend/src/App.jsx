import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getMe } from './store/slices/authSlice'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ElectionsPage from './pages/ElectionsPage'
import ElectionDetailPage from './pages/ElectionDetailPage'
import CandidatesPage from './pages/CandidatesPage'
import UsersPage from './pages/UsersPage'
import ResultsPage from './pages/ResultsPage'
import AuditLogsPage from './pages/AuditLogsPage'

// PrivateRoute component — each page handles its own MainLayout
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// RootRedirect: decides where / goes
function RootRedirect() {
  const { isAuthenticated } = useSelector((state) => state.auth)
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)

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

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
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

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
