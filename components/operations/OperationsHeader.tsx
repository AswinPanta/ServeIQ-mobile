import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import { useOpsStatus } from '@/hooks/use-ops-status';
import { SyncIndicator } from '@/components/operations/SyncIndicator';
import { NotificationBell } from '@/components/ui/notification-bell';
import type { OperatorProfile } from '@/types/api';

const ACCENT = '#0D9488';

const AVAILABLE_PROPERTIES = [
  { id: 'prop-1', name: 'Grand Hotel Kathmandu' },
  { id: 'prop-2', name: 'Kathmandu Boutique' },
  { id: 'prop-3', name: 'Pokhara Villa' },
];

export function OperationsHeader() {
  const colors = useColors();
  const { user, logout, setUser } = useAuth();
  const operator = user as OperatorProfile | null;
  const opsStatus = useOpsStatus();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showPropMenu, setShowPropMenu] = useState(false);
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

  const handleSwitchProperty = useCallback(async (propertyId: string, propertyName: string) => {
    setShowMenu(false);
    setShowPropMenu(false);
    if (!operator || operator.property_id === propertyId) return;

    // Persist the selection so next demo login remembers it
    await Promise.all([
      AsyncStorage.setItem('@stayeasy_default_ops_property_id', propertyId),
      AsyncStorage.setItem('@stayeasy_default_ops_property_name', propertyName),
    ]);

    // Update the user object in auth context — this triggers all useEffect syncs in screens
    setUser({
      ...operator,
      property_id: propertyId,
      property_name: propertyName,
    });
  }, [operator, setUser]);

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
          <TouchableOpacity
            onPress={() => setShowPropMenu(!showPropMenu)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <Text className="text-sm font-bold text-foreground">{operator?.property_name || 'Operations'}</Text>
            <Text style={{ fontSize: 10, color: '#64748B' }}>▼</Text>
          </TouchableOpacity>
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
            onPress={() => { setShowMenu(!showMenu); setShowPropMenu(false); }}
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
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
            zIndex: 100, minWidth: 160,
          }}>
            <TouchableOpacity
              onPress={() => { setShowMenu(false); logout(); router.replace('/'); }}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Text className="text-sm text-foreground">Switch portal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}
            >
              <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Property switcher dropdown */}
        {showPropMenu && (
          <View style={{
            position: 'absolute', top: 52, left: 16,
            backgroundColor: colors.surface, borderRadius: 12,
            borderWidth: 1, borderColor: colors.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
            zIndex: 100, minWidth: 200,
          }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Switch Property
              </Text>
            </View>
            {AVAILABLE_PROPERTIES.map((prop) => {
              const isActive = operator?.property_id === prop.id;
              return (
                <TouchableOpacity
                  key={prop.id}
                  onPress={() => handleSwitchProperty(prop.id, prop.name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: isActive ? ACCENT + '10' : 'transparent',
                  }}
                >
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: isActive ? ACCENT : colors.border,
                    marginRight: 10,
                  }} />
                  <Text style={{
                    fontSize: 13,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? ACCENT : colors.foreground,
                    flex: 1,
                  }}>
                    {prop.name}
                  </Text>
                  {isActive && (
                    <Text style={{ fontSize: 11, color: ACCENT }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
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
