import api from './api';

export const electionService = {
  getElections: async (isPublic: boolean = false) => {
    const endpoint = isPublic ? '/elections/public' : '/elections/';
    const response = await api.get(endpoint);
    return response.data.data;
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
    const response = await api.post('/votes/cast', {
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
