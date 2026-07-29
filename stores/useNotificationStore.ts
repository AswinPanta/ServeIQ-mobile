import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read?: boolean;
  created_at?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notification: { type: string; title: string; message: string; data?: Record<string, unknown> }) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (data) =>
    set((state) => ({
      notifications: [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...data,
          created_at: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
}));
