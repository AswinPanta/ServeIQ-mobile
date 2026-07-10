import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useNotifications } from '@/lib/context/notification-context';
import { useColors } from '@/hooks/use-colors';

interface NotificationBellProps {
  color?: string;
}

export function NotificationBell({ color }: NotificationBellProps) {
  const colors = useColors();
  const { unreadCount } = useNotifications();
  const dotColor = color || '#EF4444';

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications' as any)}
      style={{ position: 'relative', padding: 4 }}
    >
      <Text style={{ fontSize: 18 }}>🔔</Text>
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute', top: 0, right: 0,
            minWidth: 16, height: 16, borderRadius: 8,
            backgroundColor: dotColor,
            alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#fff' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
