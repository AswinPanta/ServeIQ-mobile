import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { safeGoBack } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import { TEAL, BRAND, BLUE, STATUS, AMBER, ORANGE, PURPLE, RED, BG, SLATE, GRAY as GRAYTokens, EMERALD } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = TEAL[600];
const NAVY = BRAND.navy;

type ShiftRole = 'front_desk' | 'housekeeping' | 'waiter' | 'kitchen' | 'manager' | 'maintenance';

interface Shift {
  id: string;
  staffName: string;
  role: ShiftRole;
  day: string;
  startHour: number;
  endHour: number;
  status: 'scheduled' | 'checked_in' | 'absent' | 'swap_pending';
}

const ROLE_COLORS: Record<ShiftRole, string> = {
  front_desk: BLUE[500],
  housekeeping: STATUS.activeGreen,
  waiter: AMBER[500],
  kitchen: ORANGE[500],
  manager: PURPLE[500],
  maintenance: RED[500],
};

const ROLE_LABELS: Record<ShiftRole, string> = {
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  manager: 'Manager',
  maintenance: 'Maintenance',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM - 9PM

const MOCK_STAFF = [
  { name: 'Ram Sharma', role: 'front_desk' as ShiftRole },
  { name: 'Sita Thapa', role: 'front_desk' as ShiftRole },
  { name: 'Hari Bahadur', role: 'housekeeping' as ShiftRole },
  { name: 'Gita Devi', role: 'housekeeping' as ShiftRole },
  { name: 'Kamala Rai', role: 'housekeeping' as ShiftRole },
  { name: 'Bikash Gurung', role: 'waiter' as ShiftRole },
  { name: 'Anita Shrestha', role: 'waiter' as ShiftRole },
  { name: 'Prakash Tamang', role: 'kitchen' as ShiftRole },
  { name: 'Suman Lama', role: 'kitchen' as ShiftRole },
  { name: 'Deepak Magar', role: 'maintenance' as ShiftRole },
  { name: 'Rajesh Hamal', role: 'manager' as ShiftRole },
];

function generateMockShifts(): Shift[] {
  const shifts: Shift[] = [];
  let id = 1;
  MOCK_STAFF.forEach((s) => {
    DAYS.forEach((day, di) => {
      // Each staff works ~5 days a week
      if (di >= 5 && Math.random() > 0.3) return;
      const startHour = s.role === 'housekeeping' ? 7 : s.role === 'kitchen' ? 10 : s.role === 'waiter' ? 11 : 8;
      const endHour = s.role === 'housekeeping' ? 15 : s.role === 'kitchen' ? 22 : s.role === 'waiter' ? 22 : 17;
      const isToday = di === new Date().getDay() - 1;
      const status: Shift['status'] = isToday && Math.random() > 0.3 ? 'checked_in' : isToday && Math.random() > 0.6 ? 'absent' : 'scheduled';
      shifts.push({
        id: `s-${id++}`,
        staffName: s.name,
        role: s.role,
        day,
        startHour,
        endHour,
        status,
      });
    });
  });
  return shifts;
}

const INITIAL_SHIFTS = generateMockShifts();

export default function ShiftsScreen() {
  const colors = useColors();
  const [shifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Mon');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [roleFilter, setRoleFilter] = useState<ShiftRole | 'all'>('all');

  const todayIndex = DAYS.indexOf(selectedDay);

  const dayShifts = useMemo(() => {
    return shifts.filter(s => s.day === selectedDay && (roleFilter === 'all' || s.role === roleFilter));
  }, [shifts, selectedDay, roleFilter]);

  const dayStats = useMemo(() => {
    const total = dayShifts.length;
    const checkedIn = dayShifts.filter(s => s.status === 'checked_in').length;
    const scheduled = dayShifts.filter(s => s.status === 'scheduled').length;
    const absent = dayShifts.filter(s => s.status === 'absent').length;
    const coverage: Record<ShiftRole, number> = {
      front_desk: 0, housekeeping: 0, waiter: 0, kitchen: 0, manager: 0, maintenance: 0,
    };
    dayShifts.forEach(s => { coverage[s.role] = (coverage[s.role] || 0) + 1; });
    return { total, checkedIn, scheduled, absent, coverage };
  }, [dayShifts]);

  const weekCoverage = useMemo(() => {
    return DAYS.map(day => {
      const dayS = shifts.filter(s => s.day === day);
      return {
        day,
        total: dayS.length,
        roles: dayS.reduce<Record<string, number>>((acc, s) => { acc[s.role] = (acc[s.role] || 0) + 1; return acc; }, {}),
      };
    });
  }, [shifts]);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Shift Schedule</Text>
            <Text style={s.sub}>Weekly staff coverage</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={s.iconBtn}>
            <IconSymbol name={viewMode === 'grid' ? 'view.list' : 'view.grid'} size={16} color={GRAY[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Coverage Overview */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Week Overview</Text>
        <View style={s.weekGrid}>
          {weekCoverage.map((w, i) => (
            <TouchableOpacity key={w.day} onPress={() => setSelectedDay(w.day)}
              style={[s.weekDay, i === todayIndex && s.weekDayToday, selectedDay === w.day && s.weekDayActive]}>
              <Text style={[s.weekDayLabel, selectedDay === w.day && { color: BG.white }]}>{w.day}</Text>
              <Text style={[s.weekDayCount, selectedDay === w.day && { color: BG.white }]}>{w.total}</Text>
              <View style={s.weekDayDots}>
                {Object.entries(w.roles).map(([role, count]) => (
                  <View key={role} style={[s.weekDot, { backgroundColor: ROLE_COLORS[role as ShiftRole] }]} />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Role Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setRoleFilter('all')}
          style={[s.filterChip, roleFilter === 'all' && s.filterChipActive]}>
          <Text style={[s.filterChipText, roleFilter === 'all' && { color: BG.white }]}>All ({dayShifts.length})</Text>
        </TouchableOpacity>
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = shifts.filter(s => s.day === selectedDay && s.role === role).length;
          return (
            <TouchableOpacity key={role} onPress={() => setRoleFilter(role as ShiftRole)}
              style={[s.filterChip, { borderColor: ROLE_COLORS[role as ShiftRole] }, roleFilter === role && { backgroundColor: ROLE_COLORS[role as ShiftRole] }]}>
              <Text style={[s.filterChipText, { color: roleFilter === role ? BG.white : ROLE_COLORS[role as ShiftRole] }]}>{label} ({count})</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: EMERALD[500] + '15' }]}>
          <Text style={[s.statVal, { color: STATUS.activeGreen }]}>{dayStats.checkedIn}</Text>
          <Text style={s.statLabel}>Checked In</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: BLUE[500] + '15' }]}>
          <Text style={[s.statVal, { color: BLUE[500] }]}>{dayStats.scheduled}</Text>
          <Text style={s.statLabel}>Scheduled</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: RED[500] + '15' }]}>
          <Text style={[s.statVal, { color: RED[500] }]}>{dayStats.absent}</Text>
          <Text style={s.statLabel}>Absent</Text>
        </View>
      </View>

      {/* Coverage by Role */}
      {Object.values(dayStats.coverage).some(v => v > 0) && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Coverage by Role — {selectedDay}</Text>
          <View style={s.coverageGrid}>
            {Object.entries(dayStats.coverage).filter(([, c]) => c > 0).map(([role, count]) => {
              const minRequired = role === 'manager' ? 1 : role === 'maintenance' ? 1 : 2;
              const isUnder = count < minRequired;
              return (
                <View key={role} style={[s.coverageCard, isUnder && { borderColor: RED[500] }]}>
                  <View style={[s.coverageIcon, { backgroundColor: ROLE_COLORS[role as ShiftRole] + '20' }]}>
                    <IconSymbol name={role === 'front_desk' ? 'front.desk' : role === 'housekeeping' ? 'cleaning' : role === 'kitchen' ? 'kitchen' : role === 'waiter' ? 'restaurant' : role === 'manager' ? 'manager' : 'maintenance'} size={16} color={ROLE_COLORS[role as ShiftRole]} />
                  </View>
                  <Text style={s.coverageRole}>{ROLE_LABELS[role as ShiftRole]}</Text>
                  <Text style={[s.coverageCount, { color: isUnder ? RED[500] : STATUS.activeGreen }]}>{count}/{minRequired}+</Text>
                  {isUnder && <Text style={s.coverageWarning}>Understaffed</Text>}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Time Grid — {selectedDay}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.timeGrid}>
              {/* Header row */}
              <View style={s.timeGridHeader}>
                <View style={s.timeGridStaffCell}>
                  <Text style={s.timeGridHeaderText}>Staff</Text>
                </View>
                {HOURS.map(h => (
                  <View key={h} style={s.timeGridHourCell}>
                    <Text style={s.timeGridHeaderText}>{h}:00</Text>
                  </View>
                ))}
              </View>
              {/* Staff rows */}
              {dayShifts.map(shift => (
                <View key={shift.id} style={s.timeGridRow}>
                  <View style={s.timeGridStaffCell}>
                    <View style={[s.roleTag, { backgroundColor: ROLE_COLORS[shift.role] + '20' }]}>
                      <View style={[s.roleDot, { backgroundColor: ROLE_COLORS[shift.role] }]} />
                      <Text style={s.staffName} numberOfLines={1}>{shift.staffName.split(' ')[0]}</Text>
                    </View>
                  </View>
                  {HOURS.map(h => {
                    const isWorking = h >= shift.startHour && h < shift.endHour;
                    return (
                      <View key={h} style={s.timeGridHourCell}>
                        {isWorking && (
                          <View style={[s.timeBlock, {
                            backgroundColor: shift.status === 'checked_in' ? ROLE_COLORS[shift.role]
                              : shift.status === 'absent' ? RED[100]
                              : ROLE_COLORS[shift.role] + '40',
                          }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* List View */
        <View style={s.section}>
          <Text style={s.sectionTitle}>Shifts — {selectedDay}</Text>
          <View style={{ gap: 8 }}>
            {dayShifts.map(shift => (
              <View key={shift.id} style={[s.shiftCard, SHADOWS.card]}>
                <View style={[s.roleBar, { backgroundColor: ROLE_COLORS[shift.role] }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.shiftName}>{shift.staffName}</Text>
                    <View style={[s.statusBadge, {
                      backgroundColor: shift.status === 'checked_in' ? EMERALD[500] + '15' : shift.status === 'absent' ? RED[500] + '15' : shift.status === 'swap_pending' ? AMBER[500] + '15' : SLATE[100],
                    }]}>
                      <Text style={[s.statusText, {
                        color: shift.status === 'checked_in' ? STATUS.activeGreen : shift.status === 'absent' ? RED[500] : shift.status === 'swap_pending' ? AMBER[500] : GRAYTokens[500],
                      }]}>
                        {shift.status === 'checked_in' ? 'Checked In' : shift.status === 'absent' ? 'Absent' : shift.status === 'swap_pending' ? 'Swap Pending' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.shiftTime}>
                    <IconSymbol name="clock" size={11} color={GRAY[400]} /> {shift.startHour}:00 — {shift.endHour}:00 · {ROLE_LABELS[shift.role]}
                  </Text>
                </View>
              </View>
            ))}
            {dayShifts.length === 0 && (
              <View style={s.emptyState}>
                <IconSymbol name="shift" size={40} color={GRAY[300]} />
                <Text style={s.emptyText}>No shifts scheduled for {selectedDay}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: NAVY, fontFamily: TYPOGRAPHY.subtitle?.fontFamily },
  sub: { fontSize: 12, color: GRAYTokens[500], marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 12 },
  weekGrid: { flexDirection: 'row', gap: 4 },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[100] },
  weekDayToday: { borderColor: ACCENT, borderWidth: 2 },
  weekDayActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  weekDayLabel: { fontSize: 11, fontWeight: '600', color: GRAYTokens[500] },
  weekDayCount: { fontSize: 18, fontWeight: '700', color: NAVY, marginTop: 2 },
  weekDayDots: { flexDirection: 'row', gap: 2, marginTop: 4 },
  weekDot: { width: 5, height: 5, borderRadius: 2.5 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: GRAY[200], backgroundColor: BG.white },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterChipText: { fontSize: 12, fontWeight: '600', color: GRAYTokens[500] },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: RADIUS.card },
  statVal: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: GRAYTokens[500], marginTop: 2 },
  coverageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  coverageCard: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[100], gap: 4 },
  coverageIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  coverageRole: { fontSize: 11, fontWeight: '600', color: NAVY },
  coverageCount: { fontSize: 13, fontWeight: '700' },
  coverageWarning: { fontSize: 9, color: RED[500], fontWeight: '600' },
  timeGrid: { minWidth: 800 },
  timeGridHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: GRAY[100], paddingBottom: 6 },
  timeGridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: SLATE[100], paddingVertical: 4 },
  timeGridStaffCell: { width: 100, justifyContent: 'center' },
  timeGridHourCell: { width: 40, alignItems: 'center', justifyContent: 'center' },
  timeGridHeaderText: { fontSize: 10, fontWeight: '600', color: SLATE[400] },
  roleTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  staffName: { fontSize: 11, fontWeight: '600', color: NAVY, width: 70 },
  timeBlock: { width: 36, height: 20, borderRadius: 4 },
  shiftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, padding: 14, borderWidth: 1, borderColor: GRAY[100] },
  roleBar: { width: 4, height: 40, borderRadius: 2 },
  shiftName: { fontSize: 14, fontWeight: '600', color: NAVY },
  shiftTime: { fontSize: 11, color: GRAYTokens[500], marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, color: SLATE[400] },
});