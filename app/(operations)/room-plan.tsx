import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { SRS, SLATE, BG, BLUE, EMERALD, AMBER, RED } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY } from '@/constants/portal-theme';

const DARK = SLATE[900];

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  available: { bg: EMERALD[50], text: SRS.green, border: SRS.green },
  occupied: { bg: RED[50], text: RED[500], border: RED[500] },
  maintenance: { bg: AMBER[50], text: SRS.orange, border: SRS.orange },
  dirty: { bg: SLATE[50], text: SLATE[500], border: SLATE[400] },
};

const FLOORS = ['All', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'];

const FILTER_CHIPS = [
  { key: 'available', label: 'Available', color: SRS.green },
  { key: 'occupied', label: 'Occupied', color: RED[500] },
  { key: 'dirty', label: 'Dirty', color: SLATE[400] },
  { key: 'maintenance', label: 'Maintenance', color: SRS.orange },
];

export default function RoomPlanScreen() {
  const { rooms } = useFrontDesk();
  const [activeFloor, setActiveFloor] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredRooms = useMemo(() => {
    let list = rooms;
    if (activeFloor > 0) {
      const floorNum = activeFloor;
      list = list.filter(r => {
        const roomFloor = parseInt(r.room_number.charAt(0), 10) || 1;
        return roomFloor === floorNum;
      });
    }
    if (activeFilter) {
      list = list.filter(r => r.status === activeFilter);
    }
    return list.sort((a, b) => a.room_number.localeCompare(b.room_number));
  }, [rooms, activeFloor, activeFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { available: 0, occupied: 0, maintenance: 0, dirty: 0 };
    rooms.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [rooms]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={DARK} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Room Plan</Text>
          <TouchableOpacity style={s.filterBtn}>
            <Ionicons name="filter-outline" size={18} color={DARK} />
          </TouchableOpacity>
        </View>

        {/* Floor Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.floorScroll} contentContainerStyle={{ gap: 8 }}>
          {FLOORS.map((f, i) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFloor(i)}
              style={[s.floorTab, activeFloor === i && s.floorTabActive]}
            >
              <Text style={[s.floorTabText, activeFloor === i && s.floorTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Chips */}
        <View style={s.filterRow}>
          {FILTER_CHIPS.map(chip => {
            const active = activeFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setActiveFilter(active ? null : chip.key)}
                style={[s.filterChip, { backgroundColor: active ? chip.color : chip.color + '12', borderColor: active ? chip.color : chip.color + '25' }]}
              >
                <View style={[s.filterDot, { backgroundColor: active ? BG.white : chip.color }]} />
                <Text style={[s.filterText, { color: active ? BG.white : chip.color }]}>
                  {chip.label} ({statusCounts[chip.key] || 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Room Grid */}
        <View style={s.section}>
          <Text style={s.floorTitle}>{FLOORS[activeFloor]} — {filteredRooms.length} rooms</Text>
          <View style={s.roomGrid}>
            {filteredRooms.map(room => {
              const st = STATUS_STYLE[room.status] || STATUS_STYLE.available;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[s.roomCard, { backgroundColor: st.bg, borderColor: st.border + '40' }]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.roomNumber, { color: st.text }]}>{room.room_number}</Text>
                  <Text style={s.roomType}>{room.room_type || ''}</Text>
                  {room.guest_name && (
                    <Text style={s.roomGuest} numberOfLines={1}>{room.guest_name}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {filteredRooms.length === 0 && (
            <View style={s.emptyState}>
              <Ionicons name="bed-outline" size={40} color={SLATE[300]} />
              <Text style={s.emptyText}>No rooms match the filter</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },

  floorScroll: { paddingHorizontal: 16, paddingBottom: 12 },
  floorTab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200] },
  floorTabActive: { backgroundColor: BLUE[600], borderColor: BLUE[600] },
  floorTabText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  floorTabTextActive: { color: BG.white },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { fontSize: 11, fontWeight: '700' },

  section: { paddingHorizontal: 16 },
  floorTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 12 },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomCard: { width: '23%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  roomNumber: { fontSize: 16, fontWeight: '700' },
  roomType: { fontSize: 9, color: SLATE[400], marginTop: 2 },
  roomGuest: { fontSize: 8, color: SLATE[500], marginTop: 2, maxWidth: '100%' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: SLATE[400] },
});
