import api from './api';

const announcementService = {
  getAnnouncements: (params) => api.get('/announcements/', { params }),
  getAnnouncement: (id) => api.get(`/announcements/${id}`),
  createAnnouncement: (data) => api.post('/announcements/', data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
  publishAnnouncement: (id) => api.post(`/announcements/${id}/publish`),
  unpublishAnnouncement: (id) => api.post(`/announcements/${id}/unpublish`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload-announcement-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload-announcement-attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default announcementService;
