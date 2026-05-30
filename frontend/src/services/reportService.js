import api from './api';

const reportService = {
  getDashboardOverview: () => api.get('/reports/dashboard'),
  getElectionReport: (id) => api.get(`/reports/elections/${id}`),
  getElectionResults: (electionId) => api.get(`/reports/elections/${electionId}/results`),
  getAuditLogs: (params = {}) => api.get('/reports/audit-logs', { params }),
  exportResults: (electionId, format = 'pdf') =>
    api.get(`/reports/elections/${electionId}/export`, {
      params: { format },
      responseType: 'blob',
    }),
  exportElectionReport: (id, format = 'pdf') =>
    api.get(`/reports/elections/${id}/export`, {
      params: { format },
      responseType: 'blob',
    }),
  getVotingTrends: (params = {}) => api.get('/reports/trends', { params }),
  getSystemStats: () => api.get('/reports/system-stats'),
};

export default reportService;
