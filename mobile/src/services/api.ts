import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const EXPO_ENV = process.env as Record<string, string | undefined>;
const RAW_API_URL = EXPO_ENV.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_URL =
  Platform.OS === 'android'
    ? RAW_API_URL.replace('http://localhost:', 'http://10.0.2.2:').replace(
        'http://127.0.0.1:',
        'http://10.0.2.2:',
      )
    : RAW_API_URL;
const ENV_TENANT_UUID = EXPO_ENV.EXPO_PUBLIC_TENANT_UUID;

// AsyncStorage key used to persist the selected tenant's UUID across sessions
const TENANT_UUID_KEY = 'tenant_uuid';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Tenant UUID helpers ─────────────────────────────────────────────────────
// Call setTenantUUID after the user selects a tenant during onboarding.
// All subsequent requests will automatically include X-Tenant-ID.

export const setTenantUUID = async (uuid: string): Promise<void> => {
  await AsyncStorage.setItem(TENANT_UUID_KEY, uuid);
};

export const getTenantUUID = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TENANT_UUID_KEY);
};

export const clearTenantUUID = async (): Promise<void> => {
  await AsyncStorage.removeItem(TENANT_UUID_KEY);
};

// ─── Request interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config) => {
    // Attach Bearer token if the user is logged in
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach X-Tenant-ID for all mobile requests so the backend can scope
    // public/pre-auth endpoints without requiring a query parameter.
    // Web clients never send this header — they rely on JWT tenant_id instead.
    const tenantUUID = (await AsyncStorage.getItem(TENANT_UUID_KEY)) || ENV_TENANT_UUID;
    if (tenantUUID) {
      config.headers['X-Tenant-ID'] = tenantUUID;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

export default api;
