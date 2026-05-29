import api from './api';

const planService = {
  /**
   * Fetch all subscription plans for the tenant.
   */
  getPlans: (params = {}) => api.get('/plans', { params }),

  /**
   * Create a new subscription plan (Admin only).
   */
  createPlan: (data) => api.post('/plans', data),

  /**
   * Update an existing plan (Admin only).
   */
  updatePlan: (id, data) => api.put(`/plans/${id}`, data),

  /**
   * Delete a plan (Admin only).
   */
  deletePlan: (id) => api.delete(`/plans/${id}`),
};

export default planService;
