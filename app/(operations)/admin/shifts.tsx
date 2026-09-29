import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/context/auth-context';
import { useHost } from '@/lib/context/host-context';
import { operationsApi } from '@/lib/api/operations-api';
import { safeGoBack } from '@/lib/utils';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { SRS, TYPOGRAPHY, SPACING, GRAY, RADIUS } from '@/constants/portal-theme';
import { TEAL, BLUE, PURPLE, AMBER, RED, EMERALD } from '@/lib/constants/figma-tokens';
import type { BackendScheduleEntry, StaffMember } from '@/types/api';

const ACCENT = TEAL[600];

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  front_desk: 'Front Desk',
  housekeeping: 'Housekeeping',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  maintenance: 'Maintenance',
};

const ROLE_COLORS: Record<string, string> = {
  manager: PURPLE[500],
  front_desk: BLUE[500],
  housekeeping: EMERALD[500],
  waiter: AMBER[500],
  kitchen: '#F97316',
  maintenance: RED[500],
};

const SHIFT_LABELS: Record<string, string> = { MORNING: 'Morning', EVENING: 'Evening', NIGHT: 'Night' };
const SHIFT_COLORS: Record<string, string> = { MORNING: AMBER[500], EVENING: TEAL[600], NIGHT: PURPLE[500] };

