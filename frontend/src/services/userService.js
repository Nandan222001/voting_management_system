import api from './api';

const userService = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  approveUser: (id) => api.post(`/users/${id}/approve`),
  blockUser: (id) => api.post(`/users/${id}/block`),
  unblockUser: (id) => api.post(`/users/${id}/unblock`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  getUserStats: () => api.get('/users/stats/overview'),
};

export default userService;
