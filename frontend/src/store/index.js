import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import electionReducer from './slices/electionSlice'
import candidateReducer from './slices/candidateSlice'
import userReducer from './slices/userSlice'
import voteReducer from './slices/voteSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    elections: electionReducer,
    candidates: candidateReducer,
    users: userReducer,
    votes: voteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export default store
