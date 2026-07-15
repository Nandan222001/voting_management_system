// ─── Election Status Enum ─────────────────────────────────────────────────────
export const ELECTION_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  COMPLETED: 'completed',
}

// ─── User Roles Enum ──────────────────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  VOTER: 'voter',
  VIEWER: 'viewer',
}

// ─── User Status Enum ─────────────────────────────────────────────────────────
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  BLOCKED: 'blocked',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// ─── API Endpoints ────────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  VERIFY_OTP: '/auth/verify-otp',
  REFRESH: '/auth/refresh',

  // Elections
  ELECTIONS: '/elections',
  ELECTION_BY_ID: (id) => `/elections/${id}`,
  ACTIVATE_ELECTION: (id) => `/elections/${id}/activate`,
  CLOSE_ELECTION: (id) => `/elections/${id}/close`,
  ELECTION_STATS: '/elections/stats',
  ELECTION_RESULTS: (id) => `/elections/${id}/results`,

  // Candidates
  CANDIDATES: '/candidates',
  CANDIDATE_BY_ID: (id) => `/candidates/${id}`,

  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  APPROVE_USER: (id) => `/users/${id}/approve`,
  BLOCK_USER: (id) => `/users/${id}/block`,
  UNBLOCK_USER: (id) => `/users/${id}/unblock`,
  USER_STATS: '/users/stats',

  // Reports
  DASHBOARD: '/reports/dashboard',
  ELECTION_REPORT: (id) => `/reports/elections/${id}`,
  AUDIT_LOGS: '/audit-logs',
}

// ─── Date Formats ─────────────────────────────────────────────────────────────
export const DATE_FORMAT = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  ISO: "yyyy-MM-dd'T'HH:mm",
  FULL: 'EEEE, MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  TIME: 'HH:mm',
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
}

// ─── Audit Actions ────────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_ELECTION: 'CREATE_ELECTION',
  UPDATE_ELECTION: 'UPDATE_ELECTION',
  DELETE_ELECTION: 'DELETE_ELECTION',
  ACTIVATE_ELECTION: 'ACTIVATE_ELECTION',
  CLOSE_ELECTION: 'CLOSE_ELECTION',
  VOTE_CAST: 'VOTE_CAST',
  USER_APPROVED: 'USER_APPROVED',
  USER_BLOCKED: 'USER_BLOCKED',
  CANDIDATE_ADDED: 'CANDIDATE_ADDED',
  CANDIDATE_REMOVED: 'CANDIDATE_REMOVED',
}
