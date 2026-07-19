<<<<<<< HEAD
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import electionService from '../../services/electionService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchElections = createAsyncThunk(
  'elections/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await electionService.getElections(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch elections.')
    }
  }
)

export const fetchElectionById = createAsyncThunk(
  'elections/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await electionService.getElectionById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch election.')
    }
  }
)

export const createElection = createAsyncThunk(
  'elections/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await electionService.createElection(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create election.')
    }
  }
)

export const updateElection = createAsyncThunk(
  'elections/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await electionService.updateElection(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update election.')
    }
  }
)

export const deleteElection = createAsyncThunk(
  'elections/delete',
  async (id, { rejectWithValue }) => {
    try {
      await electionService.deleteElection(id)
      return id
    } catch (error) {
      const data = error.response?.data
      return rejectWithValue(data?.detail || data?.message || 'Failed to delete election.')
    }
  }
)

export const activateElection = createAsyncThunk(
  'elections/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await electionService.activateElection(id)
      return response.data
    } catch (error) {
      const errData = error.response?.data
      return rejectWithValue(errData?.message || errData?.detail || 'Failed to activate election.')
    }
  }
)

export const closeElection = createAsyncThunk(
  'elections/close',
  async (id, { rejectWithValue }) => {
    try {
      const response = await electionService.closeElection(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close election.')
    }
  }
)

export const fetchElectionStats = createAsyncThunk(
  'elections/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await electionService.getElectionStats()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch election stats.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  elections: [],
  currentElection: null,
  stats: null,
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  actionLoading: false,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function updateElectionInList(elections, updated) {
  const election = updated?.election || updated
  return elections.map((e) =>
    e._id === election._id || e.id === election.id ? { ...e, ...election } : e
  )
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const electionSlice = createSlice({
  name: 'elections',
  initialState,
  reducers: {
    clearCurrentElection(state) {
      state.currentElection = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchElections
    builder
      .addCase(fetchElections.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchElections.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.elections = payload.data || payload.elections || payload
        state.total = payload.pagination?.total || payload.total || state.elections.length
        state.page = payload.pagination?.page || payload.page || 1
      })
      .addCase(fetchElections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchElectionById
    builder
      .addCase(fetchElectionById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchElectionById.fulfilled, (state, action) => {
        state.loading = false
        state.currentElection = action.payload.data || action.payload.election || action.payload
      })
      .addCase(fetchElectionById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // createElection
    builder
      .addCase(createElection.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(createElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const election = action.payload.data || action.payload.election || action.payload
        state.elections.unshift(election)
        state.total += 1
      })
      .addCase(createElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // updateElection
    builder
      .addCase(updateElection.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(updateElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.elections = updateElectionInList(state.elections, updated)
        const electionData = updated?.election || updated
        if (state.currentElection) {
          state.currentElection = { ...state.currentElection, ...electionData }
        }
      })
      .addCase(updateElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // deleteElection
    builder
      .addCase(deleteElection.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(deleteElection.fulfilled, (state, action) => {
        state.actionLoading = false
        state.elections = state.elections.filter(
          (e) => e._id !== action.payload && e.id !== action.payload
        )
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // activateElection
    builder
      .addCase(activateElection.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(activateElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.elections = updateElectionInList(state.elections, updated)
        const electionData = updated?.election || updated
        if (state.currentElection) {
          state.currentElection = { ...state.currentElection, ...electionData }
        }
      })
      .addCase(activateElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // closeElection
    builder
      .addCase(closeElection.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(closeElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.elections = updateElectionInList(state.elections, updated)
        const electionData = updated?.election || updated
        if (state.currentElection) {
          state.currentElection = { ...state.currentElection, ...electionData }
        }
      })
      .addCase(closeElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // fetchElectionStats
    builder
      .addCase(fetchElectionStats.fulfilled, (state, action) => {
        state.stats = action.payload.data || action.payload
      })
  },
})

export const { clearCurrentElection, clearError } = electionSlice.actions

// Selectors
export const selectElections = (state) => state.elections.elections
export const selectCurrentElection = (state) => state.elections.currentElection
export const selectElectionTotal = (state) => state.elections.total
export const selectElectionLoading = (state) => state.elections.loading
export const selectElectionActionLoading = (state) => state.elections.actionLoading
export const selectElectionStats = (state) => state.elections.stats

export default electionSlice.reducer
=======
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import electionService from '../../services/electionService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchElections = createAsyncThunk(
  'elections/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await electionService.getElections(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch elections.')
    }
  }
)

export const fetchElectionById = createAsyncThunk(
  'elections/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await electionService.getElectionById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch election.')
    }
  }
)

export const createElection = createAsyncThunk(
  'elections/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await electionService.createElection(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create election.')
    }
  }
)

export const updateElection = createAsyncThunk(
  'elections/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await electionService.updateElection(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update election.')
    }
  }
)

