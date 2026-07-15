import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  loginUser,
  logoutUser,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../store/slices/authSlice'

/**
 * Custom hook for authentication state and actions.
 * Exposes user info, auth state, and login/logout functions.
 */
export default function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)

  const login = async (email, password) => {
    const result = await dispatch(loginUser({ email, password }))
    if (loginUser.fulfilled.match(result)) {
      const role = result.payload?.user?.role
      if (role === 'superadmin') {
        navigate('/superadmin')
      } else {
        navigate('/dashboard')
      }
      return { success: true }
    }
    return { success: false, error: result.payload }
  }

  const logout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'
  const isModerator = user?.role === 'moderator'
  const isAdminOrModerator = isAdmin || isModerator
  const isSuperAdmin = user?.role === 'superadmin'
  const tenantId = user?.tenant_id ?? null

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isModerator,
    isAdminOrModerator,
    isSuperAdmin,
    tenantId,
  }
}
