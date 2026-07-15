import api from './api';

const sanitizeCandidateData = (data) => {
  const sanitized = { ...data };
  if (sanitized.committee_id === '') sanitized.committee_id = null;
  if (sanitized.target_id === '') sanitized.target_id = null;
  return sanitized;
};

const toCandidateFormData = (data = {}) => {
  if (data instanceof FormData) return data;
  const sanitized = sanitizeCandidateData(data);
  const form = new FormData();
  ['full_name', 'symbol', 'bio', 'election_id', 'committee_id', 'target_id'].forEach((key) => {
    const value = sanitized[key];
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value));
    }
  });
  return form;
};

const candidateService = {
  getAllCandidates: (params = {}) => api.get('/candidates', { params }),
  getCandidates: (params = {}) => api.get('/candidates', { params }),
  getCandidateById: (id) => api.get(`/candidates/${id}`),
  getCandidatesByElection: (electionId) =>
    api.get(`/candidates/election/${electionId}`),
  addCandidate: (data) => api.post('/candidates', toCandidateFormData(data)),
  createCandidate: (data) => api.post('/candidates', toCandidateFormData(data)),
  updateCandidate: (id, data) => api.put(`/candidates/${id}`, toCandidateFormData(data)),
  deleteCandidate: (id) => api.delete(`/candidates/${id}`),
  getElectionResults: (electionId) => api.get(`/votes/results/${electionId}`),
};

export default candidateService;
