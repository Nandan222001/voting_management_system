import api from './api';

export const tenantService = {
  getPublicTenants: async () => {
    const response = await api.get('/tenants/public');
    return response.data.data; // Data is wrapped in { data: [...] } from backend utils
  },
};
