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
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp_code, new_password) =>
    api.post('/auth/reset-password', { email, otp_code, new_password }),
};

export default authService;
