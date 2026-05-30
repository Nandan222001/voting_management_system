import api from './api';

export const reportService = {
  getDashboardOverview: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data.data;
  },
  
  getElectionReport: async (electionId: number) => {
    const response = await api.get(`/reports/elections/${electionId}`);
    return response.data.data;
  },

  getParticipationStats: async (electionId: number) => {
    const response = await api.get(`/reports/participation/${electionId}`);
    return response.data.data;
  }
};
