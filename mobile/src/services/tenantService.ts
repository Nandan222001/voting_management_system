import api, { setTenantID, getTenantID, clearTenantID } from './api';

export const tenantService = {
  // ─── Tenant selection ─────────────────────────────────────────────────────
  // Call this when the user picks a tenant during onboarding / registration.
  // Persists the ID so every subsequent request carries X-Tenant-ID.

  selectTenant: async (tenantId: string): Promise<void> => {
    await setTenantID(tenantId);
  },

  getStoredTenantID: getTenantID,
  clearStoredTenant: clearTenantID,

  // ─── Public endpoints ─────────────────────────────────────────────────────

  // Returns all active tenants for the initial selection screen (no auth, no header needed).
  getPublicTenants: async () => {
    const response = await api.get('/tenants/public');
    return response.data?.data || [];
  },

  // Returns the branding/config for the current tenant using X-Tenant-ID header.
  getCurrentTenant: async () => {
    const tenantId = await getTenantID();
    if (!tenantId) return null;

    const response = await api.get('/tenants/me');
    return response.data?.data || null;
  },

  // Public data endpoints — tenant is resolved from X-Tenant-ID header,
  // no query parameter needed from the mobile client.

  getPublicCommittees: async () => {
    const tenantId = (await getTenantID()) || process.env.EXPO_PUBLIC_TENANT_ID;
    const config: any = {};
    if (tenantId && String(tenantId) !== 'undefined') {
      config.headers = { 'X-Tenant-ID': String(tenantId) };
    }
    const response = await api.get('/candidate-committees/public', config);
    return response.data?.data || [];
  },

  getPublicPlans: async () => {
    const tenantId = (await getTenantID()) || process.env.EXPO_PUBLIC_TENANT_ID;
    const config: any = {};
    if (tenantId && String(tenantId) !== 'undefined') {
      config.headers = { 'X-Tenant-ID': String(tenantId) };
    }
    const response = await api.get('/plans/public', config);
    const data = response.data?.data;
    return data?.items ?? data ?? [];
  },

  getPublicTargets: async (parentId?: number, type?: string) => {
    const tenantId = (await getTenantID()) || process.env.EXPO_PUBLIC_TENANT_ID;
    const params: Record<string, string> = {};
    if (parentId !== undefined) params.parent_id = String(parentId);
    if (type) params.target_type = type;
    
    const config: any = { params };
    if (tenantId && String(tenantId) !== 'undefined') {
      config.headers = { 'X-Tenant-ID': String(tenantId) };
    }
    const response = await api.get('/targets/public', config);
    return response.data?.data || [];
  },
};
