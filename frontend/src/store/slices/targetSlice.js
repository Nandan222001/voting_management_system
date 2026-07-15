import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import targetService from '../../services/targetService';

export const fetchTargets = createAsyncThunk(
  'targets/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await targetService.getTargets();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch targets');
    }
  }
);

export const createTarget = createAsyncThunk(
  'targets/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await targetService.createTarget(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create target');
    }
  }
);

export const updateTarget = createAsyncThunk(
  'targets/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await targetService.updateTarget(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update target');
    }
  }
);

export const deleteTarget = createAsyncThunk(
  'targets/delete',
  async (id, { rejectWithValue }) => {
    try {
      await targetService.deleteTarget(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete target');
    }
  }
);

const targetSlice = createSlice({
  name: 'targets',
  initialState: {
    targets: [],
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTargets
      .addCase(fetchTargets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTargets.fulfilled, (state, action) => {
        state.loading = false;
        state.targets = action.payload.data || action.payload || [];
      })
      .addCase(fetchTargets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createTarget
      .addCase(createTarget.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createTarget.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newData = action.payload.data || action.payload;
        state.targets.push(newData);
      })
      .addCase(createTarget.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // updateTarget
      .addCase(updateTarget.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTarget.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedData = action.payload.data || action.payload;
        const index = state.targets.findIndex((t) => t.id === updatedData.id);
        if (index !== -1) {
          state.targets[index] = updatedData;
        }
      })
      .addCase(updateTarget.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // deleteTarget
      .addCase(deleteTarget.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteTarget.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.targets = state.targets.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTarget.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = targetSlice.actions;
export default targetSlice.reducer;
