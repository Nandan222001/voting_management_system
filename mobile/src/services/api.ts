import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real app, use environment variables
// Use 'http://10.0.2.2:8000/api/v1' for Android Emulator
// Use 'http://localhost:8000/api/v1' for Web/Local development
const API_URL = 'http://localhost:8000/api/v1'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
