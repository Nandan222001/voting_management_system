import api from './api';

const tenantService = {
  getAllTenants: (params = {}) => api.get('/v1/tenants', { params }),
  getTenantById: (id) => api.get(`/v1/tenants/${id}`),
  createTenant: (data) => api.post('/v1/tenants', data),
  updateTenant: (id, data) => api.put(`/v1/tenants/${id}`, data),
  suspendTenant: (id, reason) => api.post(`/v1/tenants/${id}/suspend`, { reason }),
  activateTenant: (id) => api.post(`/v1/tenants/${id}/activate`),
  deleteTenant: (id) => api.delete(`/v1/tenants/${id}`),
  getPlatformStats: () => api.get('/v1/tenants/platform-stats'),
  getTenantElections: (id) => api.get(`/v1/tenants/${id}/elections`),
  getTenantUsers: (id) => api.get(`/v1/tenants/${id}/users`),
};

export default tenantService;
