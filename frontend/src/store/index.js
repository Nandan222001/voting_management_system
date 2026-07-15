import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import electionReducer from './slices/electionSlice'
import candidateReducer from './slices/candidateSlice'
import userReducer from './slices/userSlice'
import voteReducer from './slices/voteSlice'
import tenantReducer from './slices/tenantSlice'
import candidateCommitteeReducer from './slices/candidateCommitteeSlice'
import targetReducer from './slices/targetSlice'
import paymentReducer from './slices/paymentSlice'
import planReducer from './slices/planSlice'
import nominationReducer from './slices/nominationSlice'
import announcementReducer from './slices/announcementSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    elections: electionReducer,
    candidates: candidateReducer,
    users: userReducer,
    votes: voteReducer,
    tenants: tenantReducer,
    candidateCommittees: candidateCommitteeReducer,
    targets: targetReducer,
    payments: paymentReducer,
    plans: planReducer,
    nominations: nominationReducer,
    announcements: announcementReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export default store
