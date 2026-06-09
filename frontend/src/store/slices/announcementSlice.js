import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import announcementService from '../../services/announcementService';

const errorMessage = (error, fallback) => error.response?.data?.message || error.response?.data?.detail || fallback;

export const fetchAnnouncements = createAsyncThunk('announcements/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await announcementService.getAnnouncements(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to fetch announcements.'));
  }
});

export const saveAnnouncement = createAsyncThunk('announcements/save', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = id
      ? await announcementService.updateAnnouncement(id, data)
      : await announcementService.createAnnouncement(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to save announcement.'));
  }
});

export const deleteAnnouncement = createAsyncThunk('announcements/delete', async (id, { rejectWithValue }) => {
  try {
    await announcementService.deleteAnnouncement(id);
    return id;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to delete announcement.'));
  }
});

export const publishAnnouncement = createAsyncThunk('announcements/publish', async (id, { rejectWithValue }) => {
  try {
    const response = await announcementService.publishAnnouncement(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to publish announcement.'));
  }
});

export const unpublishAnnouncement = createAsyncThunk('announcements/unpublish', async (id, { rejectWithValue }) => {
  try {
    const response = await announcementService.unpublishAnnouncement(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Failed to unpublish announcement.'));
  }
});

const initialState = {
  items: [],
  total: 0,
  page: 1,
  loading: false,
  actionLoading: false,
  error: null,
};

function unwrap(payload) {
  return payload?.data || payload;
}

function upsert(items, payload) {
  const announcement = unwrap(payload);
  const exists = items.some((item) => item.id === announcement.id);
  if (exists) {
    return items.map((item) => (item.id === announcement.id ? { ...item, ...announcement } : item));
  }
  return [announcement, ...items];
}

const announcementSlice = createSlice({
  name: 'announcements',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        const data = unwrap(action.payload);
        state.items = data.items || [];
        state.total = data.total || state.items.length;
        state.page = data.page || 1;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveAnnouncement.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(saveAnnouncement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = upsert(state.items, action.payload);
      })
      .addCase(saveAnnouncement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteAnnouncement.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(publishAnnouncement.fulfilled, (state, action) => {
        state.items = upsert(state.items, action.payload);
      })
      .addCase(unpublishAnnouncement.fulfilled, (state, action) => {
        state.items = upsert(state.items, action.payload);
      });
  },
});

export const selectAnnouncements = (state) => state.announcements.items;
export const selectAnnouncementTotal = (state) => state.announcements.total;
export const selectAnnouncementLoading = (state) => state.announcements.loading;
export const selectAnnouncementActionLoading = (state) => state.announcements.actionLoading;

export default announcementSlice.reducer;
