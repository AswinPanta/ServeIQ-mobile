import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';

const ACCENT = '#2563EB';

export function HostDashboard() {
  const colors = useColors();
  const {
    properties, activePropertyId, setActivePropertyId,
    getFilteredRooms, getFilteredRoomTypes, getFilteredStaff, getFilteredBookings,
  } = useHost();

  const activeProperty = properties.find(p => p.id === activePropertyId);
  const propRooms = activePropertyId ? getFilteredRooms(activePropertyId) : [];
  const propRoomTypes = activePropertyId ? getFilteredRoomTypes(activePropertyId) : [];
  const propStaff = activePropertyId ? getFilteredStaff(activePropertyId) : [];
  const propBookings = activePropertyId ? getFilteredBookings(activePropertyId) : [];

  const available = propRooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = propRooms.filter(r => r.status === 'OCCUPIED').length;
  const dirty = propRooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING').length;
  const maintenance = propRooms.filter(r => r.status === 'MAINTENANCE').length;

  const activeBookings = propBookings.filter(b => b.status === 'checked_in').length;
  const pendingBookings = propBookings.filter(b => b.status === 'pending').length;
  const revenue = propBookings.filter(b => b.status === 'checked_in' || b.status === 'checked_out')
    .reduce((sum, b) => sum + b.total, 0);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Property Selector */}
      {properties.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-2 px-2">
          {properties.map(p => (
            <TouchableOpacity key={p.id} onPress={() => setActivePropertyId(p.id)}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8,
                backgroundColor: p.id === activePropertyId ? ACCENT : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: p.id === activePropertyId ? '#fff' : colors.foreground }}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Welcome */}
      <Text className="text-2xl font-bold text-foreground mb-1">{activeProperty?.name || 'Dashboard'}</Text>
      <Text className="text-sm text-muted mb-5">{activeProperty?.city}, {activeProperty?.country}</Text>

      {/* KPI Row */}
      <View className="flex-row flex-wrap gap-3 mb-5">
        {[
          { label: 'Available', value: available, color: '#10B981' },
          { label: 'Occupied', value: occupied, color: '#F59E0B' },
          { label: 'Cleaning', value: dirty, color: '#3B82F6' },
          { label: 'Maint.', value: maintenance, color: '#EF4444' },
          { label: 'Room Types', value: propRoomTypes.length, color: '#8B5CF6' },
        ].map((item, i) => (
          <View key={i}
            style={{ flex: 1, minWidth: '18%', padding: 12, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: item.color }}>{item.value}</Text>
            <Text className="text-xs text-muted mt-1 text-center">{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Revenue & Bookings */}
      <View className="flex-row gap-3 mb-5">
        <View style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-sm text-muted">Monthly Revenue</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: ACCENT }}>रू{revenue.toLocaleString()}</Text>
        </View>
        <View style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-sm text-muted">Active Bookings</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#F59E0B' }}>{activeBookings}</Text>
          {pendingBookings > 0 && (
            <Text className="text-xs text-muted mt-1">{pendingBookings} pending</Text>
          )}
        </View>
      </View>

      {/* Occupancy Rate */}
      {propRooms.length > 0 && (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
          <Text className="text-sm font-semibold text-foreground mb-3">Occupancy Overview</Text>
          <View className="flex-row h-3 rounded-full overflow-hidden bg-gray-200">
            {occupied > 0 && <View style={{ flex: occupied, backgroundColor: '#F59E0B' }} />}
            {available > 0 && <View style={{ flex: available, backgroundColor: '#10B981' }} />}
            {dirty > 0 && <View style={{ flex: dirty, backgroundColor: '#3B82F6' }} />}
            {maintenance > 0 && <View style={{ flex: maintenance, backgroundColor: '#EF4444' }} />}
          </View>
          <View className="flex-row flex-wrap gap-4 mt-3">
            {[
              { label: 'Occupied', value: occupied, color: '#F59E0B' },
              { label: 'Available', value: available, color: '#10B981' },
              { label: 'Cleaning', value: dirty, color: '#3B82F6' },
              { label: 'Maintenance', value: maintenance, color: '#EF4444' },
            ].map((item, i) => (
              <View key={i} className="flex-row items-center gap-1.5">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                <Text className="text-xs text-muted">{item.label}: {item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Bookings */}
      <Text className="text-base font-bold text-foreground mb-3">Recent Bookings</Text>
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        {propBookings.slice(0, 5).map((b, i) => (
          <View key={b.id} style={{ padding: 14, borderBottomWidth: i < propBookings.slice(0, 5).length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{b.guest_name}</Text>
                <Text className="text-xs text-muted mt-0.5">Room {b.room_name} · {b.check_in} → {b.check_out}</Text>
              </View>
              <View className="items-end">
                <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>रू{b.total.toLocaleString()}</Text>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4,
                  backgroundColor: b.status === 'checked_in' ? '#10B98120' : b.status === 'checked_out' ? '#6B728020' : '#F59E0B20',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: b.status === 'checked_in' ? '#10B981' : b.status === 'checked_out' ? '#6B7280' : '#F59E0B' }}>
                    {b.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        {propBookings.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text className="text-sm text-muted">No bookings yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
