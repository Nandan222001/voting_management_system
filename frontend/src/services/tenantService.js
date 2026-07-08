import api from './api';

const toTenantFormData = (data = {}) => {
  if (data instanceof FormData) return data
  
  // If no file, return data as is, or convert to FormData if the API strictly expects it.
  // Given the backend expects "body" fields for validation, let's try sending as plain JSON if not FormData.
  return data
}

const tenantService = {
  getAllTenants: (params = {}) => api.get('/tenants', { params }),
  getTenantById: (id) => api.get(`/tenants/${id}`),
  createTenant: (data) => api.post('/tenants', toTenantFormData(data)),
  updateTenant: (id, data) => api.put(`/tenants/${id}`, toTenantFormData(data)),
  suspendTenant: (id, reason) => api.post(`/tenants/${id}/suspend`, { reason }),
  activateTenant: (id) => api.post(`/tenants/${id}/activate`),
  deleteTenant: (id) => api.delete(`/tenants/${id}`),
  getPlatformStats: () => api.get('/tenants/platform-stats'),
  getTenantElections: (id) => api.get(`/tenants/${id}/elections`),
  getTenantUsers: (id) => api.get(`/tenants/${id}/users`),
};

export default tenantService;
