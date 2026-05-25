import api from './api';

const tenantService = {
  getAllTenants: (params = {}) => api.get('/tenants', { params }),
  getTenantById: (id) => api.get(`/tenants/${id}`),
  createTenant: (data) => {
    if (data instanceof FormData) {
      return api.post('/tenants', data)
    }
    return api.post('/tenants', data)
  },
  updateTenant: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/tenants/${id}`, data)
    }
    return api.put(`/tenants/${id}`, data)
  },
  suspendTenant: (id, reason) => api.post(`/tenants/${id}/suspend`, { reason }),
  activateTenant: (id) => api.post(`/tenants/${id}/activate`),
  deleteTenant: (id) => api.delete(`/tenants/${id}`),
  getPlatformStats: () => api.get('/tenants/platform-stats'),
  getTenantElections: (id) => api.get(`/tenants/${id}/elections`),
  getTenantUsers: (id) => api.get(`/tenants/${id}/users`),
};

export default tenantService;
