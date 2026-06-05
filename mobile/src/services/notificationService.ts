import api from './api';
import { Announcement, normalize as normalizeAnnouncement } from './announcementService';

export type ElectionNotification = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  item_type: 'election';
};

export type NotificationItem = (Announcement & { item_type: 'announcement' }) | ElectionNotification;

export type NotificationGroups = {
  today: NotificationItem[];
  tomorrow: NotificationItem[];
};

export const notificationService = {
  getNotifications: async (): Promise<NotificationGroups> => {
    const response = await api.get('/notifications');
    const data = response.data?.data || { today: [], tomorrow: [] };
    
    const normalizeItem = (item: any): NotificationItem => {
      if (item.item_type === 'announcement') {
        return {
          ...normalizeAnnouncement(item),
          item_type: 'announcement'
        } as NotificationItem;
      }
      return {
        ...item,
        item_type: 'election'
      } as NotificationItem;
    };

    return {
      today: (data.today || []).map(normalizeItem),
      tomorrow: (data.tomorrow || []).map(normalizeItem),
    };
  },
};
