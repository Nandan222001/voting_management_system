import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import nominationService from '../../services/nominationService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchNominations = createAsyncThunk(
  'nominations/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await nominationService.getNominations(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nominations.')
    }
  }
)

export const fetchNominationStats = createAsyncThunk(
  'nominations/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await nominationService.getNominationsStats()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nomination stats.')
    }
  }
)

export const approveNomination = createAsyncThunk(
  'nominations/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await nominationService.approveNomination(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve nomination.')
    }
  }
)

export const rejectNomination = createAsyncThunk(
  'nominations/reject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await nominationService.rejectNomination(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject nomination.')
    }
  }
)

export const suspendNomination = createAsyncThunk(
  'nominations/suspend',
  async (id, { rejectWithValue }) => {
    try {
      const response = await nominationService.suspendNomination(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to suspend nomination.')
    }
  }
)

export const deleteNomination = createAsyncThunk(
  'nominations/delete',
  async (id, { rejectWithValue }) => {
    try {
      await nominationService.deleteNomination(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete nomination.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  nominations: [],
  stats: null,
  total: 0,
  page: 1,
  loading: false,
  actionLoading: false,
  error: null,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function updateNominationInList(nominations, updatedPayload) {
  // Handle both direct object and wrapped data object
  const updated = updatedPayload?.data || updatedPayload
  return nominations.map((n) =>
    (n.id) === (updated.id) ? { ...n, ...updated } : n
  )
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const nominationSlice = createSlice({
  name: 'nominations',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchNominations
    builder
      .addCase(fetchNominations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNominations.fulfilled, (state, action) => {
        state.loading = false
        // Handle NominationListResponse directly or wrapped
        const data = action.payload?.items ? action.payload : action.payload?.data
        state.nominations = data?.items || []
        state.total = data?.total || 0
        state.page = data?.page || 1
      })
      .addCase(fetchNominations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchNominationStats
    builder
      .addCase(fetchNominationStats.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchNominationStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload
      })
      .addCase(fetchNominationStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // approveNomination
    builder
      .addCase(approveNomination.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(approveNomination.fulfilled, (state, action) => {
        state.actionLoading = false
        state.nominations = updateNominationInList(state.nominations, action.payload)
      })
      .addCase(approveNomination.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // rejectNomination
    builder
      .addCase(rejectNomination.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(rejectNomination.fulfilled, (state, action) => {
        state.actionLoading = false
        state.nominations = updateNominationInList(state.nominations, action.payload)
      })
      .addCase(rejectNomination.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // suspendNomination
    builder
      .addCase(suspendNomination.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(suspendNomination.fulfilled, (state, action) => {
        state.actionLoading = false
        state.nominations = updateNominationInList(state.nominations, action.payload)
      })
      .addCase(suspendNomination.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // deleteNomination
    builder
      .addCase(deleteNomination.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(deleteNomination.fulfilled, (state, action) => {
        state.actionLoading = false
        state.nominations = state.nominations.filter((n) => n.id !== action.payload)
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteNomination.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = nominationSlice.actions

// Selectors
export const selectNominations = (state) => state.nominations.nominations
export const selectNominationStats = (state) => state.nominations.stats
export const selectNominationTotal = (state) => state.nominations.total
export const selectNominationLoading = (state) => state.nominations.loading
export const selectNominationActionLoading = (state) => state.nominations.actionLoading

export default nominationSlice.reducer
