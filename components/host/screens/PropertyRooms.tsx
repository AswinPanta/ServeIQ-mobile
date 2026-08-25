import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property, AdminRoom } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { RoomEditModal } from '@/components/host/RoomEditModal';
import { getRoomStatusColor, getRoomCapacitySummary } from '@/lib/host/capacity-validation';
import { SRS, GRAY, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/portal-theme';
import { BG, SLATE } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface Props { property: Property }

export function PropertyRooms({ property }: Props) {
  const { getFilteredRooms, addRoom, syncLocalRoomsToServer } = useHost();
  const rooms = getFilteredRooms(property.id);
  const [filter, setFilter] = React.useState<string>('all');
  const [editingRoom, setEditingRoom] = React.useState<AdminRoom | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; errors: string[] } | null>(null);

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  // Rooms with non-UUID IDs were created locally but never persisted
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const localOnlyCount = rooms.filter(r => !UUID_RE.test(r.id)).length;

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    const result = await syncLocalRoomsToServer(property.id);
    setSyncStatus(result);
    setSyncing(false);
    if (result.errors.length === 0 && result.synced > 0) {
      Alert.alert('Synced', `${result.synced} room${result.synced !== 1 ? 's' : ''} saved to server.`);
    } else if (result.errors.length > 0) {
      Alert.alert('Sync issues', `${result.synced} synced, ${result.errors.length} failed:\n${result.errors.slice(0, 3).join('\n')}`);
    }
  };

  const syncedRef = useRef(false);
  // Auto-sync on mount
  useEffect(() => {
    if (!syncedRef.current && localOnlyCount > 0 && !syncing && !syncStatus) {
      syncedRef.current = true;
      // Defer to avoid setState-in-effect
      const timer = setTimeout(handleSync, 0);
      return () => clearTimeout(timer);
    }
  }, [property.id]);

  const handleAddRoom = () => {
    const room: AdminRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      property_id: property.id,
      room_type_id: '',
      room_type_name: 'Standard',
      bed_type_id: '',
      bed_name: 'Double',
      room_name: 'New Room',
      floor_number: 1,
      max_adults: 2,
      max_children: 0,
      max_occupancy: 2,
      base_rate: 1,
      status: 'AVAILABLE',
      smoking: false,
      accessible: false,
      cancellation_policy: 'MODERATE',
      cancellation_notes: null,
      photos: [],
      amenities: [],
      blocked_dates: [],
      maintenance_return_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addRoom(room);
    setEditingRoom(room);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {(['all', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && { backgroundColor: ACCENT }]}>
              <Text style={[styles.filterText, filter === f && { color: BG.white }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {localOnlyCount > 0 && (
          <TouchableOpacity onPress={handleSync} disabled={syncing}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FEF3C7', borderRadius: RADIUS.card, marginLeft: 8, borderWidth: 1, borderColor: '#F59E0B' }}>
            {syncing ? (
              <ActivityIndicator size={12} color="#D97706" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={14} color="#D97706" />
            )}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>
              {syncing ? 'Syncing…' : `Sync ${localOnlyCount}`}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleAddRoom} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: ACCENT, borderRadius: RADIUS.card, marginLeft: 8 }}>
          <Text style={{ ...TYPOGRAPHY.small, fontWeight: '700', color: BG.white }}>+ Room</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Ionicons name="bed-outline" size={48} color={GRAY[300]} />
            <Text style={{ ...TYPOGRAPHY.subtitle, fontWeight: '600', color: GRAY[400], marginTop: 12 }}>No rooms yet</Text>
            <Text style={{ fontSize: 13, color: GRAY[300], marginTop: 4, textAlign: 'center' }}>Create rooms via the listing wizard{'\n'}or add them from the room editor</Text>
          </View>
        ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {filtered.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.roomCard, { borderLeftColor: getRoomStatusColor(r.status) }]}
              activeOpacity={0.85}
              onPress={() => setEditingRoom(r)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={styles.roomName}>{r.room_name}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {!UUID_RE.test(r.id) && (
                    <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cloud-offline-outline" size={14} color="#D97706" />
                    </View>
                  )}
                  <TouchableOpacity onPress={() => setEditingRoom(r)} style={styles.editIcon}>
                    <Ionicons name="create-outline" size={14} color={GRAY[400]} />
                  </TouchableOpacity>
                </View>
              </View>

              {r.photos.length > 0 ? (
                <Image source={{ uri: r.photos[0] }} style={{ width: '100%', height: 80, borderRadius: RADIUS.card, marginVertical: 4 }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: 80, borderRadius: RADIUS.card, marginVertical: 4, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={24} color={GRAY[300]} />
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: getRoomStatusColor(r.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getRoomStatusColor(r.status) }]}>{r.status}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="layers-outline" size={12} color={GRAY[400]} />
                  <Text style={styles.detailText}>Fl {r.floor_number}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={12} color={GRAY[400]} />
                  <Text style={styles.detailText}>{getRoomCapacitySummary(r)}</Text>
                </View>
              </View>

              <Text style={styles.rate}>${r.base_rate}/night</Text>

              {r.amenities.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {r.amenities.slice(0, 3).map((a, i) => (
                    <View key={i} style={styles.amenityChip}>
                      <Text style={styles.amenityText}>{a}</Text>
                    </View>
                  ))}
                  {r.amenities.length > 3 && (
                    <Text style={styles.moreAmenities}>+{r.amenities.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        )}
      </ScrollView>

      <RoomEditModal room={editingRoom} visible={!!editingRoom} onClose={() => setEditingRoom(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: GRAY[100], marginRight: 8 },
  filterText: { ...TYPOGRAPHY.small, fontWeight: '600', color: SLATE[600] },
  roomCard: {
    width: '47%', backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14,
    borderLeftWidth: 3, gap: 6,
    ...SHADOWS.card,
  },
  roomName: { ...TYPOGRAPHY.subtitle, fontWeight: '800', color: GRAY[900] },
  editIcon: { width: 28, height: 28, borderRadius: 7, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  badgeText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  detailRow: { gap: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: GRAY[500] },
  rate: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: GRAY[100] },
  amenityText: { ...TYPOGRAPHY.caption, color: SLATE[600] },
  moreAmenities: { ...TYPOGRAPHY.caption, color: GRAY[400], alignSelf: 'center' },
});
