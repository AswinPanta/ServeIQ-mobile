import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeGoBack } from '@/lib/utils';
import { ScreenContainer } from '@/components/screen-container';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useAuth } from '@/lib/context/auth-context';
import { operationsApi } from '@/lib/api/operations-api';
import type { BackendRoomStatusItem, BackendRoomStatusSummary } from '@/types/api';
import { SRS, SLATE, BG, BLUE, EMERALD, AMBER, RED } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY, SHADOWS, TYPOGRAPHY, SPACING } from '@/constants/portal-theme';

const DARK = SLATE[900];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map backend task_status to a display-friendly status */
function mapTaskStatus(item: BackendRoomStatusItem): string {
  const ts = (item.task_status || '').toUpperCase();
  if (ts.includes('IN_PROGRESS') || ts.includes('CLEANING')) return 'dirty';
  if (ts.includes('INSPECTED') || ts.includes('CLEAN')) return 'available';
  if (ts.includes('MAINTENANCE') || ts.includes('BLOCKED')) return 'maintenance';
  if (ts.includes('DIRTY') || ts.includes('CHECKED_OUT')) return 'dirty';
  // Default: if no task status, assume available
  return 'available';
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  available: { bg: EMERALD[50], text: SRS.green, border: SRS.green },
  occupied: { bg: RED[50], text: RED[500], border: RED[500] },
  maintenance: { bg: AMBER[50], text: SRS.orange, border: SRS.orange },
  dirty: { bg: SLATE[50], text: SLATE[500], border: SLATE[400] },
};

const FILTER_CHIPS = [
  { key: 'available', label: 'Available', color: SRS.green },
  { key: 'occupied', label: 'Occupied', color: RED[500] },
  { key: 'dirty', label: 'Dirty', color: SLATE[400] },
  { key: 'maintenance', label: 'Maintenance', color: SRS.orange },
];

export default function RoomPlanScreen() {
  const { rooms: contextRooms } = useFrontDesk();
  const { user } = useAuth();
  const [activeFloor, setActiveFloor] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [backendRooms, setBackendRooms] = useState<BackendRoomStatusItem[]>([]);
  const [summary, setSummary] = useState<BackendRoomStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    const propId = (user as { property_id?: string } | null)?.property_id;
    if (!propId || !UUID_RE.test(propId)) return;
    setRefreshing(true);
    Promise.all([
      operationsApi.getRoomStatus(propId),
      operationsApi.getRoomStatusSummary(propId),
    ])
      .then(([rooms, s]) => {
        if (rooms.length > 0) setBackendRooms(rooms);
        if (s) setSummary(s);
      })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [user]);

  // Initial fetch
  useEffect(() => {
    const propId = (user as { property_id?: string } | null)?.property_id;
    if (!propId || !UUID_RE.test(propId)) { setLoading(false); return; }
    let cancelled = false;
    Promise.all([
      operationsApi.getRoomStatus(propId),
      operationsApi.getRoomStatusSummary(propId),
    ])
      .then(([rooms, s]) => {
        if (cancelled) return;
        if (rooms.length > 0) setBackendRooms(rooms);
        if (s) setSummary(s);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  // Build the room list: prefer backend data, fall back to context rooms
  const rooms = useMemo<{ id: string; room_number: string; floor: number; status: string; room_type: string; assigned_to?: string | null; last_cleaned?: string | null }[]>(() => {
    if (backendRooms.length > 0) {
      return backendRooms.map(r => ({
        id: r.id,
        room_number: r.room_name,
        floor: r.floor_number,
        status: mapTaskStatus(r),
        room_type: r.room_type,
        assigned_to: r.assigned_to,
        last_cleaned: r.last_cleaned,
      }));
    }
    return contextRooms.map(r => ({
      id: r.id,
      room_number: r.room_number,
      floor: r.floor,
      status: r.status,
      room_type: r.room_type || '',
    }));
  }, [backendRooms, contextRooms]);

  // Dynamic floor list based on actual data
  const floors = useMemo(() => {
    const floorSet = new Set(rooms.map(r => r.floor).filter(Boolean));
    const sorted = Array.from(floorSet).sort((a, b) => a - b);
    return ['All', ...sorted.map(f => `Floor ${f}`)];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let list = rooms;
    if (activeFloor > 0) {
      const floorNum = activeFloor;
      list = list.filter(r => r.floor === floorNum);
    }
    if (activeFilter) {
      list = list.filter(r => r.status === activeFilter);
    }
    return list.sort((a, b) => a.room_number.localeCompare(b.room_number));
  }, [rooms, activeFloor, activeFilter]);

  // Use backend summary for counts if available, otherwise compute from rooms
  const statusCounts = useMemo(() => {
    if (summary) {
      return {
        available: summary.available_rooms + summary.inspected_rooms + summary.booked_rooms,
        occupied: summary.occupied_rooms,
        dirty: summary.dirty_rooms + summary.cleaning_rooms + summary.in_progress_rooms,
        maintenance: summary.maintenance_rooms + summary.blocked_rooms + summary.out_of_service_rooms,
      };
    }
    const counts: Record<string, number> = { available: 0, occupied: 0, maintenance: 0, dirty: 0 };
    rooms.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [summary, rooms]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[SRS.teal]} tintColor={SRS.teal} />}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={DARK} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Room Plan</Text>
          {loading && <ActivityIndicator size="small" color={SRS.teal} style={{ marginRight: 4 }} />}
        </View>

        {/* Summary Bar */}
        {summary && (
          <View style={s.summaryBar}>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: SRS.green }]}>{summary.available_rooms}</Text>
              <Text style={s.summaryLabel}>Available</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: RED[500] }]}>{summary.occupied_rooms}</Text>
              <Text style={s.summaryLabel}>Occupied</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: SLATE[500] }]}>{summary.dirty_rooms}</Text>
              <Text style={s.summaryLabel}>Dirty</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: SRS.orange }]}>{summary.maintenance_rooms}</Text>
              <Text style={s.summaryLabel}>Maint.</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: SRS.teal }]}>{summary.in_progress_rooms + summary.cleaning_rooms}</Text>
              <Text style={s.summaryLabel}>Cleaning</Text>
            </View>
          </View>
        )}

        {/* Floor Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.floorScroll} contentContainerStyle={{ gap: 8 }}>
          {floors.map((f, i) => (
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
                  {chip.label} ({statusCounts[chip.key as keyof typeof statusCounts] || 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Room Grid */}
        <View style={s.section}>
          <Text style={s.floorTitle}>{floors[activeFloor]} — {filteredRooms.length} rooms</Text>
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
                  {room.assigned_to && (
                    <Text style={s.roomGuest} numberOfLines={1}>👤 {room.assigned_to}</Text>
                  )}
                  {room.last_cleaned && (
                    <Text style={s.roomMeta} numberOfLines={1}>Last cleaned: {new Date(room.last_cleaned).toLocaleDateString()}</Text>
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

  summaryBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: BG.white, borderRadius: RADIUS.card, padding: 12, gap: 4, ...SHADOWS.card },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: 9, fontWeight: '600', color: SLATE[400], textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },

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
  roomMeta: { fontSize: 8, color: SLATE[400], marginTop: 1, maxWidth: '100%' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: SLATE[400] },
});
