import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { access_token, user } = response.data; // Login response is NOT wrapped in 'data'
    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { access_token, user };
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', { email, otp_code: otp });
    return response.data;
  },

  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  updateProfile: async (userData: any) => {
    const response = await api.put('/auth/me', userData);
    const updatedUser = response.data.data;
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },
};
