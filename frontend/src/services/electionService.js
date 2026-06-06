import api from './api';

const electionService = {
  getElections: (params = {}) => api.get('/elections', { params }),
  getElectionById: (id) => api.get(`/elections/${id}`),
  createElection: (data) => {
    // If data contains payload and params (for SuperAdmin tenant_id)
    if (data.payload && data.params) {
      return api.post('/elections', data.payload, { params: data.params });
    }
    return api.post('/elections', data);
  },
  updateElection: (id, data) => api.put(`/elections/${id}`, data),
  deleteElection: (id) => api.delete(`/elections/${id}`),
  activateElection: (id) => api.patch(`/elections/${id}/activate`),
  closeElection: (id) => api.patch(`/elections/${id}/close`),
  getElectionStats: () => api.get('/elections/stats/overview'),
  getElectionResults: (id) => api.get(`/votes/results/${id}`),
};

export default electionService;
