import api from './api';

export const planService = {
  getPlans: async (activeOnly: boolean = true) => {
    const response = await api.get('/plans', {
      params: { active_only: activeOnly }
    });
    return response.data.data;
  },

  getPublicPlans: async () => {
    const response = await api.get('/plans/public');
    return response.data.data;
  },
};
