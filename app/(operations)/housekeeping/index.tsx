import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, STATUS_COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useHousekeepingStore, STATUS_ORDER, STATUS_FLOW_COLORS } from '@/stores/useHousekeepingStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuth } from '@/lib/context/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';

const FILTERS = ['All', 'Dirty', 'In Progress', 'Cleaned', 'Inspected'] as const;

const PRIORITY_DOTS: Record<string, string> = {
  High: SRS.red,
  Normal: SRS.orange,
  Low: SRS.green,
};

export default function HousekeepingScreen() {
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const tasks = useHousekeepingStore((s) => s.tasks);
  const setPropertyId = useHousekeepingStore((s) => s.setPropertyId);

  useEffect(() => {
    if (operator?.property_id) {
      setPropertyId(operator.property_id);
    }
  }, [operator?.property_id, setPropertyId]);

  const [activeFilter, setActiveFilter] = useState<string>('All');

  const stats = useMemo(() => {
    const dirty = tasks.filter((t) => t.status === 'Dirty').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const cleaned = tasks.filter((t) => t.status === 'Cleaned').length;
    const inspected = tasks.filter((t) => t.status === 'Inspected').length;
    const cleaners = [...new Set(tasks.map((t) => t.cleaner).filter((c) => c !== 'Unassigned'))].length;
    return { dirty, inProgress, cleaned, inspected, total: tasks.length, cleaners };
  }, [tasks]);

  const filtered = useMemo(
    () => (activeFilter === 'All' ? tasks : tasks.filter((t) => t.status === activeFilter)),
    [tasks, activeFilter]
  );

  const recentlyInspected = useMemo(
    () => tasks.filter((t) => t.status === 'Inspected').slice(-3).reverse(),
    [tasks]
  );

  const staffLoad = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.cleaner && t.cleaner !== 'Unassigned') {
        const active = t.status === 'Dirty' || t.status === 'In Progress';
        map.set(t.cleaner, (map.get(t.cleaner) || 0) + (active ? 1 : 0));
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  const handleAdvance = useCallback(
    (room: string) => {
      const task = tasks.find((t) => t.room === room);
      if (!task) return;
      const currentIdx = STATUS_ORDER.indexOf(task.status);
      if (currentIdx >= STATUS_ORDER.length - 1) return;
      const nextStatus = STATUS_ORDER[currentIdx + 1];
      useHousekeepingStore.getState().advanceStatus(room);
      useActivityStore.getState().addActivity({
        type: 'hk',
        title: `Room ${room} → ${nextStatus}`,
        icon: '🔄',
        color: STATUS_FLOW_COLORS[nextStatus],
      });
      if (nextStatus === 'Inspected') {
        useNotificationStore.getState().addNotification({
          type: 'hk_alert',
          title: `Room ${room} ready`,
          message: `Room ${room} has been cleaned and inspected`,
        });
      }
    },
    [tasks]
  );

  const handleStart = (room: string) => {
    Alert.alert('Start Cleaning', `Start cleaning Room ${room}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => handleAdvance(room) },
    ]);
  };

  const handleMarkCleaned = (room: string) => {
    Alert.alert('Mark Cleaned', `Mark Room ${room} as cleaned?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => handleAdvance(room) },
    ]);
  };

  const handleMarkInspected = (room: string) => {
    Alert.alert('Mark Inspected', `Mark Room ${room} as inspected?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => handleAdvance(room) },
    ]);
  };

  const STATUS_KPIS = [
    { key: 'Dirty' as const, label: 'Dirty', icon: 'cleaning', color: STATUS_COLORS.maintenance, count: stats.dirty },
    { key: 'In Progress' as const, label: 'In Progress', icon: 'cleaning', color: SRS.orange, count: stats.inProgress },
    { key: 'Cleaned' as const, label: 'Cleaned', icon: 'check', color: SRS.green, count: stats.cleaned },
    { key: 'Inspected' as const, label: 'Inspected', icon: 'check', color: SRS.teal, count: stats.inspected },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <Text style={s.title}>Housekeeping</Text>
        <Text style={s.sub}>
          <IconSymbol name="group" size={12} color={GRAY[400]} /> {stats.cleaners} active cleaner{stats.cleaners !== 1 ? 's' : ''} · {stats.total} tasks
        </Text>
      </View>

      {/* Status KPI Row */}
      <View style={s.kpiRow}>
        {STATUS_KPIS.map((kpi) => (
          <TouchableOpacity key={kpi.key} onPress={() => setActiveFilter(kpi.key)}
            style={[s.kpiCard, { backgroundColor: kpi.color + '10', borderColor: kpi.color + '25' }]}
          >
            <View style={[s.kpiIcon, { backgroundColor: kpi.color + '18' }]}>
              <IconSymbol name={kpi.icon as any} size={16} color={kpi.color} />
            </View>
            <Text style={[s.kpiValue, { color: kpi.color }]}>{kpi.count}</Text>
            <Text style={s.kpiLabel}>{kpi.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Staff Load */}
      <View style={s.staffSection}>
        <Text style={s.sectionTitle}>
          <IconSymbol name="group" size={14} color={SRS.navy} /> Staff Load
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.sm }}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {staffLoad.length === 0 ? (
              <Text style={{ ...TYPOGRAPHY.body, color: GRAY[400] }}>No cleaners assigned</Text>
            ) : (
              staffLoad.map(([name, count]) => (
                <View key={name} style={s.staffChip}>
                  <View style={s.staffAvatar}>
                    <Text style={s.staffInitial}>{name.charAt(0)}</Text>
                  </View>
                  <Text style={s.staffName}>{name}</Text>
                  <View style={[s.staffCount, { backgroundColor: count > 2 ? SRS.red : count > 0 ? SRS.orange : SRS.green }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>{count}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Filter Chips */}
      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f} onPress={() => setActiveFilter(f)}
                style={[s.filterChip, { backgroundColor: activeFilter === f ? SRS.teal : GRAY[100] }]}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: activeFilter === f ? '#FFF' : GRAY[600] }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Task List */}
      <View style={{ paddingHorizontal: SPACING.lg, gap: SPACING.md }}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <IconSymbol name="cleaning" size={40} color={GRAY[300]} />
            <Text style={{ ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[500], marginTop: SPACING.md }}>No tasks found</Text>
            <Text style={{ ...TYPOGRAPHY.small, color: GRAY[400] }}>No {activeFilter === 'All' ? '' : activeFilter.toLowerCase() + ' '}tasks to show</Text>
          </View>
        ) : (
          filtered.map((task) => {
            const statusColor = STATUS_FLOW_COLORS[task.status] || GRAY[400];
            const priorityColor = PRIORITY_DOTS[task.priority] || GRAY[400];
            return (
              <TouchableOpacity key={task.id}
                onPress={() => router.push(`/(operations)/housekeeping/${task.room}`)}
                style={s.taskCard}
                activeOpacity={0.7}
              >
                <View style={s.taskTop}>
                  <View style={s.taskIdRow}>
                    <View style={[s.taskRoomBox, { backgroundColor: SRS.teal + '12' }]}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: SRS.teal }}>{task.room}</Text>
                    </View>
                    <View>
                      <Text style={s.taskRoomLabel}>Room {task.room}</Text>
                      <Text style={s.taskMeta}>Floor {task.floor} · {task.taskType.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <StatusBadge label={task.status} color={statusColor} size="sm" />
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityColor }} />
                  </View>
                </View>

                <View style={s.taskBottom}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IconSymbol name="group" size={12} color={GRAY[400]} />
                    <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500] }}>{task.cleaner}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    {task.status === 'Dirty' && (
                      <TouchableOpacity onPress={() => handleStart(task.room)} style={[s.actionBtn, { backgroundColor: SRS.teal }]}>
                        <Text style={s.actionBtnText}>Start</Text>
                      </TouchableOpacity>
                    )}
                    {task.status === 'In Progress' && (
                      <TouchableOpacity onPress={() => handleMarkCleaned(task.room)} style={[s.actionBtn, { backgroundColor: SRS.green }]}>
                        <Text style={s.actionBtnText}>Mark Cleaned</Text>
                      </TouchableOpacity>
                    )}
                    {task.status === 'Cleaned' && (
                      <TouchableOpacity onPress={() => handleMarkInspected(task.room)} style={[s.actionBtn, { backgroundColor: SRS.teal }]}>
                        <Text style={s.actionBtnText}>Inspect</Text>
                      </TouchableOpacity>
                    )}
                    {task.status === 'Inspected' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <IconSymbol name="check" size={14} color={SRS.green} />
                        <Text style={{ fontSize: 12, color: SRS.green, fontWeight: '600' }}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Manager Alerts */}
      {recentlyInspected.length > 0 && (
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
          <Text style={[s.sectionTitle, { marginBottom: SPACING.md }]}>
            <IconSymbol name="notifications" size={14} color={SRS.navy} /> Manager Alerts
          </Text>
          <View style={{ gap: SPACING.sm }}>
            {recentlyInspected.map((t) => (
              <TouchableOpacity key={t.id} onPress={() => router.push(`/(operations)/housekeeping/${t.room}`)}
                style={[s.alertCard, { borderColor: SRS.green + '20' }]}
              >
                <View style={[s.alertDot, { backgroundColor: SRS.green + '18' }]}>
                  <IconSymbol name="check" size={14} color={SRS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTitle}>Room {t.room}</Text>
                  <Text style={s.alertMeta}>Inspection completed · {t.cleaner}</Text>
                </View>
                <StatusBadge label="Inspected" color={SRS.green} size="sm" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  kpiCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.card, borderWidth: 1, gap: 4 },
  kpiIcon: { width: 32, height: 32, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums' as any] },
  kpiLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  staffSection: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm },
  staffChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: SRS.teal + '10' },
  staffAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  staffInitial: { fontSize: 10, color: '#FFF', fontWeight: '700' },
  staffName: { fontSize: 13, fontWeight: '600', color: SRS.navy },
  staffCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.badge },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  taskCard: { backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md },
  taskTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskIdRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  taskRoomBox: { width: 40, height: 40, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  taskRoomLabel: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  taskMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  taskBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: GRAY[50] },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.button },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2 },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1 },
  alertDot: { width: 32, height: 32, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  alertTitle: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  alertMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
});
