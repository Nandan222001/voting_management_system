import api from './api';

export type VotingEligibility = {
  can_vote: boolean;
  membership_selected: boolean;
  payment_completed: boolean;
  message: string;
};

export type RazorpayOrder = {
  payment_id: number;
  razorpay_order_id: string;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
};

export const createRegistrationOrder = async (tenantId: number, planId: number): Promise<RazorpayOrder> => {
  const response = await api.post('/auth/register/payment-order', {
    tenant_id: tenantId,
    membership_plan_id: planId
  });
  return response.data.data || response.data;
};

export const paymentService = {
  checkVotingEligibility: async (): Promise<VotingEligibility> => {
    const response = await api.get('/voting/check-eligibility');
    return response.data.data; // Standardized envelope
  },

  getMyMembershipStatus: async () => {
    const response = await api.get('/payments/my-membership-status');
    return response.data.data;
  },

  createMembershipOrder: async (membershipPlanId: number): Promise<RazorpayOrder> => {
    const response = await api.post('/payments/create-order', {
      membership_plan_id: membershipPlanId
    });
    return response.data.data || response.data;
  },

  createRegistrationOrder,

  verifyPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/payments/verify', {
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
    });
    return response.data.data || response.data;
  },

  getPaymentStatus: async () => {
    const response = await api.get('/payments/status');
    return response.data.data || response.data;
  },

  recordPaymentFailure: async (payload: {
    membership_plan_id: number;
    error_message: string;
    razorpay_order_id?: string;
  }) => {
    const response = await api.post('/payments/failure', payload);
    return response.data.data || response.data;
  },
};
