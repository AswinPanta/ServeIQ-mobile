import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { safeGoBack } from '@/lib/utils';
import { BG, SRS as SRSTokens, AMBER, RED, EMERALD, BLUE } from '@/lib/constants/figma-tokens';
import type { FrontDeskRoom } from '@/lib/context/frontdesk-context';

type DayStatus = 'available' | 'occupied' | 'reserved' | 'turn' | 'maintenance' | 'blocked';

interface FloorData {
  floorNumber: number;
  label: string;
  rooms: FrontDeskRoom[];
}

const STATUS_CELL: Record<DayStatus, { bg: string; text: string; label: string }> = {
  available: { bg: EMERALD[50], text: SRSTokens.green, label: 'Free' },
  occupied: { bg: AMBER[500] + '20', text: SRSTokens.orange, label: 'Occ' },
  reserved: { bg: BLUE[50], text: BLUE[500], label: 'Rsv' },
  turn: { bg: AMBER[100], text: SRSTokens.orange, label: 'Turn' },
  maintenance: { bg: RED[500] + '12', text: RED[500], label: 'Mnt' },
  blocked: { bg: RED[500] + '12', text: RED[500], label: 'Blk' },
};

const VIEW_MODES: { key: 'day' | '7days' | '14days' | 'month'; label: string; days: number }[] = [
  { key: 'day', label: 'Day', days: 1 },
  { key: '7days', label: '7 Days', days: 7 },
  { key: '14days', label: '14 Days', days: 14 },
  { key: 'month', label: 'Month', days: 30 },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayHeader(date: Date): { top: string; bottom: string; isWeekend: boolean } {
  return {
    top: date.toLocaleDateString('en-US', { weekday: 'short' }),
    bottom: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  };
}

/** Front-desk room status → grid day status (booking presence refines occupied days). */
function roomDayStatus(
  room: FrontDeskRoom,
  bookings: { check_in: string; check_out: string; status: string }[] | undefined,
  day: Date,
): DayStatus {
  const base: DayStatus =
    room.status === 'occupied' ? 'occupied'
    : room.status === 'maintenance' ? 'maintenance'
    : room.status === 'dirty' ? 'turn'
    : 'available';
  if (!bookings || bookings.length === 0) return base;
  const t = day.getTime();
  const covering = bookings.find(b => {
    const inD = new Date(b.check_in); inD.setHours(0, 0, 0, 0);
    const outD = new Date(b.check_out); outD.setHours(0, 0, 0, 0);
    return t >= inD.getTime() && t < outD.getTime();
  });
  if (!covering) return base;
  const s = (covering.status || '').toUpperCase();
  if (s === 'CHECKED_IN') return 'occupied';
  if (s === 'CONFIRMED' || s === 'PENDING') return 'reserved';
  if (s === 'CHECKED_OUT') return 'turn';
  return base;
}

export default function RoomStatusScreen() {
  const { rooms, roomCalendarData, getRoom } = useFrontDesk();
  const [viewMode, setViewMode] = useState<'day' | '7days' | '14days' | 'month'>('7days');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [floorFilter, setFloorFilter] = useState<number | null>(null);

  const daysCount = VIEW_MODES.find(v => v.key === viewMode)?.days ?? 7;
  const dates = useMemo(
    () => Array.from({ length: daysCount }, (_, i) => addDays(startDate, i)),
    [startDate, daysCount],
  );
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Calendar bookings keyed by room name (authoritative per-day occupancy)
  const calendarByRoom = useMemo(() => {
    const map = new Map<string, { check_in: string; check_out: string; status: string }[]>();
    roomCalendarData?.rooms?.forEach(r => {
      if (r.room_name) map.set(r.room_name, r.bookings || []);
    });
    return map;
  }, [roomCalendarData]);

  const floors = useMemo<FloorData[]>(() => {
    const map = new Map<number, FrontDeskRoom[]>();
    rooms.forEach(r => {
      const fn = r.floor ?? 0;
      if (!map.has(fn)) map.set(fn, []);
      map.get(fn)!.push(r);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([floorNumber, floorRooms]) => ({
        floorNumber,
        label: `Floor ${floorNumber}`,
        rooms: [...floorRooms].sort((a, b) => a.room_number.localeCompare(b.room_number)),
      }));
  }, [rooms]);

  const filteredFloors = floorFilter === null ? floors : floors.filter(f => f.floorNumber === floorFilter);

  const todayCount = useMemo(() => {
    const key = dateKey(today);
    return rooms.filter(r => {
      const cal = calendarByRoom.get(r.room_number);
      const st = roomDayStatus(r, cal, today);
      if (st === 'occupied' || st === 'reserved') return true;
      // Fall back to calendar lookup by date key when no covering booking found above
      return cal?.some(b => b.check_in.slice(0, 10) <= key && key < b.check_out.slice(0, 10) && b.status?.toUpperCase() !== 'CANCELLED') ?? false;
    }).length;
  }, [rooms, calendarByRoom, today]);

  const navigate = (direction: number) => {
    setStartDate(prev => addDays(prev, direction * daysCount));
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };

  const rangeLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(startDate, daysCount - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const showCell = (roomNumber: string, day: Date, status: DayStatus) => {
    const room = getRoom(roomNumber);
    const info = STATUS_CELL[status];
    const guest = room?.guest_name;
    Alert.alert(
      `Room ${roomNumber} — ${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
      `Status: ${info.label}${guest ? `\nGuest: ${guest}` : ''}${room?.room_type ? `\nType: ${room.room_type}` : ''}`,
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.title}>Room Status</Text>
            <View style={s.liveBadge}>
              <Text style={s.liveBadgeText}>Live Grid</Text>
            </View>
          </View>
          <Text style={s.sub}>{daysCount}-night view · {todayCount} booked today · tap a cell for details</Text>
        </View>
      </View>

      {/* Date navigation */}
      <View style={s.navRow}>
        <TouchableOpacity onPress={() => navigate(-1)} style={s.navBtn}>
          <IconSymbol name="chevron.left" size={18} color={GRAY[600]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToday} style={s.todayBtn}>
          <Text style={s.todayText}>Today · {rangeLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigate(1)} style={s.navBtn}>
          <IconSymbol name="chevron.right" size={18} color={GRAY[600]} />
        </TouchableOpacity>
      </View>

      {/* View mode + floor filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
        {VIEW_MODES.map(v => (
          <TouchableOpacity
            key={v.key}
            onPress={() => { setViewMode(v.key); setStartDate(today); }}
            style={[s.viewChip, viewMode === v.key && s.viewChipActive]}
          >
            <Text style={[s.viewChipText, viewMode === v.key && { color: BG.white }]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ width: SPACING.md }} />
        {floors.length > 1 && (
          <>
            <TouchableOpacity
              onPress={() => setFloorFilter(null)}
              style={[s.viewChip, floorFilter === null && s.viewChipActive]}
            >
              <Text style={[s.viewChipText, floorFilter === null && { color: BG.white }]}>All Floors</Text>
            </TouchableOpacity>
            {floors.map(f => (
              <TouchableOpacity
                key={f.floorNumber}
                onPress={() => setFloorFilter(floorFilter === f.floorNumber ? null : f.floorNumber)}
                style={[s.viewChip, floorFilter === f.floorNumber && s.viewChipActive]}
              >
                <Text style={[s.viewChipText, floorFilter === f.floorNumber && { color: BG.white }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Legend */}
      <View style={s.legendRow}>
        {(['available', 'occupied', 'reserved', 'turn', 'maintenance'] as DayStatus[]).map(st => (
          <View key={st} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: STATUS_CELL[st].text }]} />
            <Text style={s.legendText}>{STATUS_CELL[st].label}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {filteredFloors.length === 0 ? (
          <View style={s.emptyState}>
            <IconSymbol name="rooms" size={40} color={GRAY[300]} />
            <Text style={s.emptyText}>No rooms synced yet</Text>
          </View>
        ) : (
          filteredFloors.map(floor => (
            <View key={floor.floorNumber} style={s.floorCard}>
              <Text style={s.floorLabel}>{floor.label} · {floor.rooms.length} rooms</Text>
              {/* Day headers */}
              <View style={s.gridRow}>
                <View style={s.roomCol} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row' }}>
                    {dates.map((day, i) => {
                      const h = dayHeader(day);
                      const isToday = day.getTime() === today.getTime();
                      return (
                        <View key={i} style={[s.dayCol, isToday && s.dayColToday, daysCount > 14 && s.dayColNarrow]}>
                          <Text style={[s.dayTop, h.isWeekend && { color: SRSTokens.orange }]}>{h.top}</Text>
                          <Text style={s.dayBottom}>{h.bottom}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
              {/* Room rows */}
              {floor.rooms.map(room => (
                <View key={room.id} style={s.gridRow}>
                  <View style={s.roomCol}>
                    <Text style={s.roomNum} numberOfLines={1}>{room.room_number}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row' }}>
                      {dates.map((day, i) => {
                        const cal = calendarByRoom.get(room.room_number);
                        const st = roomDayStatus(room, cal, day);
                        const info = STATUS_CELL[st];
                        const isToday = day.getTime() === today.getTime();
                        return (
                          <TouchableOpacity
                            key={i}
                            onPress={() => showCell(room.room_number, day, st)}
                            style={[
                              s.cell,
                              { backgroundColor: info.bg },
                              isToday && s.cellToday,
                              daysCount > 14 && s.cellNarrow,
                            ]}
                          >
                            <Text style={[s.cellText, { color: info.text }]}>{info.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  liveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: BLUE[50], borderWidth: 1, borderColor: BLUE[500] + '40' },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: BLUE[500] },

  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  navBtn: { width: 34, height: 34, borderRadius: RADIUS.card, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200], alignItems: 'center', justifyContent: 'center' },
  todayBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.card, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200], alignItems: 'center' },
  todayText: { fontSize: 13, fontWeight: '700', color: SRS.navy },

  filterScroll: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingBottom: SPACING.sm },
  viewChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200] },
  viewChipActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  viewChipText: { fontSize: 12, fontWeight: '600', color: GRAY[600] },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: GRAY[500] },

  floorCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[100], padding: SPACING.md },
  floorLabel: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },

  gridRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  roomCol: { width: 56 },
  roomNum: { fontSize: 12, fontWeight: '700', color: SRS.navy },
  dayCol: { width: 52, alignItems: 'center', paddingVertical: 4 },
  dayColNarrow: { width: 34 },
  dayColToday: { backgroundColor: SRS.teal + '10', borderRadius: 6 },
  dayTop: { fontSize: 10, fontWeight: '700', color: GRAY[500] },
  dayBottom: { fontSize: 9, color: GRAY[400] },
  cell: { width: 52, height: 30, borderRadius: 6, marginRight: 3, alignItems: 'center', justifyContent: 'center' },
  cellNarrow: { width: 34 },
  cellToday: { borderWidth: 1.5, borderColor: SRS.teal },
  cellText: { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.md },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },
});
