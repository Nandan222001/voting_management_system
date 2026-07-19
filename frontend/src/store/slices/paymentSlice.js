<<<<<<< HEAD
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

export const fetchMyPaymentHistory = createAsyncThunk(
  'payments/fetchMyPaymentHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getMyHistory(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment history.'
      );
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'payments/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment analytics.'
      );
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payments/refundPayment',
  async ({ paymentId, data }, { rejectWithValue }) => {
    try {
      const response = await paymentService.refundPayment(paymentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to process refund.'
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
  myHistory: [],
  myHistoryTotal: 0,
  analytics: null,
  loading: false,
  analyticsLoading: false,
  historyLoading: false,
  refundLoading: false,
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
      })
      // Fetch My History
      .addCase(fetchMyPaymentHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchMyPaymentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        const data = action.payload?.data || action.payload || {};
        state.myHistory = data.items || [];
        state.myHistoryTotal = data.total || 0;
      })
      .addCase(fetchMyPaymentHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.analyticsLoading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload?.data || action.payload || null;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload;
      })
      // Refund Payment
      .addCase(refundPayment.pending, (state) => {
        state.refundLoading = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.refundLoading = false;
        // Update the payment in the list
        const updated = action.payload?.data || action.payload;
        if (updated && updated.id) {
          state.payments = state.payments.map((p) =>
            p.id === updated.id ? { ...p, ...updated } : p
          );
        }
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.refundLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = paymentSlice.actions;

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectPaymentStats = (state) => state.payments.stats;
export const selectPaymentLoading = (state) => state.payments.loading;
export const selectPaymentSettings = (state) => state.payments.settings;
export const selectMyHistory = (state) => state.payments.myHistory;
export const selectAnalytics = (state) => state.payments.analytics;
export const selectAnalyticsLoading = (state) => state.payments.analyticsLoading;
export const selectRefundLoading = (state) => state.payments.refundLoading;

export default paymentSlice.reducer;
=======
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

export const fetchMyPaymentHistory = createAsyncThunk(
  'payments/fetchMyPaymentHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await paymentService.getMyHistory(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment history.'
      );
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'payments/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentService.getAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment analytics.'
      );
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payments/refundPayment',
  async ({ paymentId, data }, { rejectWithValue }) => {
    try {
      const response = await paymentService.refundPayment(paymentId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to process refund.'
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
  myHistory: [],
  myHistoryTotal: 0,
  analytics: null,
  loading: false,
  analyticsLoading: false,
  historyLoading: false,
  refundLoading: false,
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
      })
      // Fetch My History
      .addCase(fetchMyPaymentHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchMyPaymentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        const data = action.payload?.data || action.payload || {};
        state.myHistory = data.items || [];
        state.myHistoryTotal = data.total || 0;
      })
      .addCase(fetchMyPaymentHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.analyticsLoading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload?.data || action.payload || null;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload;
      })
      // Refund Payment
      .addCase(refundPayment.pending, (state) => {
        state.refundLoading = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.refundLoading = false;
        // Update the payment in the list
        const updated = action.payload?.data || action.payload;
        if (updated && updated.id) {
          state.payments = state.payments.map((p) =>
            p.id === updated.id ? { ...p, ...updated } : p
          );
        }
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.refundLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = paymentSlice.actions;

// Selectors
export const selectPayments = (state) => state.payments.payments;
export const selectPaymentStats = (state) => state.payments.stats;
export const selectPaymentLoading = (state) => state.payments.loading;
export const selectPaymentSettings = (state) => state.payments.settings;
export const selectMyHistory = (state) => state.payments.myHistory;
export const selectAnalytics = (state) => state.payments.analytics;
export const selectAnalyticsLoading = (state) => state.payments.analyticsLoading;
export const selectRefundLoading = (state) => state.payments.refundLoading;

export default paymentSlice.reducer;
>>>>>>> fa346d3c9268015db5f8ecd6de67a3eff14d52ab
