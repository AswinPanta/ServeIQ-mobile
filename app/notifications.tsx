import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useNotifications, AppNotification } from '@/lib/context/notification-context';
import { ScreenContainer } from '@/components/screen-container';
import { safeGoBack } from '@/lib/utils';
import type { TFunction } from 'i18next';
import { RED, INDIGO, TEXT, BLUE } from '@/lib/constants/figma-tokens';

const TYPE_ICONS: Record<string, string> = {
  booking_confirmation: '✅',
  booking_reminder: '📅',
  review_request: '⭐',
  promotion: '🎉',
  system: '⚙️',
};

const TIME_AGO = (dateStr: string, t: TFunction): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('profile.notifications.justNow');
  if (mins < 60) return t('profile.notifications.minutesAgo', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('profile.notifications.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('profile.notifications.daysAgo', { n: days });
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="px-6 pt-14 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => safeGoBack()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-lg">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">{t('notificationsScreen.title')}</Text>
            {unreadCount > 0 && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: RED[500] }}>
                <Text className="text-xs font-bold text-white">{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={{ padding: 4 }}>
              <Text className="text-sm font-semibold text-primary">{t('notificationsScreen.markAllRead')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 24 }}>
        {notifications.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text className="text-lg font-bold text-foreground">{t('notificationsScreen.empty')}</Text>
            <Text className="text-sm text-muted text-center mt-1">{t('notificationsScreen.allCaughtUp')}</Text>
          </View>
        ) : (
          <View className="gap-3">
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
                onLongPress={() => clearNotification(notification.id)}
                style={{
                  padding: 16, borderRadius: 18,
                  backgroundColor: notification.read ? colors.surface : INDIGO[50],
                  borderWidth: 1,
                  borderColor: notification.read ? colors.border : INDIGO[200],
                  shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row gap-3">
                  <View style={{
                    width: 40, height: 40, borderRadius: 14,
                    backgroundColor: notification.read ? colors.border : INDIGO[100],
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 18 }}>{TYPE_ICONS[notification.type] || '🔔'}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-sm font-bold ${notification.read ? 'text-foreground' : 'text-foreground'}`}>
                        {notification.title}
                      </Text>
                      <Text className="text-[10px] text-muted">{TIME_AGO(notification.created_at, t)}</Text>
                    </View>
                    <Text className="text-xs text-muted mt-1 leading-5">{notification.message}</Text>
                  </View>
                  {!notification.read && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE[500], marginTop: 4 }} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
