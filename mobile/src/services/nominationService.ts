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
    return response.data.items?.[0] || null;
  },

  withdraw: async (nominationId: number) => {
    const response = await api.post(`/nominations/${nominationId}/withdraw`);
    return response.data;
  },
};
