import api from './api';

const sanitizeCandidateData = (data) => {
  const sanitized = { ...data };
  if (sanitized.committee_id === '') sanitized.committee_id = null;
  return sanitized;
};

const candidateService = {
  getAllCandidates: (params = {}) => api.get('/candidates', { params }),
  getCandidates: (params = {}) => api.get('/candidates', { params }),
  getCandidateById: (id) => api.get(`/candidates/${id}`),
  getCandidatesByElection: (electionId) =>
    api.get(`/candidates/election/${electionId}`),
  addCandidate: (data) => api.post('/candidates', sanitizeCandidateData(data)),
  createCandidate: (data) => api.post('/candidates', sanitizeCandidateData(data)),
  updateCandidate: (id, data) => api.put(`/candidates/${id}`, sanitizeCandidateData(data)),
  deleteCandidate: (id) => api.delete(`/candidates/${id}`),
  getElectionResults: (electionId) => api.get(`/votes/results/${electionId}`),
};

export default candidateService;
