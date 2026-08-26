import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { BottomTabBar } from '@/components/operations/BottomTabBar';
import { useAuth } from '@/lib/context/auth-context';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { OperatorProfile } from '@/types/api';
import { SRS, BG, SLATE, BLUE, EMERALD, AMBER, RED, ORANGE, PURPLE, PINK } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY, SHADOWS } from '@/constants/portal-theme';

const DARK = SLATE[900];

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: EMERALD[50], text: SRS.green, dot: SRS.green },
  occupied: { bg: RED[50], text: RED[500], dot: RED[500] },
  dirty: { bg: SLATE[50], text: SLATE[500], dot: SLATE[400] },
  maintenance: { bg: AMBER[50], text: SRS.orange, dot: SRS.orange },
};

export default function OperationsDashboard() {
  const { user } = useAuth();
  const operator = user as OperatorProfile | null;
  const {
    rooms, arrivingGuests, departingToday, checkedInGuests,
    summaryStats, occupancySnapshot,
  } = useFrontDesk();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockStartTime, setClockStartTime] = useState<Date | null>(null);
  const [elapsedTick, setElapsedTick] = useState(0);

  const handleClockToggle = () => {
    if (isClockedIn) {
      setIsClockedIn(false);
      setClockStartTime(null);
    } else {
      setIsClockedIn(true);
      setClockStartTime(new Date());
    }
  };

  // Update elapsed time every 30 seconds while clocked in
  useEffect(() => {
    if (!isClockedIn) return;
    const interval = setInterval(() => {
      setElapsedTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const elapsed = useMemo(() => {
    if (!clockStartTime) return '0h 00m';
    const diff = Date.now() - clockStartTime.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }, [clockStartTime, elapsedTick]);

  // Room status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { available: 0, occupied: 0, dirty: 0, maintenance: 0 };
    rooms.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [rooms]);

  // Rooms grouped by floor for status display
  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, typeof rooms> = {};
    rooms.forEach(r => {
      const floorNum = parseInt(r.room_number.charAt(0), 10) || 1;
      if (!grouped[floorNum]) grouped[floorNum] = [];
      grouped[floorNum].push(r);
    });
    return grouped;
  }, [rooms]);

  // Pending payments summary
  const pendingPayments = useMemo(() => {
    return arrivingGuests.reduce((sum, b) => sum + (b.balance || 0), 0);
  }, [arrivingGuests]);

  // Dynamic tasks derived from room and booking data
  const assignedTasks = useMemo(() => {
    const tasks: { id: string; label: string; time: string; status: string; color: string }[] = [];
    let taskId = 1;

    // VIP arrivals as tasks
    arrivingGuests.filter(b => b.vip).slice(0, 2).forEach(b => {
      tasks.push({
        id: String(taskId++),
        label: `Welcome VIP Guest — ${b.guest_name}`,
        time: '',
        status: 'pending',
        color: SRS.teal,
      });
    });

    // Dirty rooms need cleaning
    rooms.filter(r => r.status === 'dirty').slice(0, 3).forEach(r => {
      tasks.push({
        id: String(taskId++),
        label: `Clean Room ${r.room_number}`,
        time: '',
        status: 'in_progress',
        color: SRS.orange,
      });
    });

    // Pending balance follow-ups
    const pendingCount = arrivingGuests.filter(b => (b.balance || 0) > 0).length;
    if (pendingCount > 0) {
      tasks.push({
        id: String(taskId++),
        label: `Follow Up — Pending Payment (${pendingCount})`,
        time: '',
        status: 'pending',
        color: SRS.orange,
      });
    }

    // Maintenance rooms
    rooms.filter(r => r.status === 'maintenance').slice(0, 1).forEach(r => {
      tasks.push({
        id: String(taskId++),
        label: `Room ${r.room_number} Inspection`,
        time: '',
        status: 'in_progress',
        color: SRS.teal,
      });
    });

    return tasks;
  }, [arrivingGuests, rooms]);

  // Room statuses for the floor display
  const floorStatuses = useMemo(() => {
    const allStatuses: { room: string; status: string; floor: number }[] = [];
    rooms.forEach(r => {
      const floor = parseInt(r.room_number.charAt(0), 10) || 1;
      allStatuses.push({ room: r.room_number, status: r.status, floor });
    });
    return allStatuses;
  }, [rooms]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.logoContainer}>
              <Text style={s.logoText}>SE</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>ServeIQ</Text>
              <Text style={s.headerSub}>Front Desk</Text>
            </View>
            <TouchableOpacity style={s.headerIconBtn} onPress={() => router.push('/(operations)/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={DARK} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}><Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
              )}
            </TouchableOpacity>
            <View style={s.avatarContainer}>
              <Ionicons name="person" size={18} color={SLATE[400]} />
            </View>
          </View>
        </View>

        {/* Greeting */}
        <View style={s.greetingSection}>
          <Text style={s.greeting}>Welcome back, {operator?.name || 'staff'} 👋</Text>
          <Text style={s.greetingDate}>{getFormattedDate()}</Text>
        </View>

        {/* Clock In/Out Widget */}
        <View style={s.clockCard}>
          <View style={s.clockInfo}>
            <Ionicons name={isClockedIn ? 'time-outline' : 'time-outline'} size={20} color={isClockedIn ? SRS.green : SLATE[400]} />
            <View style={{ marginLeft: 10 }}>
              {isClockedIn ? (
                <>
                  <Text style={s.clockLabel}>You are Clocked In</Text>
                  <Text style={s.clockSub}>Since {clockStartTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                </>
              ) : (
                <Text style={s.clockLabel}>Clock In to start your shift</Text>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {isClockedIn && <Text style={s.elapsed}>{elapsed}</Text>}
            <TouchableOpacity
              onPress={handleClockToggle}
              style={[s.clockBtn, { backgroundColor: isClockedIn ? SLATE[100] : SRS.teal }]}
            >
              <Ionicons name={isClockedIn ? 'log-out-outline' : 'log-in-outline'} size={16} color={isClockedIn ? DARK : BG.white} />
              <Text style={[s.clockBtnText, { color: isClockedIn ? DARK : BG.white }]}>
                {isClockedIn ? 'Clock Out' : 'Clock In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today at a Glance */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Today at a Glance</Text>
            <TouchableOpacity onPress={() => router.push('/(operations)/front-desk')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={s.kpiGrid}>
            {[
              { label: 'Arrivals', value: arrivingGuests.length, icon: 'arrow-down-circle-outline', color: SRS.green, bg: EMERALD[50] },
              { label: 'Departures', value: departingToday.length, icon: 'arrow-up-circle-outline', color: SRS.orange, bg: AMBER[50] },
              { label: 'In House', value: checkedInGuests.length, icon: 'people-outline', color: BLUE[600], bg: BLUE[50] },
              { label: 'Available', value: statusCounts.available, icon: 'checkmark-circle-outline', color: SRS.green, bg: EMERALD[50] },
              { label: 'Dirty', value: statusCounts.dirty, icon: 'alert-circle-outline', color: SRS.orange, bg: AMBER[50] },
              { label: 'Maint.', value: statusCounts.maintenance, icon: 'construct-outline', color: RED[500], bg: RED[50] },
            ].map((item) => (
              <View key={item.label} style={[s.kpiCard, { backgroundColor: item.bg }]}>
                <View style={[s.kpiIconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={[s.kpiValue, { color: item.color }]}>{item.value}</Text>
                <Text style={s.kpiLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending Payments & Occupancy Row */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: SRS.teal + '08', borderColor: SRS.teal + '20' }]}>
            <Text style={s.summaryLabel}>NPR {pendingPayments.toLocaleString()}</Text>
            <Text style={s.summarySub}>Pending Payments</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: BLUE[50], borderColor: BLUE[100] }]}>
            <Text style={s.summaryValue}>{occupancySnapshot.occupancyRate}%</Text>
            <Text style={s.summarySub}>Occupancy</Text>
          </View>
        </View>

        {/* Today's Arrivals */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Today&apos;s Arrivals</Text>
            <TouchableOpacity onPress={() => router.push('/(operations)/front-desk')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {arrivingGuests.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={32} color={SRS.green} />
              <Text style={s.emptyText}>No arrivals today</Text>
            </View>
          ) : (
            arrivingGuests.slice(0, 3).map(b => (
              <View key={b.id} style={s.bookingCard}>
                <View style={[s.bookingAvatar, { backgroundColor: SRS.teal + '15' }]}>
                  <Text style={[s.bookingInitial, { color: SRS.teal }]}>{b.guest_name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bookingName}>{b.guest_name}</Text>
                  <Text style={s.bookingMeta}>Room {b.room_number || '—'} · {b.room_type}</Text>
                  <Text style={s.bookingMeta}>{b.adults || 1}{(b.adults || 1) === 1 ? ' Guest' : ' Guests'}{b.children ? ` + ${b.children} children` : ''}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(operations)/front-desk/check-in', params: { bookingRef: b.ref } })}
                  style={s.actionBtn}
                >
                  <Text style={s.actionBtnText}>Check In</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Today's Departures */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Today&apos;s Departures</Text>
            <TouchableOpacity onPress={() => router.push('/(operations)/front-desk')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {departingToday.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={32} color={SRS.green} />
              <Text style={s.emptyText}>No departures today</Text>
            </View>
          ) : (
            departingToday.slice(0, 3).map(b => (
              <View key={b.id} style={s.bookingCard}>
                <View style={[s.bookingAvatar, { backgroundColor: SRS.orange + '15' }]}>
                  <Text style={[s.bookingInitial, { color: SRS.orange }]}>{b.guest_name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bookingName}>{b.guest_name}</Text>
                  <Text style={s.bookingMeta}>Room {b.room_number || '—'} · {b.room_type}</Text>
                  <Text style={[s.bookingMeta, { color: SRS.orange }]}>Balance NPR {(b.balance || 0).toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(operations)/front-desk/check-out', params: { bookingRef: b.ref } })}
                  style={[s.actionBtn, { backgroundColor: SRS.orange }]}
                >
                  <Text style={s.actionBtnText}>Check Out</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Room Status */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Room Status</Text>
            <TouchableOpacity onPress={() => router.push('/(operations)/room-plan')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {/* Legend */}
          <View style={s.legendRow}>
            {[
              { label: 'Available', color: SRS.green },
              { label: 'Occupied', color: RED[500] },
              { label: 'Dirty', color: SLATE[400] },
              { label: 'Maintenance', color: SRS.orange },
            ].map(item => (
              <View key={item.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: item.color }]} />
                <Text style={s.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
          {/* Room Grid */}
          <View style={s.roomGrid}>
            {(roomsByFloor[3] || roomsByFloor[1] || []).slice(0, 12).map(room => {
              const st = STATUS_STYLE[room.status] || STATUS_STYLE.available;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[s.roomTile, { backgroundColor: st.bg, borderColor: st.dot + '30' }]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.roomTileNumber, { color: st.text }]}>{room.room_number}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Assigned Tasks */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Assigned Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(operations)/housekeeping')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={s.tasksCard}>
            {assignedTasks.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={28} color={SRS.green} />
                <Text style={{ fontSize: 13, color: SLATE[400], marginTop: 6 }}>All caught up!</Text>
              </View>
            ) : (
              assignedTasks.map((task, i) => (
                <View key={task.id} style={[s.taskRow, i < assignedTasks.length - 1 && s.taskRowBorder]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={task.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.taskLabel}>{task.label}</Text>
                    {task.time ? <Text style={s.taskTime}>{task.time}</Text> : null}
                  </View>
                  <View style={[s.taskBadge, { backgroundColor: task.color + '15' }]}>
                    <Text style={[s.taskBadgeText, { color: task.color }]}>
                      {task.status === 'completed' ? 'Done' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <BottomTabBar />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 14, fontWeight: '800', color: BG.white },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: SLATE[400] },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: RED[500], alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: BG.white },
  avatarContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: SRS.green },

  greetingSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 20, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  greetingDate: { fontSize: 13, color: SLATE[400], marginTop: 2 },

  clockCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 8, padding: 14,
    backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100],
    ...SHADOWS.card,
  },
  clockInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  clockLabel: { fontSize: 13, fontWeight: '700', color: DARK },
  clockSub: { fontSize: 11, color: SLATE[400], marginTop: 1 },
  elapsed: { fontSize: 16, fontWeight: '800', color: SRS.teal, fontVariant: ['tabular-nums' as any] },
  clockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 4,
  },
  clockBtnText: { fontSize: 12, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DARK, letterSpacing: -0.2 },
  viewAll: { fontSize: 12, fontWeight: '600', color: SRS.teal },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: { width: '31%', padding: 12, borderRadius: 12, alignItems: 'center' },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums' as any] },
  kpiLabel: { fontSize: 10, fontWeight: '600', color: SLATE[500], marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 18, fontWeight: '800', color: SRS.teal, fontVariant: ['tabular-nums' as any] },
  summaryValue: { fontSize: 18, fontWeight: '800', color: BLUE[600], fontVariant: ['tabular-nums' as any] },
  summarySub: { fontSize: 11, fontWeight: '600', color: SLATE[500], marginTop: 2 },

  bookingCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100],
    marginBottom: 8, gap: 12,
  },
  bookingAvatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookingInitial: { fontSize: 16, fontWeight: '700' },
  bookingName: { fontSize: 14, fontWeight: '700', color: DARK },
  bookingMeta: { fontSize: 12, color: SLATE[500], marginTop: 1 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: SRS.green },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: BG.white },

  emptyCard: { padding: 24, alignItems: 'center', backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100] },
  emptyText: { fontSize: 13, color: SLATE[400], marginTop: 8 },

  legendRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: SLATE[500] },

  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomTile: { width: '23%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  roomTileNumber: { fontSize: 14, fontWeight: '700' },

  tasksCard: { backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], overflow: 'hidden' },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  taskRowBorder: { borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  taskLabel: { fontSize: 13, fontWeight: '600', color: DARK },
  taskTime: { fontSize: 11, color: SLATE[400], marginTop: 2 },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  taskBadgeText: { fontSize: 10, fontWeight: '600' },
});
