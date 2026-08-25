import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { SyncIndicator } from '@/components/operations/SyncIndicator';
import { NotificationBell } from '@/components/ui/notification-bell';
import type { OperatorProfile } from '@/types/api';
import { TEAL, TEXT } from '@/lib/constants/figma-tokens';

const ACCENT = TEAL[600];

export function OperationsHeader() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const operator = user as OperatorProfile | null;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.replace('/');
  };

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <View style={{
      backgroundColor: colors.background,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
            {operator?.property_name || 'Operations'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Text className="text-xs text-muted">{operator?.name || 'Staff'}</Text>
            <SyncIndicator />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: colors.foreground, fontWeight: '600' }}>
              {timeStr}
            </Text>
            <Text style={{ fontSize: 10, color: colors.muted }}>{dateStr}</Text>
          </View>

          <NotificationBell />
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: ACCENT + '18',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {operator?.name?.[0] || 'O'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User avatar dropdown menu */}
        {showMenu && (
          <View style={{
            position: 'absolute', top: 52, right: 16,
            backgroundColor: colors.surface, borderRadius: 12,
            borderWidth: 1, borderColor: colors.border,
            shadowColor: TEXT.black, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
            zIndex: 100, minWidth: 160,
          }}>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
            >
              <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{
        paddingHorizontal: 16, paddingBottom: 10,
      }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.muted + '20',
          borderRadius: 10, paddingHorizontal: 10,
          height: 36,
        }}>
          <Text style={{ fontSize: 15, color: colors.muted, marginRight: 8 }}>⌕</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search bookings, rooms..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontSize: 13, color: colors.foreground, paddingVertical: 0 }}
          />
        </View>
      </View>
    </View>
  );
}
