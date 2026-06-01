import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import userService from '../../services/userService'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getUsers(params)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users.')
    }
  }
)

export const approveUser = createAsyncThunk(
  'users/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userService.approveUser(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve user.')
    }
  }
)

export const blockUser = createAsyncThunk(
  'users/block',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userService.blockUser(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to block user.')
    }
  }
)

export const unblockUser = createAsyncThunk(
  'users/unblock',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userService.unblockUser(id)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unblock user.')
    }
  }
)

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await userService.deleteUser(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user.')
    }
  }
)

export const fetchUserStats = createAsyncThunk(
  'users/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getUserStats()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user stats.')
    }
  }
)

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  users: [],
  stats: null,
  total: 0,
  page: 1,
  loading: false,
  actionLoading: false,
  error: null,
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function updateUserInList(users, updated) {
  const user = updated?.user || updated
  return users.map((u) =>
    (u._id || u.id) === (user._id || user.id) ? { ...u, ...user } : u
  )
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        // Extract data and pagination info from the envelope
        const payload = action.payload
        state.users = payload.data || []
        state.total = payload.pagination?.total || state.users.length
        state.page = payload.pagination?.page || 1
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // approveUser
    builder
      .addCase(approveUser.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.actionLoading = false
        state.users = updateUserInList(state.users, action.payload.data || action.payload)
      })
      .addCase(approveUser.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // blockUser
    builder
      .addCase(blockUser.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.actionLoading = false
        state.users = updateUserInList(state.users, action.payload.data || action.payload)
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // unblockUser
    builder
      .addCase(unblockUser.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.actionLoading = false
        state.users = updateUserInList(state.users, action.payload.data || action.payload)
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // deleteUser
    builder
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false
        state.users = state.users.filter(
          (u) => u._id !== action.payload && u.id !== action.payload
        )
        state.total = Math.max(0, state.total - 1)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload
      })

    // fetchUserStats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload.data || action.payload
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = userSlice.actions

// Selectors
export const selectUsers = (state) => state.users.users
export const selectUserStats = (state) => state.users.stats
export const selectUserTotal = (state) => state.users.total
export const selectUserLoading = (state) => state.users.loading
export const selectUserActionLoading = (state) => state.users.actionLoading

export default userSlice.reducer
