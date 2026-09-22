import { api, handleResponse, isDemoMode } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants/api-config';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  property_id?: string;
}

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export const notificationsApi = {
  list: async (propertyId: string, skip = 0, limit = 20, unreadOnly = false) => {
    if (await isDemoMode()) return { notifications: [] as Notification[], total: 0, unread_count: 0 };
    const url = `${API_ENDPOINTS.NOTIFICATIONS.LIST(propertyId)}&skip=${skip}&limit=${limit}&unread_only=${unreadOnly}`;
    const response = await api.get(url);
    const json = await handleResponse<{ success?: boolean; data?: NotificationListResponse }>(response);
    return json.data ?? (json as unknown as NotificationListResponse);
  },

  unreadCount: async (propertyId: string) => {
    if (await isDemoMode()) return { unread_count: 0 };
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT(propertyId));
    const json = await handleResponse<{ success?: boolean; data?: { unread_count: number } }>(response);
    return json.data ?? (json as unknown as { unread_count: number });
  },

  markRead: async (notifId: string, propertyId: string) => {
    if (await isDemoMode()) return { message: 'ok', unread_count: 0 };
    const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notifId, propertyId));
    const json = await handleResponse<{ success?: boolean; data?: { message: string; unread_count: number } }>(response);
    return json.data ?? (json as unknown as { message: string; unread_count: number });
  },

  markAllRead: async (propertyId: string) => {
    if (await isDemoMode()) return { message: 'ok', unread_count: 0 };
    const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ(propertyId));
    const json = await handleResponse<{ success?: boolean; data?: { message: string; unread_count: number } }>(response);
    return json.data ?? (json as unknown as { message: string; unread_count: number });
  },
};
