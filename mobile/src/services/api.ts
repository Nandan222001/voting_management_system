import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Development Endpoint Configuration (handles emulator networking)
const LOCALHOST_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});
let RAW_API_URL = LOCALHOST_URL || 'http://localhost:8000/api/v1';

console.log(`[API] Initializing with baseURL: ${RAW_API_URL}`);

// Exported for components that need to construct asset URIs
export const BASE_URL = RAW_API_URL.replace('/api/v1', '');

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
  baseURL: RAW_API_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    // We omit 'Content-Type' here to avoid interfering with FormData
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config) => {
    // 1. Fetch Auth & Tenant Data
    const token = await AsyncStorage.getItem('token');
    const tenantID = await getTenantID();

    // 2. Apply Headers (Using Axios 1.x methods for consistency)
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    if (tenantID && config.headers) {
      config.headers.set('X-Tenant-ID', String(tenantID));
    }

    // 3. Handle Content-Type for FormData vs JSON
    const isFormData = config.data instanceof FormData || 
                       (config.data && typeof config.data === 'object' && 
                        (config.data._parts || typeof config.data.append === 'function'));

    if (isFormData) {
      console.log(`[API] FormData detected for ${config.url}. Removing Content-Type to allow boundary generation.`);
      // In Axios 1.x, we MUST use .delete() on the headers object
      if (config.headers) {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
    } else {
      // Ensure JSON content type for standard requests if not already set
      if (config.headers && !config.headers.has('Content-Type') && !config.headers.has('content-type')) {
        config.headers.set('Content-Type', 'application/json');
      }
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers.toJSON ? config.headers.toJSON() : config.headers,
    });

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
