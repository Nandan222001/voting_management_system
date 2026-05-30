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
    const data = new FormData();
    
    // List of all keys to include from the multi-step form
    const keys = [
      'election_id', 'committee_id', 'target_id', 'full_name', 'email', 'phone', 
      'date_of_birth', 'gender', 'parent_name', 'kyc_type', 'voter_id_number', 
      'state', 'district', 'taluka', 'village', 'pincode', 'bio',
      'is_willing', 'held_previously', 'prev_position', 'prev_duration', 
      'is_disciplined', 'discipline_details', 'has_complaints', 
      'agreed_constitution', 'accepted_results', 'image_url', 'signature_url'
    ];

    keys.forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, String(formData[key]));
      }
    });

    const response = await api.post('/candidates/nominate', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
