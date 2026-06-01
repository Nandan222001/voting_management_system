import api from './api';

export const paymentService = {
  getMyMembershipStatus: async () => {
    const response = await api.get('/payments/my-membership-status');
    return response.data.data;
  },
};
