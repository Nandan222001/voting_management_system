import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ElectionsPage from './pages/ElectionsPage'
import CandidatesPage from './pages/CandidatesPage'
import UsersPage from './pages/UsersPage'
import TenantsPage from './pages/TenantsPage'
import ResultsPage from './pages/ResultsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import CandidateCommitteesPage from './pages/CandidateCommitteesPage'
import TargetsPage from './pages/TargetsPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import ElectionDetailPage from './pages/ElectionDetailPage'
import { selectIsAuthenticated, selectCurrentUser, getMe } from './store/slices/authSlice'
import { Toaster } from 'react-hot-toast'

// Higher-order component to protect routes
const PrivateRoute = ({ children, roles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
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
    <>
      <Toaster position="top-right" />
      <Routes>
  <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute roles={['superadmin']}>
              <SuperAdminDashboard />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/tenants" 
          element={
            <PrivateRoute roles={['superadmin']}>
              <TenantsPage />
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
          path="/users" 
          element={
            <PrivateRoute roles={['admin']}>
              <UsersPage />
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
            <PrivateRoute roles={['admin']}>
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
