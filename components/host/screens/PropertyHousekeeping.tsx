import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { GRAY, TYPOGRAPHY, RADIUS } from '@/constants/portal-theme';
import { AMBER, PURPLE, STATUS, BG } from '@/lib/constants/figma-tokens';

const STATUS_COLORS: Record<string, string> = {
  DIRTY: AMBER[500], CLEANING: PURPLE[500], AVAILABLE: STATUS.activeGreen,
};

interface Props { property: Property }

export function PropertyHousekeeping({ property }: Props) {
  const { getFilteredRooms } = useHost();
  const rooms = getFilteredRooms(property.id);
  const dirty = rooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={[styles.statCard, { borderLeftColor: AMBER[500] }]}>
          <Text style={styles.statValue}>{dirty.length}</Text>
          <Text style={styles.statLabel}>Dirty / Cleaning</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: STATUS.activeGreen }]}>
          <Text style={styles.statValue}>{rooms.filter(r => r.status === 'AVAILABLE').length}</Text>
          <Text style={styles.statLabel}>Clean</Text>
        </View>
      </View>

      {dirty.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Ionicons name="sparkles-outline" size={48} color={GRAY[300]} />
          <Text style={{ marginTop: 12, fontSize: 15, color: GRAY[400] }}>All rooms are clean!</Text>
        </View>
      ) : (
        dirty.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.roomName}>Room {r.room_name}</Text>
                <Text style={styles.roomType}>Floor {r.floor_number}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[r.status] || GRAY[300]) + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[r.status] || GRAY[500] }]}>{r.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statCard: { flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, borderLeftWidth: 3, gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: GRAY[900] },
  statLabel: { fontSize: 11, color: GRAY[400] },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14, marginBottom: 10 },
  roomName: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  roomType: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
