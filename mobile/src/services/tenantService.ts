import api from './api';

export const tenantService = {
  getPublicTenants: async () => {
    const response = await api.get('/tenants/public');
    return response.data.data;
  },

  getCurrentTenant: async () => {
    const response = await api.get('/tenants/me');
    return response.data.data;
  },

  getPublicCommittees: async (tenantId: number) => {
    const response = await api.get(`/candidate-committees/public?tenant_id=${tenantId}`);
    return response.data.data;
  },

  getPublicPlans: async (tenantId: number) => {
    const response = await api.get(`/plans/public?tenant_id=${tenantId}`);
    return response.data.data.items;
  },

  getPublicTargets: async (parentId?: number, type?: string, tenantId?: number) => {
    let url = '/targets/public?';
    if (parentId) url += `parent_id=${parentId}&`;
    if (type) url += `target_type=${type}&`;
    if (tenantId) url += `tenant_id=${tenantId}&`;
    
    const response = await api.get(url);
    return response.data.data;
  },
};
