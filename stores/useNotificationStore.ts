import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'checkin' | 'checkout' | 'hk_alert' | 'kitchen_ready' | 'new_order' | 'vip' | 'maintenance' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
  getRecent: (limit?: number) => AppNotification[];
}

let notifCounter = 0;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        { ...notif, id: `notif-${++notifCounter}`, read: false, createdAt: new Date().toISOString() },
        ...state.notifications,
      ],
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  getRecent: (limit = 10) => get().notifications.slice(0, limit),
}));
