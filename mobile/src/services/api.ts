import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const EXPO_ENV = process.env as Record<string, string | undefined>;
const DEFAULT_API_URL = 'http://localhost:8000/api/v1';
const RAW_API_URL = EXPO_ENV.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

// Intelligently resolve the API URL based on platform and environment
let API_URL = RAW_API_URL;

if (Platform.OS === 'android') {
  // 10.0.2.2 is the special IP for host machine's localhost in Android Emulator
  API_URL = RAW_API_URL.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
} else if (Platform.OS === 'web') {
  // If running in browser on localhost, but API is configured for a LAN IP (that might be stale),
  // prefer localhost to avoid timeouts.
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    if (API_URL.includes('192.168.') || API_URL.includes('10.')) {
      console.log(`[API] Web localhost detected. Overriding LAN IP ${API_URL} with localhost for reliability.`);
      API_URL = API_URL.replace(/192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+/, 'localhost');
    }
  }
}

console.log(`[API] Initializing with baseURL: ${API_URL} (Source: ${RAW_API_URL})`);

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
  timeout: 15000,
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

    if (config.data instanceof FormData) {
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
    }
    return Promise.reject(error);
  },
);

export default api;
