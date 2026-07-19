<<<<<<< HEAD
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

  /**
   * Create a Razorpay membership order for the authenticated user.
   * @param {Object} data { membership_plan_id }
   */
  createMembershipOrder: (data) => api.post('/payments/create-order', data),

  /**
   * Verify a Razorpay payment after checkout completion.
   * @param {Object} data { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  verifyPayment: (data) => api.post('/payments/verify', data),

  /**
   * Record a payment failure from the frontend checkout.
   * @param {Object} data { membership_plan_id, error_message, razorpay_order_id }
   */
  recordFailure: (data) => api.post('/payments/failure', data),

  /**
   * Fetch the current user's own payment history.
   * @param {Object} params { page, page_size }
   */
  getMyHistory: (params = {}) => api.get('/payments/history', { params }),

  /**
   * Issue a refund for a captured payment (Admin only).
   * @param {number} paymentId
   * @param {Object} data { reason, amount }
   */
  refundPayment: (paymentId, data) => api.post(`/payments/${paymentId}/refund`, data),

  /**
   * Fetch enhanced payment analytics (Admin only).
   */
  getAnalytics: () => api.get('/payments/analytics'),
};

export default paymentService;
=======
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

  /**
   * Create a Razorpay membership order for the authenticated user.
   * @param {Object} data { membership_plan_id }
   */
  createMembershipOrder: (data) => api.post('/payments/create-order', data),

  /**
   * Verify a Razorpay payment after checkout completion.
   * @param {Object} data { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  verifyPayment: (data) => api.post('/payments/verify', data),

  /**
   * Record a payment failure from the frontend checkout.
   * @param {Object} data { membership_plan_id, error_message, razorpay_order_id }
   */
  recordFailure: (data) => api.post('/payments/failure', data),

  /**
   * Fetch the current user's own payment history.
   * @param {Object} params { page, page_size }
   */
  getMyHistory: (params = {}) => api.get('/payments/history', { params }),

  /**
   * Issue a refund for a captured payment (Admin only).
   * @param {number} paymentId
   * @param {Object} data { reason, amount }
   */
  refundPayment: (paymentId, data) => api.post(`/payments/${paymentId}/refund`, data),

  /**
   * Fetch enhanced payment analytics (Admin only).
   */
  getAnalytics: () => api.get('/payments/analytics'),
};

export default paymentService;
>>>>>>> fa346d3c9268015db5f8ecd6de67a3eff14d52ab
