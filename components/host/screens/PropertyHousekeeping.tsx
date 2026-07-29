import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';

const STATUS_COLORS: Record<string, string> = {
  DIRTY: '#F59E0B', CLEANING: '#8B5CF6', AVAILABLE: '#10B981',
};

interface Props { property: Property }

export function PropertyHousekeeping({ property }: Props) {
  const { getFilteredRooms } = useHost();
  const rooms = getFilteredRooms(property.id);
  const dirty = rooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statValue}>{dirty.length}</Text>
          <Text style={styles.statLabel}>Dirty / Cleaning</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statValue}>{rooms.filter(r => r.status === 'AVAILABLE').length}</Text>
          <Text style={styles.statLabel}>Clean</Text>
        </View>
      </View>

      {dirty.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Ionicons name="sparkles-outline" size={48} color="#CBD5E1" />
          <Text style={{ marginTop: 12, fontSize: 15, color: '#94A3B8' }}>All rooms are clean!</Text>
        </View>
      ) : (
        dirty.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.roomName}>Room {r.room_name}</Text>
                <Text style={styles.roomType}>Floor {r.floor_number}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[r.status] || '#CBD5E1') + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[r.status] || '#64748B' }]}>{r.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderLeftWidth: 3, gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  roomName: { fontSize: 15, fontWeight: '700', color: '#111' },
  roomType: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
