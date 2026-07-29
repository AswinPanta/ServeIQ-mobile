import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property, AdminRoom } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { RoomEditModal } from '@/components/host/RoomEditModal';
import { getRoomStatusColor, getRoomCapacitySummary } from '@/lib/host/capacity-validation';

const ACCENT = '#2E86AB';

interface Props { property: Property }

export function PropertyRooms({ property }: Props) {
  const { getFilteredRooms, addRoom } = useHost();
  const rooms = getFilteredRooms(property.id);
  const [filter, setFilter] = React.useState<string>('all');
  const [editingRoom, setEditingRoom] = React.useState<AdminRoom | null>(null);

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  const handleAddRoom = () => {
    const room: AdminRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      property_id: property.id,
      room_type_id: '',
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {(['all', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && { backgroundColor: ACCENT }]}>
              <Text style={[styles.filterText, filter === f && { color: '#FFF' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={handleAddRoom} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: ACCENT, borderRadius: 8, marginLeft: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>+ Room</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Ionicons name="bed-outline" size={48} color="#CBD5E1" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 12 }}>No rooms yet</Text>
            <Text style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4, textAlign: 'center' }}>Create rooms via the listing wizard{'\n'}or add them from the room editor</Text>
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
                <TouchableOpacity onPress={() => setEditingRoom(r)} style={styles.editIcon}>
                  <Ionicons name="create-outline" size={14} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {r.photos.length > 0 ? (
                <Image source={{ uri: r.photos[0] }} style={{ width: '100%', height: 80, borderRadius: 8, marginVertical: 4 }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: 80, borderRadius: 8, marginVertical: 4, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={24} color="#CBD5E1" />
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: getRoomStatusColor(r.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getRoomStatusColor(r.status) }]}>{r.status}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="layers-outline" size={12} color="#94A3B8" />
                  <Text style={styles.detailText}>Fl {r.floor_number}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={12} color="#94A3B8" />
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
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9', marginRight: 8 },
  filterText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  roomCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    borderLeftWidth: 3, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  roomName: { fontSize: 16, fontWeight: '800', color: '#111' },
  editIcon: { width: 28, height: 28, borderRadius: 7, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  detailRow: { gap: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: '#64748B' },
  rate: { fontSize: 14, fontWeight: '700', color: '#111' },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#F1F5F9' },
  amenityText: { fontSize: 10, color: '#475569' },
  moreAmenities: { fontSize: 10, color: '#94A3B8', alignSelf: 'center' },
});