/** Index by Date#getDay(): 0 = Sunday. */
const DAYS_BY_INDEX = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayOfWeek(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : DAYS_BY_INDEX[d.getDay()];
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Unwrap {success, data, meta} API responses — returns `fallback` when shape is unexpected. */
function unwrap<T>(res: unknown, fallback: T): T {
  if (Array.isArray(res)) return res as T;
  if (res && typeof res === 'object' && 'data' in res) return ((res as { data?: T }).data ?? fallback) as T;
  return (res ?? fallback) as T;
}

export default function ShiftsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { staff } = useHost();
  const operator = user as { property_id?: string } | null;

  const [propId, setPropId] = useState(operator?.property_id || '');
  const [entries, setEntries] = useState<BackendScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (propId) return;
    let cancelled = false;
    AsyncStorage.getItem('@serveiq_default_ops_property_id').then(pid => {
      if (!cancelled && pid) setPropId(pid);
    });
    return () => { cancelled = true; };
  }, [propId]);

  // setStates live in .then() so the effect body never runs them synchronously.
  const fetchWeek = useCallback(
    () =>
      (propId
        ? operationsApi.getWeeklySchedule(propId, undefined, () => [])
        : Promise.resolve([])
      ).then(res => {
        // Guard the shape: {success, data:[...]} or a bare array, never anything else.
        const list = unwrap<unknown>(res, []);
        setEntries(Array.isArray(list) ? (list as BackendScheduleEntry[]) : []);
        setLoading(false);
      }),
    [propId],
  );

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeek();
    setRefreshing(false);
  }, [fetchWeek]);

  const staffById = useMemo(() => {
    const map = new Map<string, StaffMember>();
    (staff || []).forEach(s => { if (s.property_id === propId || !propId) map.set(s.id, s); });
    return map;
  }, [staff, propId]);

  const [selectedDay, setSelectedDay] = useState(() => DAYS_BY_INDEX[new Date().getDay()] || 'Mon');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    entries.forEach(e => { const d = dayOfWeek(e.shift_date); if (d) c[d] = (c[d] || 0) + 1; });
    return c;
  }, [entries]);

  const dayEntries = useMemo(
    () => entries.filter(e => dayOfWeek(e.shift_date) === selectedDay),
    [entries, selectedDay],
  );

  const stats = useMemo(() => ({
    total: dayEntries.length,
    people: new Set(dayEntries.map(e => e.staff_id)).size,
    checkedIn: dayEntries.filter(e => !!e.check_in_time).length,
  }), [dayEntries]);

  const weekLabel = useMemo(() => {
    const dates = entries.map(e => e.shift_date?.slice(0, 10)).filter(Boolean).sort();
    if (!dates.length) return 'This week';
    const from = formatDate(dates[0]);
    const to = formatDate(dates[dates.length - 1]);
    return from === to ? from : `${from} – ${to}`;
  }, [entries]);

  const nameOf = useCallback((e: BackendScheduleEntry): { name: string; role: string } => {
    const s = staffById.get(e.staff_id);
    if (s) return { name: `${s.first_name} ${s.last_name}`.trim(), role: s.role };
    return { name: e.staff_id ? `Staff ${e.staff_id.slice(0, 6)}` : 'Unknown', role: '' };
  }, [staffById]);

  const sortedDay = useMemo(
    () => [...dayEntries].sort((a, b) => nameOf(a).name.localeCompare(nameOf(b).name)),
    [dayEntries, nameOf],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[TYPOGRAPHY.h2, { color: SRS.navy }]}>Shift Schedule</Text>
          <Text style={[TYPOGRAPHY.small, { color: GRAY[500], marginTop: 2 }]}>{weekLabel}</Text>
        </View>
      </View>

      {/* Weekday selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {WEEK_ORDER.map(day => {
          const active = day === selectedDay;
          const count = counts[day] || 0;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.7}
              style={[s.dayChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }, !active && { borderColor: colors.border }]}
            >
              <Text style={[s.dayChipText, active && { color: '#fff' }]}>{day}</Text>
              {count > 0 && <Text style={[s.dayChipCount, active && { color: '#fff' }]}>{count}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats */}
      <View style={[s.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Stat label="Shifts" value={stats.total} />
        <Stat label="Staff" value={stats.people} />
        <Stat label="Checked in" value={stats.checkedIn} accent={ACCENT} />
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={ACCENT} size="large" /></View>
      ) : sortedDay.length === 0 ? (
        <View style={s.center}>
          <IconSymbol name="calendar" size={36} color={GRAY[400]} />
          <Text style={[TYPOGRAPHY.subtitle, { color: SRS.navy, marginTop: SPACING.md }]}>No shifts on {selectedDay}</Text>
          <Text style={[TYPOGRAPHY.small, { color: GRAY[500], marginTop: 4, textAlign: 'center' }]}>
            The weekly rota shows here once shifts are scheduled for this property.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8, marginTop: SPACING.md }}>
          {sortedDay.map((e, i) => {
            const { name, role } = nameOf(e);
            const shift = e.shift_type || '';
            return (
              <View key={e.id || `${e.staff_id}-${i}`} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.avatar, { backgroundColor: (ROLE_COLORS[role] || GRAY[400]) + '1A' }]}>
                  <Text style={[s.avatarText, { color: ROLE_COLORS[role] || GRAY[600] }]}>
                    {name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.subtitle, { color: SRS.navy, fontWeight: '700' }]} numberOfLines={1}>{name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {role ? (
                      <View style={[s.badge, { backgroundColor: (ROLE_COLORS[role] || GRAY[400]) + '1A' }]}>
                        <Text style={[s.badgeText, { color: ROLE_COLORS[role] || GRAY[600] }]}>{ROLE_LABELS[role] || role}</Text>
                      </View>
                    ) : null}
                    {shift ? (
                      <View style={[s.badge, { backgroundColor: (SHIFT_COLORS[shift] || TEAL[600]) + '1A' }]}>
                        <Text style={[s.badgeText, { color: SHIFT_COLORS[shift] || TEAL[600] }]}>{SHIFT_LABELS[shift] || shift}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol name="clock.in" size={12} color={e.check_in_time ? ACCENT : GRAY[400]} />
                    <Text style={[TYPOGRAPHY.small, { color: e.check_in_time ? SRS.navy : GRAY[400] }]}>
                      {e.check_in_time || '—'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol name="clock.out" size={12} color={e.check_out_time ? RED[500] : GRAY[400]} />
                    <Text style={[TYPOGRAPHY.small, { color: e.check_out_time ? SRS.navy : GRAY[400] }]}>
                      {e.check_out_time || '—'}
                    </Text>
                  </View>
                  {typeof e.tasks_assigned_today === 'number' ? (
                    <Text style={[TYPOGRAPHY.small, { color: GRAY[500] }]}>
                      {e.tasks_completed_today ?? 0}/{e.tasks_assigned_today} tasks
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {!loading && entries.length === 0 && (
        <Text style={[TYPOGRAPHY.small, { color: GRAY[400], textAlign: 'center', marginTop: SPACING.md }]}>
          No rota data returned for this property yet.
        </Text>
      )}
    </ScrollView>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[TYPOGRAPHY.h3, { color: accent || SRS.navy }]}>{value}</Text>
      <Text style={[TYPOGRAPHY.small, { color: GRAY[500] }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200],
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  dayChip: {
    minWidth: 56, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.card,
    borderWidth: 1, alignItems: 'center', backgroundColor: '#fff',
  },
  dayChipText: { fontSize: 13, fontWeight: '700', color: GRAY[600] },
  dayChipCount: { fontSize: 11, color: GRAY[500], marginTop: 2 },
  statsRow: {
    flexDirection: 'row', borderRadius: RADIUS.card, borderWidth: 1,
    paddingVertical: SPACING.md, marginTop: SPACING.md,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: RADIUS.card, borderWidth: 1, padding: SPACING.md,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
});
