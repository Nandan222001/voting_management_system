import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import candidateService from '../../services/candidateService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchCandidatesByElection = createAsyncThunk(
  'candidates/fetchByElection',
  async (electionId, { rejectWithValue }) => {
    try {
      const response = await candidateService.getCandidatesByElection(electionId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch candidates.')
    }
  }
)

export const fetchAllCandidates = createAsyncThunk(
  'candidates/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await candidateService.getAllCandidates(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch candidates.')
    }
  }
)

export const addCandidate = createAsyncThunk(
  'candidates/add',
  async (data, { rejectWithValue }) => {
    try {
      const response = await candidateService.addCandidate(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add candidate.')
    }
  }
)

export const updateCandidate = createAsyncThunk(
  'candidates/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await candidateService.updateCandidate(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update candidate.')
    }
  }
)

export const deleteCandidate = createAsyncThunk(
  'candidates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await candidateService.deleteCandidate(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete candidate.')
    }
  }
)

export const fetchElectionResults = createAsyncThunk(
  'candidates/fetchResults',
  async (electionId, { rejectWithValue }) => {
    try {
      const response = await candidateService.getElectionResults(electionId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch results.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  candidates: [],
  results: [],
  total: 0,
  loading: false,
  actionLoading: false,
  error: null,
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
    clearCandidates(state) {
      state.candidates = []
      state.results = []
    },
  },
  extraReducers: (builder) => {
    // fetchCandidatesByElection
    builder
      .addCase(fetchCandidatesByElection.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCandidatesByElection.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        const data = payload.data || payload
        state.candidates = data.candidates || (Array.isArray(data) ? data : [])
        state.total = payload.pagination?.total || data.total || state.candidates.length
      })
      .addCase(fetchCandidatesByElection.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchAllCandidates
    builder
      .addCase(fetchAllCandidates.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllCandidates.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        const data = payload.data || payload
        state.candidates = data.candidates || (Array.isArray(data) ? data : [])
        state.total = payload.pagination?.total || data.total || state.candidates.length
      })
      .addCase(fetchAllCandidates.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // addCandidate
    builder
      .addCase(addCandidate.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(addCandidate.fulfilled, (state, action) => {
        state.actionLoading = false
        const candidate = action.payload.data || action.payload.candidate || action.payload
        state.candidates.push(candidate)
        state.total += 1
      })
      .addCase(addCandidate.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // updateCandidate
    builder
      .addCase(updateCandidate.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(updateCandidate.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload.candidate || action.payload
        state.candidates = state.candidates.map((c) =>
          (c._id || c.id) === (updated._id || updated.id) ? { ...c, ...updated } : c
        )
      })
      .addCase(updateCandidate.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // deleteCandidate
    builder
      .addCase(deleteCandidate.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(deleteCandidate.fulfilled, (state, action) => {
        state.actionLoading = false
        state.candidates = state.candidates.filter(
          (c) => c._id !== action.payload && c.id !== action.payload
        )
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteCandidate.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // fetchElectionResults
    builder
      .addCase(fetchElectionResults.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchElectionResults.fulfilled, (state, action) => {
        state.loading = false
        // Normalize: API returns { total_votes, results: [...] }, pages expect { total_votes, candidates: [...] }
        const payload = action.payload.data || action.payload
        state.results = {
          ...payload,
          candidates: payload.results || payload.candidates || []
        }
      })
      .addCase(fetchElectionResults.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearCandidates } = candidateSlice.actions

// Selectors
export const selectCandidates = (state) => state.candidates.candidates
export const selectElectionResults = (state) => state.candidates.results
export const selectCandidateLoading = (state) => state.candidates.loading
export const selectCandidateActionLoading = (state) => state.candidates.actionLoading

export default candidateSlice.reducer
