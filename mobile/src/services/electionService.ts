import api from './api';

export const electionService = {
  getElections: async (isPublic: boolean = false, page: number = 1, per_page: number = 20, status?: string) => {
    let endpoint = isPublic ? '/elections/public' : `/elections/?page=${page}&per_page=${per_page}`;
    if (status && !isPublic) {
      endpoint += `&status=${status}`;
    }
    const response = await api.get(endpoint);
    return response.data;
  },

  getPublicElections: async () => {
    const response = await api.get('/elections/public');
    return response.data.data;
  },

  getElectionDetails: async (id: number) => {
    const response = await api.get(`/elections/${id}`);
    return response.data.data;
  },

  getCandidates: async (electionId: number) => {
    const response = await api.get(`/candidates/election/${electionId}`);
    return response.data.data;
  },

  castVote: async (electionId: number, candidateId: number) => {
    const response = await api.post('/voting/submit', {
      election_id: electionId,
      candidate_id: candidateId,
    });
    return response.data.data || response.data;
  },

  castVoteBatch: async (electionId: number, candidateIds: number[]) => {
    const response = await api.post('/voting/submit-batch', {
      election_id: electionId,
      candidate_ids: candidateIds,
    });
    return response.data.data || response.data;
  },

  getMyVote: async (electionId: number) => {
    const response = await api.get(`/votes/my-vote/${electionId}`);
    return response.data.data;
  },

  getMyVotes: async (electionId: number) => {
    const response = await api.get(`/votes/my-vote/${electionId}`);
    return response.data.data;
  },

  getCompletedElections: async () => {
    const response = await api.get('/elections/completed');
    return response.data.data || [];
  },

  getMyCompletedElections: async () => {
    const response = await api.get('/elections/completed/my');
    return response.data.data || [];
  },

  getElectionResult: async (electionId: number) => {
    const response = await api.get(`/elections/${electionId}`);
    return response.data.data || response.data;
  },

  getCompletedElectionResult: async (electionId: number) => {
    const response = await api.get(`/elections/completed/${electionId}`);
    return response.data.data || response.data;
  },
};