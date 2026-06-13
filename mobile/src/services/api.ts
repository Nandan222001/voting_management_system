import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// DEBUG: Log the raw env value
console.log('[DEBUG API] process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

const RAW_API_URL =
  // process.env.EXPO_PUBLIC_API_URL || 'http://13.200.172.115/api/v1'; // Live Endpoint
  process.env.EXPO_PUBLIC_API_URL || 'http://13.200.172.115/api/v1'; // Local Endpoint

console.log(`[API] Initializing with baseURL: ${RAW_API_URL} (Platform: ${Platform.OS})`);

// Exported for components that need to construct asset URIs
export const BASE_URL = RAW_API_URL.replace('/api/v1', '').replace(/\/+$/, '');

const TENANT_ID_KEY = 'tenant_id';

export const setTenantID = async (tenantId: string | number | null | undefined) => {
  if (tenantId === null || tenantId === undefined || tenantId === '') {
    await AsyncStorage.removeItem(TENANT_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(TENANT_ID_KEY, String(tenantId));
};

export const getTenantID = async () => {
  return (await AsyncStorage.getItem(TENANT_ID_KEY)) || null;
};

export const clearTenantID = async () => {
  await AsyncStorage.removeItem(TENANT_ID_KEY);
};

const api = axios.create({
  baseURL: RAW_API_URL.replace(/\/+$/, ''),
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config) => {
    // 1. Fetch Auth & Tenant Data
    const token = await AsyncStorage.getItem('token');
    const tenantID = await getTenantID();

    // 2. Apply Headers
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const resolvedTenantID = tenantID || process.env.EXPO_PUBLIC_TENANT_ID || '1';
    
    if (resolvedTenantID && String(resolvedTenantID) !== 'undefined' && config.headers) {
      config.headers['X-Tenant-ID'] = String(resolvedTenantID);
      if (typeof config.headers.set === 'function') {
        config.headers.set('X-Tenant-ID', String(resolvedTenantID));
      }
    }

    // DEBUG: Log the final request URL
    const finalURL = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${finalURL}`);

    // 3. Handle Content-Type for FormData vs JSON
    const isFormData = config.data instanceof FormData || 
                       (config.data && typeof config.data === 'object' && 
                        (config.data._parts || typeof config.data.append === 'function'));

    if (isFormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
        }
      }
    } else {
      if (config.headers && !config.headers['Content-Type'] && !config.headers['content-type']) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Content-Type', 'application/json');
        } else {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

// ─── Response interceptor ────────────────────────────────────────────────────

let unauthorizedCallback: (() => void) | null = null;

export const onUnauthorized = (callback: () => void) => {
  unauthorizedCallback = callback;
};

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (!error.response) {
      console.error(`[API Network Error] URL: ${error.config?.url}`, {
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        fullURL: (error.config?.baseURL || '') + (error.config?.url || '')
      });
    } else {
      console.error(`[API Error Response] ${error.config?.url}:`, {
        status: error.response.status,
        data: error.response.data,
      });
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      if (unauthorizedCallback) {
        unauthorizedCallback();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
