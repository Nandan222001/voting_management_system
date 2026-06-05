import api from './api';

export const electionService = {
  getElections: async (isPublic: boolean = false, page: number = 1, per_page: number = 20, status?: string) => {
    let endpoint = isPublic ? '/elections/public' : `/elections/?page=${page}&per_page=${per_page}`;
    if (status && !isPublic) {
      endpoint += `&status=${status}`;
    }
    const response = await api.get(endpoint);
    // Return the full response body (envelope)
    return response.data;
  },

  getPublicElections: async () => {
    const response = await api.get('/elections/public');
    return response.data.data;
  },

  getElectionDetails: async (id: number) => {
    const response = await api.get(`/elections/${id}`);
    return response.data; // Backend returns direct ElectionResponse
  },

  getCandidates: async (electionId: number) => {
    const response = await api.get(`/candidates/election/${electionId}`);
    return response.data; // Backend returns a direct list
  },

  castVote: async (electionId: number, candidateId: number) => {
    const response = await api.post('/voting/submit', {
      election_id: electionId,
      candidate_id: candidateId,
    });
    return response.data;
  },

  getMyVote: async (electionId: number) => {
    const response = await api.get(`/votes/my-vote/${electionId}`);
    return response.data.data;
  },
};
