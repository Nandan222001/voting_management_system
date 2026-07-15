import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchVotesByElection = createAsyncThunk(
  'votes/fetchByElection',
  async (electionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/votes/election/${electionId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch votes.')
    }
  }
)

export const fetchDashboardOverview = createAsyncThunk(
  'votes/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/dashboard')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard overview.')
    }
  }
)

export const fetchAuditLogs = createAsyncThunk(
  'votes/fetchAuditLogs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/audit-logs', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit logs.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  votes: [],
  auditLogs: [],
  dashboardOverview: null,
  totalVotes: 0,
  totalAuditLogs: 0,
  loading: false,
  error: null,
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const voteSlice = createSlice({
  name: 'votes',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchVotesByElection
    builder
      .addCase(fetchVotesByElection.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVotesByElection.fulfilled, (state, action) => {
        state.loading = false
        state.votes = action.payload.votes || action.payload.data || action.payload
        state.totalVotes = action.payload.total || state.votes.length
      })
      .addCase(fetchVotesByElection.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchDashboardOverview
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardOverview = action.payload
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchAuditLogs
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false
        // Extract from data object: { logs: [], total: 0, ... }
        const data = action.payload.data || action.payload
        state.auditLogs = data.logs || []
        state.totalAuditLogs = data.total || state.auditLogs.length
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = voteSlice.actions

// Selectors
export const selectVotes = (state) => state.votes.votes
export const selectAuditLogs = (state) => state.votes.auditLogs
export const selectDashboardOverview = (state) => state.votes.dashboardOverview
export const selectVoteLoading = (state) => state.votes.loading

export default voteSlice.reducer
