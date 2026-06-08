import api, { clearTenantID, setTenantID } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email: string, password: string) => {
    // Exactly matching the successful curl command provided by the user
    // grant_type=password&username=suhel%40gmail.com&password=Suhel%40123&scope=&client_id=string&client_secret=
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', email);
    params.append('password', password);
    params.append('scope', '');
    params.append('client_id', 'string');
    params.append('client_secret', '');

    const response = await api.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    const data = response.data.data || response.data;
    const { access_token, user } = data;

    if (!access_token) {
      throw new Error('No access token received from server');
    }

    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await setTenantID(user?.tenant_id);
    return { access_token, user };
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await clearTenantID();
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data.data || response.data;
  },

  createRegistrationOrder: async (tenantId: number, planId: number) => {
    const response = await api.post('/auth/register/payment-order', {
      tenant_id: tenantId,
      membership_plan_id: planId
    });
    return response.data.data || response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', { email, otp_code: otp });
    const data = response.data.data || response.data;
    const token = data.access_token || data.token;
    const user = data.user;

    if (token) {
      await AsyncStorage.setItem('token', token);
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await setTenantID(user.tenant_id);
      }
    }
    return { token, user, ...data };
  },

  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    const user = response.data.data || response.data;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await setTenantID(user?.tenant_id);
    return user;
  },

  updateProfile: async (userData: any) => {
    const response = await api.put('/auth/me', userData);
    const updatedUser = response.data.data;
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    await setTenantID(updatedUser?.tenant_id);
    return updatedUser;
  },
};
