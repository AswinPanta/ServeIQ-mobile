import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useHousekeepingStore, STATUS_ORDER, STATUS_FLOW_COLORS, CLEANING_CHECKLIST } from '@/stores/useHousekeepingStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuth } from '@/lib/context/auth-context';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const setPropertyId = useHousekeepingStore((s) => s.setPropertyId);
  const task = useHousekeepingStore((s) => s.tasks.find((t) => t.room === roomId));

  useEffect(() => {
    if (operator?.property_id) {
      setPropertyId(operator.property_id);
    }
  }, [operator?.property_id, setPropertyId]);

  const [cleanerInput, setCleanerInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const completedCount = useMemo(() => {
    if (!task?.checklist) return 0;
    return CLEANING_CHECKLIST.filter((_, i) => task.checklist?.[String(i)] === true).length;
  }, [task?.checklist]);

  const allDone = completedCount === CLEANING_CHECKLIST.length;

  const handleAdvance = useCallback(() => {
    if (!task) return;
    if (task.status === 'In Progress' && !allDone) {
      Alert.alert('Checklist Incomplete', 'Complete all checklist items before marking as cleaned');
      return;
    }
    const currentIdx = STATUS_ORDER.indexOf(task.status);
    if (currentIdx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];
    useHousekeepingStore.getState().advanceStatus(roomId);
    useActivityStore.getState().addActivity({
      type: 'hk',
      title: `Room ${roomId} → ${nextStatus}`,
      icon: '🔄',
      color: STATUS_FLOW_COLORS[nextStatus],
    });
    if (nextStatus === 'Inspected') {
      useNotificationStore.getState().addNotification({
        type: 'hk_alert',
        title: `Room ${roomId} ready`,
        message: `Room ${roomId} has been cleaned and inspected`,
      });
      useActivityStore.getState().addActivity({
        type: 'hk',
        title: `Room ${roomId} inspection complete`,
        description: `Room ${roomId} passed inspection, ready for assignment`,
        icon: '✅',
        color: SRS.green,
      });
    }
  }, [task, roomId, allDone]);

  const toggleItem = useCallback((index: number) => {
    const done = task?.checklist?.[String(index)] === true;
    useHousekeepingStore.getState().updateChecklist(roomId, index, !done);
  }, [task, roomId]);

  const handleAssign = useCallback(() => {
    if (!cleanerInput.trim()) return;
    useHousekeepingStore.getState().assignCleaner(roomId, cleanerInput.trim());
    useActivityStore.getState().addActivity({
      type: 'hk',
      title: `Room ${roomId} assigned to ${cleanerInput.trim()}`,
      icon: '🔄',
      color: SRS.teal,
    });
    setCleanerInput('');
  }, [cleanerInput, roomId]);

  const handleSaveNotes = useCallback(() => {
    if (!notesInput.trim()) return;
    useHousekeepingStore.getState().updateNotes(roomId, notesInput.trim());
    Alert.alert('Saved', `Notes for Room ${roomId} saved`);
  }, [notesInput, roomId]);

  if (!task) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }]}>
        <IconSymbol name="cleaning" size={56} color={GRAY[300]} />
        <Text style={{ ...TYPOGRAPHY.h3, color: SRS.navy, marginTop: SPACING.md }}>Room Not Found</Text>
        <Text style={{ ...TYPOGRAPHY.body, color: GRAY[500], textAlign: 'center', marginTop: 4 }}>
          Room {roomId} was not found in the housekeeping system
        </Text>
      </View>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const actionLabel =
    task.status === 'Dirty' ? 'Start Cleaning'
    : task.status === 'In Progress' ? 'Mark as Cleaned'
    : task.status === 'Cleaned' ? 'Mark as Inspected'
    : null;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Room {roomId}</Text>
          <Text style={s.sub}>
            Floor {task.floor} · {task.taskType.replace(/_/g, ' ')} · {task.cleaner}
          </Text>
        </View>
        <StatusBadge label={task.status} color={STATUS_FLOW_COLORS[task.status] || GRAY[400]} size="md" />
      </View>

      <View style={s.body}>
        {/* Status Flow */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="cleaning" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Status Flow</Text>
          </View>
          <View style={s.flowRow}>
            {STATUS_ORDER.map((status, i) => {
              const idx = STATUS_ORDER.indexOf(task.status);
              const isPast = i <= idx;
              const isCurrent = i === idx;
              const flowColor = STATUS_FLOW_COLORS[status] || GRAY[400];
              return (
                <React.Fragment key={status}>
                  {i > 0 && <View style={[s.flowLine, { backgroundColor: isPast ? flowColor : GRAY[200] }]} />}
                  <View style={[s.flowDot, { backgroundColor: isCurrent ? flowColor : isPast ? flowColor + '60' : GRAY[100] }]}>
                    {isPast && <IconSymbol name="check" size={10} color="#FFF" />}
                  </View>
                </React.Fragment>
              );
            })}
          </View>
          <Text style={{ ...TYPOGRAPHY.small, fontWeight: '600', color: STATUS_FLOW_COLORS[task.status] || GRAY[500], textAlign: 'center', marginTop: SPACING.sm }}>
            Current: {task.status}
          </Text>
        </View>

        {/* Checklist */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="check" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Cleaning Checklist</Text>
            <View style={[s.checklistCount, { backgroundColor: allDone ? SRS.green + '18' : SRS.teal + '12' }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: allDone ? SRS.green : SRS.teal }}>
                {completedCount}/{CLEANING_CHECKLIST.length}
              </Text>
            </View>
          </View>
          <View style={{ gap: 2 }}>
            {CLEANING_CHECKLIST.map((item, index) => {
              const done = task.checklist?.[String(index)] === true;
              return (
                <TouchableOpacity key={index} onPress={() => toggleItem(index)}
                  style={[s.checkItem, { backgroundColor: done ? SRS.green + '06' : 'transparent' }]}
                >
                  <View style={[s.checkbox, { borderColor: done ? SRS.green : GRAY[300], backgroundColor: done ? SRS.green : 'transparent' }]}>
                    {done && <IconSymbol name="check" size={10} color="#FFF" />}
                  </View>
                  <Text style={[s.checkLabel, { color: done ? SRS.green : SRS.navy, textDecorationLine: done ? 'line-through' : 'none' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Assignment */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="group" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Cleaner Assignment</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TextInput value={cleanerInput} onChangeText={setCleanerInput}
              placeholder="Enter cleaner name..." placeholderTextColor={GRAY[400]}
              style={[s.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={handleAssign} style={s.assignBtn}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Assign</Text>
            </TouchableOpacity>
          </View>
          {task.cleaner !== 'Unassigned' && (
            <Text style={{ ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: SPACING.sm }}>
              Currently assigned to <Text style={{ fontWeight: '600', color: SRS.navy }}>{task.cleaner}</Text>
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <IconSymbol name="edit" size={16} color={SRS.navy} />
            <Text style={s.cardTitle}>Notes</Text>
          </View>
          <TextInput value={notesInput} onChangeText={setNotesInput}
            placeholder="Add notes about this room..." placeholderTextColor={GRAY[400]}
            multiline numberOfLines={3} style={[s.input, { minHeight: 72, textAlignVertical: 'top', marginBottom: SPACING.sm }]}
          />
          <TouchableOpacity onPress={handleSaveNotes} style={s.saveBtn}>
            <IconSymbol name="save" size={14} color={SRS.teal} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: SRS.teal, marginLeft: 4 }}>Save Notes</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        {actionLabel && nextStatus && (
          <TouchableOpacity onPress={handleAdvance} style={[s.ctaBtn, { backgroundColor: SRS.teal }]} activeOpacity={0.85}>
            <IconSymbol name="check" size={16} color="#FFF" />
            <Text style={s.ctaText}>{actionLabel} → {nextStatus}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  sub: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, gap: SPACING.lg },
  card: { backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md },
  flowDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flowLine: { width: 40, height: 3, borderRadius: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.button },
  checkbox: { width: 20, height: 20, borderRadius: RADIUS.button, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, ...TYPOGRAPHY.body },
  checklistCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.badge, marginLeft: 'auto' },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: SRS.navy },
  assignBtn: { backgroundColor: SRS.teal, paddingHorizontal: 14, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '10' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, ...SHADOWS.card },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
