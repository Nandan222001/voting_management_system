import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import candidateCommitteeService from '../../services/candidateCommitteeService';

export const fetchCandidateCommittees = createAsyncThunk(
  'candidateCommittees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await candidateCommitteeService.getCommittees();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch committees');
    }
  }
);

export const createCandidateCommittee = createAsyncThunk(
  'candidateCommittees/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await candidateCommitteeService.createCommittee(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create committee');
    }
  }
);

export const updateCandidateCommittee = createAsyncThunk(
  'candidateCommittees/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await candidateCommitteeService.updateCommittee(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update committee');
    }
  }
);

export const deleteCandidateCommittee = createAsyncThunk(
  'candidateCommittees/delete',
  async (id, { rejectWithValue }) => {
    try {
      await candidateCommitteeService.deleteCommittee(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete committee');
    }
  }
);

const candidateCommitteeSlice = createSlice({
  name: 'candidateCommittees',
  initialState: {
    committees: [],
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
      // fetchCandidateCommittees
      .addCase(fetchCandidateCommittees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCandidateCommittees.fulfilled, (state, action) => {
        state.loading = false;
        state.committees = action.payload.data || action.payload || [];
      })
      .addCase(fetchCandidateCommittees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createCandidateCommittee
      .addCase(createCandidateCommittee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createCandidateCommittee.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newData = action.payload.data || action.payload;
        state.committees.push(newData);
      })
      .addCase(createCandidateCommittee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // updateCandidateCommittee
      .addCase(updateCandidateCommittee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCandidateCommittee.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedData = action.payload.data || action.payload;
        const index = state.committees.findIndex((c) => c.id === updatedData.id);
        if (index !== -1) {
          state.committees[index] = updatedData;
        }
      })
      .addCase(updateCandidateCommittee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // deleteCandidateCommittee
      .addCase(deleteCandidateCommittee.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteCandidateCommittee.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.committees = state.committees.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCandidateCommittee.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = candidateCommitteeSlice.actions;
export default candidateCommitteeSlice.reducer;
