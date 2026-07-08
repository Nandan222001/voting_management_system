import api from './api';

export interface EventCreate {
  event_type: string;
  event_date: string;
  event_time: string;
  place: string;
  communication_type: 'Online' | 'Offline';
  description?: string;
}

export interface EventResponse {
  id: number;
  tenant_id: number;
  created_by: number;
  event_type: string;
  event_date: string;
  event_time: string;
  place: string;
  communication_type: 'Online' | 'Offline';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EventNotification {
  id: number;
  event_id: number;
  user_id: number;
  is_read: boolean;
  created_at: string;
  event?: EventResponse;
}

export const eventService = {
  createEvent: async (data: EventCreate): Promise<EventResponse> => {
    const response = await api.post('/events', data);
    return response.data.data;
  },

  getMyEvents: async (): Promise<EventResponse[]> => {
    const response = await api.get('/events/my');
    return response.data.data;
  },

  getHierarchyEvents: async (): Promise<EventResponse[]> => {
    const response = await api.get('/events/hierarchy');
    return response.data.data;
  },

  getEventNotifications: async (): Promise<EventNotification[]> => {
    const response = await api.get('/events/notifications');
    return response.data.data;
  },

  getEventDetails: async (id: number): Promise<EventResponse> => {
    const response = await api.get(`/events/${id}`);
    return response.data.data;
  },

  markNotificationRead: async (id: number): Promise<void> => {
    await api.put(`/events/notifications/${id}/read`);
  },
};
