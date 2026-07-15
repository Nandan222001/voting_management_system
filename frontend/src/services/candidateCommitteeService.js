import api from './api';

const candidateCommitteeService = {
  getCommittees: () => api.get('/candidate-committees'),
  getCommitteeById: (id) => api.get(`/candidate-committees/${id}`),
  createCommittee: (data) => api.post('/candidate-committees', data),
  updateCommittee: (id, data) => api.put(`/candidate-committees/${id}`, data),
  deleteCommittee: (id) => api.delete(`/candidate-committees/${id}`),
};

export default candidateCommitteeService;
