import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import authService from '../../services/authService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
    try {
      // authService.login sends form-encoded { username, password } which
      // FastAPI's OAuth2PasswordRequestForm expects (username is email here).
      const response = await authService.login(email, password)
      const { access_token, user } = response.data
      localStorage.setItem('token', access_token)
      return { token: access_token, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      )
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ full_name, email, password, phone = null, tenant_id = null }, { rejectWithValue }) => {
    try {
      const response = await authService.register(full_name, email, password, phone, tenant_id)
      // backend returns the created user object
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed. Please check your input.'
      )
    }
  }
)

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')
      return response.data.user || response.data
    } catch (error) {
      localStorage.removeItem('token')
      return rejectWithValue(
        error.response?.data?.message || 'Session expired. Please log in again.'
      )
    }
  }
)

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      return { token, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'OTP verification failed.'
      )
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore server errors on logout
    } finally {
      localStorage.removeItem('token')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: !!localStorage.getItem('token'), // loading if we have a token (getMe pending)
  error: null,
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.loading = false
      state.error = null
      localStorage.setItem('token', token)
    },
    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      localStorage.removeItem('token')
    },
    setLoading(state, action) {
      state.loading = action.payload
    },
    setError(state, action) {
      state.error = action.payload
      state.loading = false
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.loading = false
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })

    // registerUser
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        // After registration, user is created but not logged in automatically
        state.loading = false
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // getMe
    builder
      .addCase(getMe.pending, (state) => {
        state.loading = true
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.loading = false
        state.error = null
      })
      .addCase(getMe.rejected, (state, action) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = action.payload
      })

    // verifyOTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.loading = false
        state.error = null
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // logoutUser
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
      })
  },
})

export const { setCredentials, logout, setLoading, setError, clearError } = authSlice.actions

// Selectors
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error

export default authSlice.reducer
