import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/context/auth-context';
import { HostContext } from '@/lib/context/host-context';
import { notificationsApi } from '@/lib/api/notifications-api';


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
  const hostCtx = useContext(HostContext);
  const activePropertyId = hostCtx?.activePropertyId ?? null;
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

  const markAsRead = useCallback(async (id: string) => {
    if (activePropertyId) {
      try {
        await notificationsApi.markRead(id, activePropertyId);
      } catch (e) {
        console.warn('Failed to mark notification as read on server:', e);
      }
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, [activePropertyId]);

  const markAllAsRead = useCallback(async () => {
    if (activePropertyId) {
      try {
        await notificationsApi.markAllRead(activePropertyId);
      } catch (e) {
        console.warn('Failed to mark all notifications as read on server:', e);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [activePropertyId]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotification = useCallback((_id?: string) => {
    setNotifications([]);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!activePropertyId) {
      const data = await loadNotifications(userId);
      setNotifications(data);
      return;
    }
    try {
      const res = await notificationsApi.list(activePropertyId);
      const apiNotifs: Notification[] = (res.notifications || []).map(n => ({
        ...n,
        icon: 'bell',
        color: '#1E40AF',
        bgColor: '#EFF6FF',
        timestamp: n.created_at,
        property_id: n.property_id || activePropertyId,
      }));
      setNotifications(prev => {
        const localOnly = prev.filter(
          ln => !apiNotifs.some(an => an.id === ln.id),
        );
        return [...apiNotifs, ...localOnly];
      });
    } catch (e) {
      console.warn('Failed to fetch notifications from server:', e);
      const data = await loadNotifications(userId);
      setNotifications(data);
    }
  }, [activePropertyId, userId]);

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