export const deleteElection = createAsyncThunk(
  'elections/delete',
  async (id, { rejectWithValue }) => {
    try {
      await electionService.deleteElection(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete election.')
    }
  }
)

export const activateElection = createAsyncThunk(
  'elections/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await electionService.activateElection(id)
      return response.data
    } catch (error) {
      const errData = error.response?.data
      return rejectWithValue(errData?.message || errData?.detail || 'Failed to activate election.')
    }
  }
)

export const closeElection = createAsyncThunk(
  'elections/close',
  async (id, { rejectWithValue }) => {
    try {
      const response = await electionService.closeElection(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close election.')
    }
  }
)

export const fetchElectionStats = createAsyncThunk(
  'elections/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await electionService.getElectionStats()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch election stats.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  elections: [],
  currentElection: null,
  stats: null,
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
  actionLoading: false,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function updateElectionInList(elections, updated) {
  const election = updated?.election || updated
  return elections.map((e) =>
    e._id === election._id || e.id === election.id ? { ...e, ...election } : e
  )
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const electionSlice = createSlice({
  name: 'elections',
  initialState,
  reducers: {
    clearCurrentElection(state) {
      state.currentElection = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchElections
    builder
      .addCase(fetchElections.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchElections.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        state.elections = payload.data || payload.elections || payload
        state.total = payload.pagination?.total || payload.total || state.elections.length
        state.page = payload.pagination?.page || payload.page || 1
      })
      .addCase(fetchElections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchElectionById
    builder
      .addCase(fetchElectionById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchElectionById.fulfilled, (state, action) => {
        state.loading = false
        state.currentElection = action.payload.data || action.payload.election || action.payload
      })
      .addCase(fetchElectionById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // createElection
    builder
      .addCase(createElection.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(createElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const election = action.payload.data || action.payload.election || action.payload
        state.elections.unshift(election)
        state.total += 1
      })
      .addCase(createElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // updateElection
    builder
      .addCase(updateElection.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(updateElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.elections = updateElectionInList(state.elections, updated)
        const electionData = updated?.election || updated
        if (state.currentElection) {
          state.currentElection = { ...state.currentElection, ...electionData }
        }
      })
      .addCase(updateElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // deleteElection
    builder
      .addCase(deleteElection.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(deleteElection.fulfilled, (state, action) => {
        state.actionLoading = false
        state.elections = state.elections.filter(
          (e) => e._id !== action.payload && e.id !== action.payload
        )
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // activateElection
    builder
      .addCase(activateElection.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(activateElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.elections = updateElectionInList(state.elections, updated)
        const electionData = updated?.election || updated
        if (state.currentElection) {
          state.currentElection = { ...state.currentElection, ...electionData }
        }
      })
      .addCase(activateElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // closeElection
    builder
      .addCase(closeElection.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(closeElection.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.elections = updateElectionInList(state.elections, updated)
        const electionData = updated?.election || updated
        if (state.currentElection) {
          state.currentElection = { ...state.currentElection, ...electionData }
        }
      })
      .addCase(closeElection.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // fetchElectionStats
    builder
      .addCase(fetchElectionStats.fulfilled, (state, action) => {
        state.stats = action.payload.data || action.payload
      })
  },
})

export const { clearCurrentElection, clearError } = electionSlice.actions

// Selectors
export const selectElections = (state) => state.elections.elections
export const selectCurrentElection = (state) => state.elections.currentElection
export const selectElectionTotal = (state) => state.elections.total
export const selectElectionLoading = (state) => state.elections.loading
export const selectElectionActionLoading = (state) => state.elections.actionLoading
export const selectElectionStats = (state) => state.elections.stats

export default electionSlice.reducer
>>>>>>> fa346d3c9268015db5f8ecd6de67a3eff14d52ab
