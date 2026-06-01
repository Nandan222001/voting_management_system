import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentService from '../../services/paymentService';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getRevenueOverview(params);
      return response.data; // { status, message, data: { transactions, summary } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment records.'
      );
    }
  }
);

export const fetchPaymentSettings = createAsyncThunk(
  'payments/fetchPaymentSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentSettings();
      return response.data; // { status, message, data: { razorpay_key_id, razorpay_key_secret } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment settings.'
      );
    }
  }
);

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  payments: [],
  total: 0,
  stats: null,
  settings: {
    razorpay_key_id: '',
    razorpay_key_secret: '',
  },
  loading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Revenue
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const data = payload.data || payload;
        const { transactions, summary } = data;
        state.payments = transactions?.items || transactions || [];
        state.total = payload.pagination?.total || transactions?.total || state.payments.length;
        state.stats = summary || null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Settings
      .addCase(fetchPaymentSettings.fulfilled, (state, action) => {
        state.settings = action.payload.data || action.payload || { razorpay_key_id: '', razorpay_key_secret: '' };
      });
  },
});

export const { clearError } = paymentSlice.actions;

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectPaymentStats = (state) => state.payments.stats;
export const selectPaymentLoading = (state) => state.payments.loading;
export const selectPaymentSettings = (state) => state.payments.settings;

export default paymentSlice.reducer;
