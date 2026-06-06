import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const EXPO_ENV = process.env as Record<string, string | undefined>;
const RAW_API_URL = EXPO_ENV.EXPO_PUBLIC_API_URL || 'https://voting.indian-merchant-navy.com/api/v1';

// Exported for components that need to construct asset URIs
export const BASE_URL = RAW_API_URL.replace('/api/v1', '');

// Simplify API URL resolution as requested
const API_URL = RAW_API_URL;

console.log(`[API] Initializing with baseURL: ${API_URL}`);

const ENV_TENANT_ID = EXPO_ENV.EXPO_PUBLIC_TENANT_ID;
const TENANT_ID_KEY = 'tenant_id';

export const setTenantID = async (tenantId: string | number | null | undefined) => {
  if (tenantId === null || tenantId === undefined || tenantId === '') {
    await AsyncStorage.removeItem(TENANT_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(TENANT_ID_KEY, String(tenantId));
};

export const getTenantID = async () => {
  return ENV_TENANT_ID || (await AsyncStorage.getItem(TENANT_ID_KEY)) || null;
};

export const clearTenantID = async () => {
  await AsyncStorage.removeItem(TENANT_ID_KEY);
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config) => {
    // Attach Bearer token if the user is logged in
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach X-Tenant-ID for all mobile requests
    const tenantID = await getTenantID();
    if (tenantID) {
      config.headers['X-Tenant-ID'] = String(tenantID);
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
    });

    // If sending FormData and no Content-Type is manually set, let axios handle it
    if (config.data instanceof FormData && !config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
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
    console.error(`[API Error] ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

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
