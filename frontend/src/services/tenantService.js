import api from './api';

const toTenantFormData = (data = {}) => {
  if (data instanceof FormData) return data

  // The backend create/update tenant endpoints use FastAPI Form(...)/File(...)
  // parameters, so they ALWAYS expect multipart/form-data. Convert the plain
  // object to FormData so the request is accepted.
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  return formData;
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
