import api from './api';

export const candidateService = {
  getById: async (id: number) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data.data;
  },

  getByElection: async (electionId: number) => {
    const response = await api.get(`/candidates/election/${electionId}`);
    return response.data.data;
  },

  nominate: async (formData: any) => {
    // Standardize the payload as a JSON object
    const payload: any = {};
    
    const keys = [
      'election_id', 'committee_id', 'target_id', 'position_name', 'full_name', 'email', 'phone', 
      'date_of_birth', 'gender', 'parent_name', 'kyc_type', 'voter_id_number', 
      'state', 'district', 'taluka', 'village', 'pincode', 'bio',
      'is_willing', 'held_previously', 'prev_position', 'prev_duration', 
      'is_disciplined', 'discipline_details', 'has_complaints', 
      'agreed_constitution', 'accepted_results', 'image_url', 'signature_url', 'status'
    ];

    keys.forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        // Ensure numeric fields are actually numbers if they are valid digits
        if (['election_id', 'committee_id', 'target_id'].includes(key) && typeof formData[key] === 'string' && /^\d+$/.test(formData[key])) {
          payload[key] = parseInt(formData[key], 10);
        } else {
          payload[key] = formData[key];
        }
      }
    });

    const response = await api.post('/candidates/nominate', payload);
    return response.data.data;
  },

  followCandidate: async (id: number) => {
    const response = await api.post(`/candidates/${id}/follow`);
    return response.data.data;
  },

  unfollowCandidate: async (id: number) => {
    const response = await api.post(`/candidates/${id}/follow`);
    return response.data.data;
  },

  getFollowStatus: async (id: number) => {
    const response = await api.get(`/candidates/${id}/follow-status`);
    return response.data.data; // Expected { is_following: boolean }
  },

  getFollowersCount: async () => {
    const response = await api.get('/candidates/me/followers-count');
    return response.data.data; // Expected { count: number }
  },

  getFollowers: async () => {
    const response = await api.get('/candidates/me/followers');
    return response.data.data; // Expected array of users
  },

  getFollowingCount: async () => {
    const response = await api.get('/candidates/me/following-count');
    return response.data.data; // Expected { count: number }
  },

  getFollowing: async () => {
    const response = await api.get('/candidates/me/following');
    return response.data.data; // Expected array of users
  },
};
