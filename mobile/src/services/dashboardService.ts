import api from './api';

export interface DashboardStats {
  total_users: number;
  active_elections: number;
  total_votes: number;
  pending_users: number;
  total_elections: number;
  closed_elections: number;
  draft_elections: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/reports/dashboard');
    return response.data.data;
  }
};
