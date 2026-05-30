import api from './api';

const targetService = {
  getTargets: () => api.get('/targets/'),
  getTargetById: (id) => api.get(`/targets/${id}/`),
  createTarget: (data) => api.post('/targets/', data),
  updateTarget: (id, data) => api.put(`/targets/${id}/`, data),
  deleteTarget: (id) => api.delete(`/targets/${id}/`),
};

export default targetService;
