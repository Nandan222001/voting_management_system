import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import tenantService from '../../services/tenantService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchTenants = createAsyncThunk(
  'tenants/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await tenantService.getAllTenants(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tenants.')
    }
  }
)

export const fetchTenantById = createAsyncThunk(
  'tenants/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tenantService.getTenantById(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tenant.')
    }
  }
)

export const createTenant = createAsyncThunk(
  'tenants/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await tenantService.createTenant(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tenant.')
    }
  }
)

export const updateTenant = createAsyncThunk(
  'tenants/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tenantService.updateTenant(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tenant.')
    }
  }
)

export const suspendTenant = createAsyncThunk(
  'tenants/suspend',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await tenantService.suspendTenant(id, reason)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to suspend tenant.')
    }
  }
)

export const activateTenant = createAsyncThunk(
  'tenants/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tenantService.activateTenant(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate tenant.')
    }
  }
)

export const deleteTenant = createAsyncThunk(
  'tenants/delete',
  async (id, { rejectWithValue }) => {
    try {
      await tenantService.deleteTenant(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tenant.')
    }
  }
)

export const fetchPlatformStats = createAsyncThunk(
  'tenants/fetchPlatformStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tenantService.getPlatformStats()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch platform stats.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  tenants: [],
  currentTenant: null,
  total: 0,
  platformStats: null,
  loading: false,
  error: null,
  actionLoading: false,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function updateTenantInList(tenants, updated) {
  return tenants.map((t) => {
    const sameId = (t.id != null && t.id === updated.id) || (t._id != null && t._id === updated._id)
    return sameId ? { ...t, ...updated } : t
  })
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const tenantSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    clearCurrentTenant(state) {
      state.currentTenant = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchTenants
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        const data = payload.data || payload
        state.tenants = data.tenants || (Array.isArray(data) ? data : [])
        state.total = payload.pagination?.total || data.total || state.tenants.length
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchTenantById
    builder
      .addCase(fetchTenantById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTenantById.fulfilled, (state, action) => {
        state.loading = false
        state.currentTenant = action.payload.data || action.payload
      })
      .addCase(fetchTenantById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // createTenant
    builder
      .addCase(createTenant.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.actionLoading = false
        const newTenant = action.payload.data || action.payload
        state.tenants.unshift(newTenant)
        state.total += 1
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // updateTenant
    builder
      .addCase(updateTenant.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.tenants = updateTenantInList(state.tenants, updated)
        if (state.currentTenant) {
          state.currentTenant = { ...state.currentTenant, ...updated }
        }
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // suspendTenant
    builder
      .addCase(suspendTenant.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(suspendTenant.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.tenants = updateTenantInList(state.tenants, updated)
        if (state.currentTenant) {
          state.currentTenant = { ...state.currentTenant, ...updated }
        }
      })
      .addCase(suspendTenant.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // activateTenant
    builder
      .addCase(activateTenant.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(activateTenant.fulfilled, (state, action) => {
        state.actionLoading = false
        const updated = action.payload.data || action.payload
        state.tenants = updateTenantInList(state.tenants, updated)
        if (state.currentTenant) {
          state.currentTenant = { ...state.currentTenant, ...updated }
        }
      })
      .addCase(activateTenant.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // deleteTenant
    builder
      .addCase(deleteTenant.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.actionLoading = false
        state.tenants = state.tenants.filter(
          (t) => t._id !== action.payload && t.id !== action.payload
        )
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteTenant.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // fetchPlatformStats
    builder
      .addCase(fetchPlatformStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.loading = false
        state.platformStats = action.payload.data || action.payload
      })
      .addCase(fetchPlatformStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearCurrentTenant, clearError } = tenantSlice.actions

// Selectors
export const selectTenants = (state) => state.tenants.tenants
export const selectCurrentTenant = (state) => state.tenants.currentTenant
export const selectTenantTotal = (state) => state.tenants.total
export const selectPlatformStats = (state) => state.tenants.platformStats
export const selectTenantLoading = (state) => state.tenants.loading
export const selectTenantActionLoading = (state) => state.tenants.actionLoading
export const selectTenantError = (state) => state.tenants.error

export default tenantSlice.reducer
