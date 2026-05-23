import api from './api';

const authService = {
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (full_name, email, password, phone = null, tenant_id = null) =>
    api.post('/auth/register', { full_name, email, password, phone, tenant_id }),
  getMe: () => api.get('/auth/me'),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),
};

export default authService;
