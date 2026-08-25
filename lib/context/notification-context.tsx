import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/context/auth-context';

export interface Notification {
  id: string;
  icon: string;
  color: string;
  bgColor: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  timestamp: string;
  read: boolean;
  property_id?: string;
}

/** Alias kept for consumers that import by the other name. */
export type AppNotification = Notification;

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  registerPushToken: (token: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function getStorageKey(userId?: string | number): string {
  return userId != null ? `notifications_${userId}` : 'notifications_guest';
}

async function loadNotifications(userId?: string | number): Promise<Notification[]> {
  try {
    const data = await AsyncStorage.getItem(getStorageKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load notifications:', e);
    return [];
  }
}

async function saveNotifications(notifications: Notification[], userId?: string | number) {
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(notifications));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const userId = (user as { id?: string | number } | null)?.id;

  useEffect(() => {
    let cancelled = false;
    loadNotifications(userId).then(data => {
      if (!cancelled) setNotifications(data);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    saveNotifications(notifications, userId).catch(e => {
      console.warn('Failed to save notifications:', e);
    });
  }, [notifications, userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback(
    (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const now = new Date().toISOString();
      const newNotification: Notification = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: now,
        created_at: n.created_at || now,
        type: n.type || 'system',
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotification = useCallback((_id?: string) => {
    setNotifications([]);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const data = await loadNotifications(userId);
    setNotifications(data);
  }, [userId]);

  const registerPushToken = useCallback((_token: string) => {
    // Push token registration is handled by the push notification hook
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification, clearNotification, refreshNotifications, registerPushToken }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
