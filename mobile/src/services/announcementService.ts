import api from './api';

export type Announcement = {
  id: number;
  title: string;
  short_description: string;
  content: string;
  image_urls: string[];
  attachment_urls: string[];
  publish_date: string;
  status: 'draft' | 'published';
  is_featured: boolean;
};

const apiOrigin = () => {
  const baseURL = api.defaults.baseURL || '';
  return baseURL.replace(/\/api\/v1\/?$/, '');
};

export const absoluteUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${apiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
};

export const normalize = (item: Announcement): Announcement => ({
  ...item,
  image_urls: (item.image_urls || []).map((url) => absoluteUrl(url) || url),
  attachment_urls: (item.attachment_urls || []).map((url) => absoluteUrl(url) || url),
});

export const stripHtml = (value?: string) => (value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export const isTodayAnnouncement = (item: Announcement) => {
  if (!item.publish_date) return false;
  const published = new Date(item.publish_date);
  const today = new Date();
  return (
    published.getFullYear() === today.getFullYear()
    && published.getMonth() === today.getMonth()
    && published.getDate() === today.getDate()
  );
};

export const announcementService = {
  getLatest: async () => {
    const response = await api.get('/announcements/latest');
    const item = response.data?.data;
    return item ? normalize(item) : null;
  },

  getPublished: async (page = 1, per_page = 20) => {
    const response = await api.get('/announcements/public', { params: { page, per_page } });
    const data = response.data?.data || {};
    return {
      ...data,
      items: (data.items || []).map(normalize),
    };
  },

  getDetails: async (id: number) => {
    const response = await api.get(`/announcements/public/${id}`);
    return normalize(response.data?.data);
  },

  getToday: async () => {
    const data = await announcementService.getPublished(1, 100);
    return (data.items || []).filter(isTodayAnnouncement);
  },
};
