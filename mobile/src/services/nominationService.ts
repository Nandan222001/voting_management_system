import api from './api';

export const nominationService = {
  getMyForElection: async (electionId: number) => {
    const response = await api.get('/nominations/my', {
      params: {
        election_id: electionId,
        page: 1,
        per_page: 1,
      },
    });
    // Standardized envelope: response.data is { success, message, data: { items, total, ... } }
    return response.data.data?.items?.[0] || null;
  },

  withdraw: async (nominationId: number) => {
    const response = await api.post(`/nominations/${nominationId}/withdraw`);
    return response.data.data;
  },
};
