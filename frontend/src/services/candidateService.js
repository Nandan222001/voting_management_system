import api from './api';

const candidateService = {
  getAllCandidates: (params = {}) => api.get('/candidates', { params }),
  getCandidates: (params = {}) => api.get('/candidates', { params }),
  getCandidateById: (id) => api.get(`/candidates/${id}`),
  getCandidatesByElection: (electionId) =>
    api.get('/candidates', { params: { election_id: electionId } }),
  addCandidate: (data) => api.post('/candidates', data),
  createCandidate: (data) => api.post('/candidates', data),
  updateCandidate: (id, data) => api.put(`/candidates/${id}`, data),
  deleteCandidate: (id) => api.delete(`/candidates/${id}`),
  getElectionResults: (electionId) => api.get(`/elections/${electionId}/results`),
};

export default candidateService;
