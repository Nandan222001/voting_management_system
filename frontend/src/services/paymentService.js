import api from './api';

const paymentService = {
  /**
   * Fetch revenue summary and transaction history for the tenant.
   * @param {Object} params { page, page_size }
   */
  getRevenueOverview: (params = {}) => api.get('/payments/revenue', { params }),

  /**
   * Update Razorpay Key ID and Key Secret.
   * @param {Object} data { razorpay_key_id, razorpay_key_secret }
   */
  updatePaymentSettings: (data) => api.put('/payments/settings', data),

  /**
   * Fetch current Razorpay configuration.
   */
  getPaymentSettings: () => api.get('/payments/settings'),

  /**
   * Download payment statement CSV.
   */
  downloadStatement: () => api.get('/payments/statement', { responseType: 'blob' }),

  /**
   * Initiate a new payment/order.
   * @param {Object} data { amount, description, user_id }
   */
  createPayment: (data) => api.post('/payments/create', data),
};

export default paymentService;
