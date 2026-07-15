import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import planService from '../../services/planService';

export const fetchPlans = createAsyncThunk(
  'plans/fetchPlans',
  async (params, { rejectWithValue }) => {
    try {
      const response = await planService.getPlans(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
    }
  }
);

export const addPlan = createAsyncThunk(
  'plans/addPlan',
  async (data, { rejectWithValue }) => {
    try {
      const response = await planService.createPlan(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create plan');
    }
  }
);

export const updatePlan = createAsyncThunk(
  'plans/updatePlan',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await planService.updatePlan(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update plan');
    }
  }
);

export const deletePlan = createAsyncThunk(
  'plans/deletePlan',
  async (id, { rejectWithValue }) => {
    try {
      await planService.deletePlan(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete plan');
    }
  }
);

const planSlice = createSlice({
  name: 'plans',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearPlanError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const data = payload.data || payload;
        state.items = data.items || (Array.isArray(data) ? data : []);
        state.total = payload.pagination?.total || data.total || state.items.length;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addPlan.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addPlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newData = action.payload.data || action.payload;
        state.items.push(newData);
        state.total += 1;
      })
      .addCase(addPlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updatePlan.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updatePlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedData = action.payload.data || action.payload;
        const index = state.items.findIndex((p) => p.id === updatedData.id);
        if (index !== -1) {
          state.items[index] = updatedData;
        }
      })
      .addCase(updatePlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deletePlan.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((p) => p.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deletePlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPlanError } = planSlice.actions;
export default planSlice.reducer;
