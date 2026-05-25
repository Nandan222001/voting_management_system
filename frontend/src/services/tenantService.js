import api from './api';

const toTenantFormData = (data = {}) => {
  if (data instanceof FormData) return data
  const form = new FormData()
  const fields = ['name', 'slug', 'contact_email', 'plan', 'admin_full_name', 'admin_email', 'admin_password']
  fields.forEach((key) => {
    const value = data[key]
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, String(value))
    }
  })
  return form
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
