import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, STATUS_COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useShiftStore } from '@/stores/useShiftStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { SystemFlowBar } from '@/components/operations/SystemFlowBar';
import { StatusBadge } from '@/components/ui/StatusBadge';

const QUICK_ACTIONS = [
  { id: 'new-booking', label: 'New Booking', icon: 'booking' as const, desc: 'Walk-in or phone booking', href: 'new-booking' as const, color: '#2980B9' },
  { id: 'check-in', label: 'Check-in', icon: 'checkin' as const, desc: 'Process guest arrival', href: 'check-in' as const, color: '#1E8449' },
  { id: 'check-out', label: 'Check-out', icon: 'checkout' as const, desc: 'Process guest departure', href: 'check-out' as const, color: '#D35400' },
];

const STEP_STATUS = ['available', 'occupied', 'dirty', 'maintenance'] as const;
const STATUS_LABELS: Record<string, string> = { available: 'Available', occupied: 'Occupied', dirty: 'Dirty', maintenance: 'Maint.' };

export default function FrontDeskDashboard() {
  const { rooms, bookings, summaryStats, updateRoomStatus } = useFrontDesk();
  const shiftCheckIns = useShiftStore((s) => s.checkIns);

  const bookingTotal = useMemo(() => bookings.length, [bookings]);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const showStatusMenu = (room: typeof rooms[0]) => {
    const isMaintenance = room.status === 'maintenance';
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];
    if (isMaintenance) {
      buttons.push({ text: 'Mark as Available', onPress: () => updateRoomStatus(room.room_number, 'available') });
    }
    if (room.status !== 'maintenance') {
      buttons.push({ text: 'Mark as Maintenance', onPress: () => updateRoomStatus(room.room_number, 'maintenance') });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(`Room ${room.room_number}`, 'Change room status:', buttons);
  };

  const filteredRooms = statusFilter ? rooms.filter((r) => r.status === statusFilter) : rooms;
  const statusCounts: Record<string, number> = {};
  rooms.forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const sortedRooms = [...filteredRooms].sort((a, b) => Number(a.room_number) - Number(b.room_number));
  const todayBookings = [...bookings].filter((b) => b.status === 'confirmed' || b.status === 'checked_in');

  const systemBarItems = [
    { label: 'Booking', count: bookingTotal, active: true },
    { label: 'Check-In', count: shiftCheckIns },
    { label: 'Room', count: rooms.length },
    { label: 'Folio' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Front Desk</Text>
          <Text style={styles.headerSub}>Room management & guest operations</Text>
        </View>
      </View>

      <SystemFlowBar items={systemBarItems} />

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, SHADOWS.card]}>
          <View style={[styles.kpiIcon, { backgroundColor: SRS.green + '18' }]}>
            <IconSymbol name="checkin" size={16} color={SRS.green} />
          </View>
          <Text style={styles.kpiValue}>{shiftCheckIns}</Text>
          <Text style={styles.kpiLabel}>Check-ins</Text>
        </View>
        <View style={[styles.kpiCard, SHADOWS.card]}>
          <View style={[styles.kpiIcon, { backgroundColor: STATUS_COLORS.confirmed + '18' }]}>
            <IconSymbol name="booking" size={16} color={STATUS_COLORS.confirmed} />
          </View>
          <Text style={styles.kpiValue}>{summaryStats.arrivals}</Text>
          <Text style={styles.kpiLabel}>Arrivals</Text>
        </View>
        <View style={[styles.kpiCard, SHADOWS.card]}>
          <View style={[styles.kpiIcon, { backgroundColor: STATUS_COLORS.checked_in + '18' }]}>
            <IconSymbol name="hotel" size={16} color={STATUS_COLORS.checked_in} />
          </View>
          <Text style={styles.kpiValue}>{summaryStats.inHouse}</Text>
          <Text style={styles.kpiLabel}>In House</Text>
        </View>
        <View style={[styles.kpiCard, SHADOWS.card]}>
          <View style={[styles.kpiIcon, { backgroundColor: SRS.orange + '18' }]}>
            <IconSymbol name="checkout" size={16} color={SRS.orange} />
          </View>
          <Text style={styles.kpiValue}>{summaryStats.departures}</Text>
          <Text style={styles.kpiLabel}>Departures</Text>
        </View>
      </View>

      {/* Room Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {statusFilter ? `Rooms — ${STATUS_LABELS[statusFilter]}` : 'All Rooms'}
            <Text style={styles.sectionCount}> ({filteredRooms.length})</Text>
          </Text>
          {statusFilter && (
            <TouchableOpacity onPress={() => setStatusFilter(null)}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {STEP_STATUS.map((s) => {
              const color = STATUS_COLORS[s];
              const active = statusFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatusFilter(active ? null : s)}
                  style={[styles.filterChip, { backgroundColor: active ? color : color + '15' }]}
                >
                  <View style={[styles.filterDot, { backgroundColor: active ? '#FFF' : color }]} />
                  <Text style={[styles.filterText, { color: active ? '#FFF' : color }]}>
                    {STATUS_LABELS[s]} ({statusCounts[s] || 0})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.roomGrid}>
          {sortedRooms.map((room) => {
            const color = STATUS_COLORS[room.status] || GRAY[400];
            const canOverride = room.status !== 'occupied';
            return (
              <View key={room.id} style={[styles.roomCard, { borderColor: color + '25', backgroundColor: color + '08' }]}>
                {canOverride && (
                  <TouchableOpacity
                    onPress={() => showStatusMenu(room)}
                    style={styles.roomMenu}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconSymbol name="more.vert" size={14} color={GRAY[500]} />
                  </TouchableOpacity>
                )}
                <Text style={styles.roomNumber}>{room.room_number}</Text>
                <Text style={styles.roomType}>{room.room_type || ''}</Text>
                <View style={[styles.roomDot, { backgroundColor: color }]} />
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => router.push(`/(operations)/front-desk/${a.href}`)}
              style={[styles.actionCard, SHADOWS.card]}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '14' }]}>
                <IconSymbol name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionDesc}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Today's Bookings
          <Text style={styles.sectionCount}> ({todayBookings.length})</Text>
        </Text>
        {todayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="booking" size={32} color={GRAY[300]} />
            <Text style={styles.emptyText}>No bookings today</Text>
          </View>
        ) : (
          todayBookings.map((b) => {
            const isConfirmed = b.status === 'confirmed';
            const color = isConfirmed ? '#2980B9' : '#1E8449';
            const label = isConfirmed ? 'Arriving' : 'In House';
            return (
              <View key={b.ref} style={[styles.bookingRow]}>
                <View style={[styles.bookingIconWrap, { backgroundColor: SRS.teal + '12' }]}>
                  <Text style={[styles.bookingRoomNumber, { color: SRS.teal }]}>{b.room_number || '-'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingGuestName}>{b.guest_name}</Text>
                  <Text style={styles.bookingMeta}>{b.room_type} · {b.ref}</Text>
                </View>
                <StatusBadge label={label} color={color} size="sm" />
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY[50],
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: SRS.navy,
  },
  headerSub: {
    ...TYPOGRAPHY.small,
    color: GRAY[500],
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: SRS.navy,
    fontVariant: ['tabular-nums' as any],
  },
  kpiLabel: {
    ...TYPOGRAPHY.caption,
    color: GRAY[500],
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: SRS.navy,
    fontWeight: '700',
  },
  sectionCount: {
    ...TYPOGRAPHY.body,
    color: GRAY[400],
    fontWeight: '400',
  },
  clearBtn: {
    ...TYPOGRAPHY.small,
    color: SRS.teal,
    fontWeight: '600',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  roomCard: {
    width: '31%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
  },
  roomMenu: {
    position: 'absolute',
    top: 6,
    right: 8,
    zIndex: 1,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: SRS.navy,
  },
  roomType: {
    ...TYPOGRAPHY.caption,
    color: GRAY[500],
    marginTop: 2,
  },
  roomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    backgroundColor: '#FFF',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  actionLabel: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '700',
    color: SRS.navy,
  },
  actionDesc: {
    ...TYPOGRAPHY.caption,
    color: GRAY[500],
    textAlign: 'center',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: GRAY[100],
  },
  bookingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bookingRoomNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  bookingGuestName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: SRS.navy,
  },
  bookingMeta: {
    ...TYPOGRAPHY.small,
    color: GRAY[500],
    marginTop: 1,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: GRAY[400],
  },
});
