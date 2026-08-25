import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import { SRS, BRAND, SLATE, BG, GREEN, ORANGE, TEXT, GRAY } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = SRS.teal;
const NAVY = BRAND.navyLight;

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginLeft: -2, marginRight: -2 }}>
          {properties.map(p => (
            <TouchableOpacity key={p.id} onPress={() => setActivePropertyId(p.id)}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginRight: 8,
                backgroundColor: p.id === activePropertyId ? ACCENT : SLATE[100],
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: p.id === activePropertyId ? BG.white : SLATE[600] }}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Welcome */}
      <Text style={{ fontSize: 22, fontWeight: '800', color: NAVY, letterSpacing: -0.3, marginBottom: 4 }}>
        {activeProperty?.name || 'Dashboard'}
      </Text>
      <Text style={{ fontSize: 13, color: SLATE[500], marginBottom: 20 }}>
        {activeProperty?.city}{activeProperty?.city && activeProperty?.country ? ', ' : ''}{activeProperty?.country}
      </Text>

      {/* KPI Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Available', value: available, color: GREEN.bright },
          { label: 'Occupied', value: occupied, color: ORANGE[400] },
          { label: 'Cleaning', value: dirty, color: SRS.teal },
          { label: 'Maint.', value: maintenance, color: SRS.red },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], alignItems: 'center', shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 11, color: SLATE[400], marginTop: 4, textAlign: 'center' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <Text style={{ fontSize: 12, color: SLATE[500], marginBottom: 4 }}>Monthly Revenue</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: ACCENT }}>रू{revenue.toLocaleString()}</Text>
          <Text style={{ fontSize: 11, color: SLATE[400], marginTop: 2 }}>{propRoomTypes.length} room types</Text>
        </View>
        <View style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <Text style={{ fontSize: 12, color: SLATE[500], marginBottom: 4 }}>Active Bookings</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: ORANGE[400] }}>{activeBookings}</Text>
          {pendingBookings > 0 && (
            <Text style={{ fontSize: 11, color: SLATE[400], marginTop: 2 }}>{pendingBookings} pending</Text>
          )}
        </View>
      </View>

      {/* Occupancy Overview */}
      {propRooms.length > 0 && (
        <View style={{ padding: 16, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], marginBottom: 20, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 12 }}>Occupancy Overview</Text>
          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: SLATE[100] }}>
            {occupied > 0 && <View style={{ flex: occupied, backgroundColor: ORANGE[400] }} />}
            {available > 0 && <View style={{ flex: available, backgroundColor: GREEN.bright }} />}
            {dirty > 0 && <View style={{ flex: dirty, backgroundColor: SRS.teal }} />}
            {maintenance > 0 && <View style={{ flex: maintenance, backgroundColor: SRS.red }} />}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
            {[
              { label: 'Occupied', value: occupied, color: ORANGE[400] },
              { label: 'Available', value: available, color: GREEN.bright },
              { label: 'Cleaning', value: dirty, color: SRS.teal },
              { label: 'Maintenance', value: maintenance, color: SRS.red },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                <Text style={{ fontSize: 11, color: SLATE[500] }}>{item.label}: {item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Bookings */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: NAVY, marginBottom: 12 }}>Recent Bookings</Text>
      <View style={{ borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], overflow: 'hidden', shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
        {propBookings.slice(0, 5).map((b, i) => (
          <View key={b.id} style={{ padding: 14, borderBottomWidth: i < Math.min(propBookings.length, 5) - 1 ? 1 : 0, borderBottomColor: SLATE[100] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: NAVY }}>{b.guest_name}</Text>
                <Text style={{ fontSize: 12, color: SLATE[400], marginTop: 2 }}>Room {b.room_name} · {b.check_in} → {b.check_out}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>रू{b.total.toLocaleString()}</Text>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4,
                  backgroundColor: b.status === 'checked_in' ? GREEN.bright + '20' : b.status === 'checked_out' ? GRAY[500] + '20' : ORANGE[400] + '20',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: b.status === 'checked_in' ? GREEN.bright : b.status === 'checked_out' ? GRAY[500] : ORANGE[400] }}>
                    {b.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        {propBookings.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: SLATE[400] }}>No bookings yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}