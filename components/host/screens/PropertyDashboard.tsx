import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { GRAY, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/portal-theme';
import { BLUE, AMBER, RED, STATUS, BG } from '@/lib/constants/figma-tokens';

interface Props { property: Property }

export function PropertyDashboard({ property }: Props) {
  const { getFilteredRooms, getFilteredBookings } = useHost();
  const rooms = getFilteredRooms(property.id);
  const bookings = getFilteredBookings(property.id);

  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;
  const dirty = rooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING').length;
  const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;

  const activeBookings = bookings.filter(b => b.status === 'checked_in').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'checked_in' || b.status === 'checked_out')
    .reduce((sum, b) => sum + b.total, 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: BLUE[500] }]}>
          <Ionicons name="bed-outline" size={20} color={BLUE[500]} />
          <Text style={styles.kpiValue}>{available}/{rooms.length}</Text>
          <Text style={styles.kpiLabel}>Available</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: AMBER[500] }]}>
          <Ionicons name="person-outline" size={20} color={AMBER[500]} />
          <Text style={styles.kpiValue}>{activeBookings}</Text>
          <Text style={styles.kpiLabel}>Checked In</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: RED[500] }]}>
          <Ionicons name="alert-circle-outline" size={20} color={RED[500]} />
          <Text style={styles.kpiValue}>{dirty + maintenance}</Text>
          <Text style={styles.kpiLabel}>Needs Attention</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: STATUS.activeGreen }]}>
          <Ionicons name="cash-outline" size={20} color={STATUS.activeGreen} />
          <Text style={styles.kpiValue}>${totalRevenue.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Room Status</Text>
        <View style={styles.legendRow}>
          <Legend color={STATUS.activeGreen} label={`${available} Available`} />
          <Legend color={BLUE[500]} label={`${occupied} Occupied`} />
          <Legend color={AMBER[500]} label={`${dirty} Dirty`} />
          <Legend color={RED[500]} label={`${maintenance} Maintenance`} />
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barSegment, { flex: Math.max(available, 1), backgroundColor: STATUS.activeGreen }]} />
          <View style={[styles.barSegment, { flex: Math.max(occupied, 1), backgroundColor: BLUE[500] }]} />
          <View style={[styles.barSegment, { flex: Math.max(dirty, 1), backgroundColor: AMBER[500] }]} />
          <View style={[styles.barSegment, { flex: Math.max(maintenance, 1), backgroundColor: RED[500] }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Bookings</Text>
        {bookings.length === 0 ? (
          <Text style={styles.empty}>No bookings yet</Text>
        ) : (
          bookings.slice(0, 5).map(b => (
            <View key={b.id} style={styles.bookingRow}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingGuest}>{b.guest_name}</Text>
                <Text style={styles.bookingRoom}>Room {b.room_name} · ${b.total}</Text>
              </View>
              <View style={[styles.badge, {
                backgroundColor: b.status === 'checked_in' ? STATUS.badgeGreen : b.status === 'pending' ? AMBER[100] : GRAY[200],
              }]}>
                <Text style={[styles.badgeText, {
                  color: b.status === 'checked_in' ? STATUS.activeGreenDark : b.status === 'pending' ? AMBER[600] : GRAY[500],
                }]}>{b.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: RADIUS.badge, backgroundColor: color }} />
      <Text style={{ ...TYPOGRAPHY.small, color: GRAY[500] }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard: {
    flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16,
    borderLeftWidth: 3, gap: 6,
    ...SHADOWS.card,
  },
  kpiValue: { ...TYPOGRAPHY.body, fontWeight: '800', color: GRAY[900] },
  kpiLabel: { ...TYPOGRAPHY.small, color: GRAY[400] },

  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, marginBottom: 12, gap: 12 },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  legendRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  barTrack: { height: 10, borderRadius: RADIUS.badge, flexDirection: 'row', overflow: 'hidden', backgroundColor: GRAY[100] },
  barSegment: { height: '100%' },

  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  bookingInfo: { gap: 2 },
  bookingGuest: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  bookingRoom: { ...TYPOGRAPHY.small, color: GRAY[400] },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { ...TYPOGRAPHY.small, fontWeight: '700' },
  empty: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', paddingVertical: 20 },
});
