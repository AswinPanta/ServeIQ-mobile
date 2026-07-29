import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';

const ACCENT = '#2E86AB';

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
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'checked_in' || b.status === 'checked_out')
    .reduce((sum, b) => sum + b.total, 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
          <Ionicons name="bed-outline" size={20} color="#3B82F6" />
          <Text style={styles.kpiValue}>{available}/{rooms.length}</Text>
          <Text style={styles.kpiLabel}>Available</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
          <Ionicons name="person-outline" size={20} color="#F59E0B" />
          <Text style={styles.kpiValue}>{activeBookings}</Text>
          <Text style={styles.kpiLabel}>Checked In</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#EF4444' }]}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={styles.kpiValue}>{dirty + maintenance}</Text>
          <Text style={styles.kpiLabel}>Needs Attention</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
          <Ionicons name="cash-outline" size={20} color="#10B981" />
          <Text style={styles.kpiValue}>${totalRevenue.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Room Status</Text>
        <View style={styles.legendRow}>
          <Legend color="#10B981" label={`${available} Available`} />
          <Legend color="#3B82F6" label={`${occupied} Occupied`} />
          <Legend color="#F59E0B" label={`${dirty} Dirty`} />
          <Legend color="#EF4444" label={`${maintenance} Maintenance`} />
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barSegment, { flex: Math.max(available, 1), backgroundColor: '#10B981' }]} />
          <View style={[styles.barSegment, { flex: Math.max(occupied, 1), backgroundColor: '#3B82F6' }]} />
          <View style={[styles.barSegment, { flex: Math.max(dirty, 1), backgroundColor: '#F59E0B' }]} />
          <View style={[styles.barSegment, { flex: Math.max(maintenance, 1), backgroundColor: '#EF4444' }]} />
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
                backgroundColor: b.status === 'checked_in' ? '#DCFCE7' : b.status === 'pending' ? '#FEF3C7' : '#E2E8F0',
              }]}>
                <Text style={[styles.badgeText, {
                  color: b.status === 'checked_in' ? '#16A34A' : b.status === 'pending' ? '#D97706' : '#64748B',
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
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 11, color: '#64748B' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderLeftWidth: 3, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  kpiLabel: { fontSize: 11, color: '#94A3B8' },

  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  legendRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  barTrack: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#F1F5F9' },
  barSegment: { height: '100%' },

  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  bookingInfo: { gap: 2 },
  bookingGuest: { fontSize: 14, fontWeight: '600', color: '#111' },
  bookingRoom: { fontSize: 12, color: '#94A3B8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
});
