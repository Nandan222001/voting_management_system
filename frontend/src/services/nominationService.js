import api from './api';

const nominationService = {
  getNominations: (params) => api.get('/nominations/', { params }),

  getNominationsStats: () => api.get('/nominations/stats'),

  getNomination: (id) => api.get(`/nominations/${id}`),

  updateNomination: (id, data) => api.put(`/nominations/${id}`, data),

  approveNomination: (id) => api.post(`/nominations/${id}/approve`),

  rejectNomination: (id) => api.post(`/nominations/${id}/reject`),

  suspendNomination: (id) => api.post(`/nominations/${id}/suspend`),

  deleteNomination: (id) => api.delete(`/nominations/${id}`),
};

export default nominationService;
