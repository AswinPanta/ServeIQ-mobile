import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Notifications API not yet available on backend — local-only for now

export interface AppNotification {
  id: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'review_request' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushToken: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  registerPushToken: (token: string) => Promise<void>;
  /** CI-008: Schedule a post-stay review request notification (fires after 2 hours) */
  schedulePostStayReview: (hotelName: string) => void;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'booking_confirmation',
    title: 'Booking Confirmed!',
    message: 'Your stay at Grand Hotel Kathmandu from Jul 15 - Jul 18 has been confirmed.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    type: 'booking_reminder',
    title: 'Check-in Tomorrow',
    message: 'You\'re checking in at Pokhara Lakeside Resort tomorrow at 13:00. Have a great stay!',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n3',
    type: 'review_request',
    title: 'How was your stay?',
    message: 'You recently stayed at Heritage Boutique Hotel. Share your experience with a review!',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n4',
    type: 'promotion',
    title: 'Summer Sale - 20% Off',
    message: 'Book your next stay with 20% off at select properties. Offer ends July 31.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'n5',
    type: 'booking_confirmation',
    title: 'Booking Updated',
    message: 'Your room upgrade request at Grand Hotel Kathmandu has been approved.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Profile Updated',
    message: 'Your profile information has been updated successfully.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

// CI-008: Post-stay review request notification
export function createPostStayReviewNotification(hotelName: string): AppNotification {
  return {
    id: 'review_' + Date.now().toString(36),
    type: 'review_request',
    title: 'How was your stay?',
    message: `You recently checked out from ${hotelName}. Share your experience with a review!`,
    read: false,
    created_at: new Date().toISOString(),
  };
}

const STORAGE_KEY = 'stayeasy_notifications';
const PUSH_TOKEN_KEY = 'stayeasy_push_token';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, PUSH_TOKEN_KEY]).then(([notifData, tokenData]) => {
      if (notifData[1]) {
        setNotifications(JSON.parse(notifData[1]));
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
      }
      if (tokenData[1]) setPushToken(tokenData[1]);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications, loaded]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshNotifications = useCallback(async () => {
    // Notifications API not yet available on backend
    // TODO: wire to backend when /notifications/ endpoint is added
  }, []);

  const registerPushToken = useCallback(async (token: string) => {
    setPushToken(token);
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    // TODO: wire to backend when /notifications/push-token endpoint is added
    // On backend: api.post('/notifications/push-token', { token, platform: Platform.OS })
  }, []);

  // CI-008: Schedule post-stay review request
  const schedulePostStayReview = useCallback((hotelName: string) => {
    setTimeout(() => {
      const notif = createPostStayReviewNotification(hotelName);
      setNotifications(prev => [notif, ...prev]);
    }, 2 * 60 * 60 * 1000); // 2 hours
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    pushToken,
    markAsRead,
    markAllAsRead,
    clearNotification,
    refreshNotifications,
    registerPushToken,
    schedulePostStayReview,
  }), [
    notifications,
    unreadCount,
    pushToken,
    markAsRead,
    markAllAsRead,
    clearNotification,
    refreshNotifications,
    registerPushToken,
    schedulePostStayReview,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
