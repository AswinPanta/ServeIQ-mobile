import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousekeepingStore, STATUS_ORDER, STATUS_FLOW_COLORS, CLEANING_CHECKLIST } from '@/stores/useHousekeepingStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuth } from '@/lib/context/auth-context';
import { SyncIndicator } from '@/components/operations/SyncIndicator';
import { safeGoBack } from '@/lib/utils';
import { HK_COLORS as C, HK_STATUS_TEXT as STATUS_TEXT, HK_STATUS_BG as STATUS_BG } from '@/lib/constants/housekeeping-theme';
import { BG, TEXT } from '@/lib/constants/figma-tokens';

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const operator = user as { property_id?: string; role?: string } | null;
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
  }, [task]);

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

    const noteAdd = useNotificationStore.getState().addNotification;
    const managerChannel =
      operator?.role === 'front_desk' || operator?.role === 'manager' ? 'self' : 'manager';
    if (nextStatus === 'In Progress') {
      noteAdd({
        type: 'hk_alert',
        title: `Cleaning started — Room ${roomId}`,
        message: `Cleaning in progress (assigned to ${task.cleaner || 'unassigned'}). Manager notified.`,
        data: { target: managerChannel, roomId, nextStatus },
      });
    } else if (nextStatus === 'Cleaned') {
      noteAdd({
        type: 'hk_alert',
        title: `Room ${roomId} cleaned, awaiting inspection`,
        message: `Cleaner finished. Inspector on the way.`,
        data: { target: managerChannel, roomId, nextStatus },
      });
    } else if (nextStatus === 'Inspected') {
      noteAdd({
        type: 'hk_alert',
        title: `Room ${roomId} ready for guests`,
        message: `Cleaning + inspection complete. Ready for next assignment.`,
        data: { target: managerChannel, roomId, nextStatus },
      });
      useActivityStore.getState().addActivity({
        type: 'hk',
        title: `Room ${roomId} inspection complete`,
        description: `Room ${roomId} passed inspection, ready for assignment`,
        icon: '✅',
        color: C.cleaned,
      });
    }
  }, [task, roomId, allDone, operator?.role]);

  const toggleItem = useCallback(
    (index: number) => {
      const done = task?.checklist?.[String(index)] === true;
      useHousekeepingStore.getState().updateChecklist(roomId, index, !done);
    },
    [task, roomId]
  );

  const handleAssign = useCallback(() => {
    if (!cleanerInput.trim()) return;
    useHousekeepingStore.getState().assignCleaner(roomId, cleanerInput.trim());
    useActivityStore.getState().addActivity({
      type: 'hk',
      title: `Room ${roomId} assigned to ${cleanerInput.trim()}`,
      icon: '🔄',
      color: C.teal,
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
      <View style={s.notFound}>
        <Ionicons name="clipboard-outline" size={56} color={C.border} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: C.textHeading, marginTop: 12 }}>Room Not Found</Text>
        <Text style={{ fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 4 }}>
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

  const statusColor = STATUS_TEXT[task.status] || C.textMuted;
  const statusBg = STATUS_BG[task.status] || C.inactive;

  return (
    <View style={s.container}>
      <SyncIndicator compact />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={C.textMuted} />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.title}>Room {roomId}</Text>
          <Text style={s.sub}>
            Floor {task.floor} · {task.taskType?.replace(/_/g, ' ') || 'Standard'} · {task.cleaner}
          </Text>
        </View>
        <View style={[s.headerBadge, { backgroundColor: statusBg }]}>
          <Text style={[s.headerBadgeText, { color: statusColor }]}>{task.status}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Status Flow */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="git-network" size={16} color={C.textHeading} />
            <Text style={s.cardTitle}>Status Flow</Text>
          </View>
          <View style={s.flowRow}>
            {STATUS_ORDER.map((status, i) => {
              const idx = STATUS_ORDER.indexOf(task.status);
              const isPast = i <= idx;
              const isCurrent = i === idx;
              const flowColor = STATUS_TEXT[status] || C.textMuted;
              const flowBg = STATUS_BG[status] || C.inactive;
              return (
                <React.Fragment key={status}>
                  {i > 0 && <View style={[s.flowLine, { backgroundColor: isPast ? flowColor : C.border }]} />}
                  <View style={[s.flowDot, { backgroundColor: isCurrent ? flowColor : isPast ? flowBg : C.inactive }]}>
                    {isPast && <Ionicons name="checkmark" size={10} color={isCurrent ? BG.white : flowColor} />}
                  </View>
                </React.Fragment>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor, textAlign: 'center', marginTop: 8 }}>
            Current: {task.status}
          </Text>
        </View>

        {/* Checklist */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="checkmark-circle" size={16} color={C.textHeading} />
            <Text style={s.cardTitle}>Cleaning Checklist</Text>
            <View style={[s.checklistCount, { backgroundColor: allDone ? C.badgeGreen : C.badgeBlue }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: allDone ? C.cleaned : C.teal }}>
                {completedCount}/{CLEANING_CHECKLIST.length}
              </Text>
            </View>
          </View>
          <View style={{ gap: 2 }}>
            {CLEANING_CHECKLIST.map((item, index) => {
              const done = task.checklist?.[String(index)] === true;
              return (
                <TouchableOpacity key={index} onPress={() => toggleItem(index)}
                  style={[s.checkItem, { backgroundColor: done ? C.badgeGreen + '40' : 'transparent' }]}
                >
                  <View style={[s.checkbox, { borderColor: done ? C.cleaned : C.border, backgroundColor: done ? C.cleaned : 'transparent' }]}>
                    {done && <Ionicons name="checkmark" size={10} color={BG.white} />}
                  </View>
                  <Text style={[s.checkLabel, { color: done ? C.textMuted : C.textPrimary, textDecorationLine: done ? 'line-through' : 'none' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Assignment */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="people" size={16} color={C.textHeading} />
            <Text style={s.cardTitle}>Cleaner Assignment</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput value={cleanerInput} onChangeText={setCleanerInput}
              placeholder="Enter cleaner name..." placeholderTextColor={C.textMuted}
              style={[s.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={handleAssign} style={s.assignBtn}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: BG.white }}>Assign</Text>
            </TouchableOpacity>
          </View>
          {task.cleaner !== 'Unassigned' && (
            <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>
              Currently assigned to <Text style={{ fontWeight: '600', color: C.textPrimary }}>{task.cleaner}</Text>
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="document-text" size={16} color={C.textHeading} />
            <Text style={s.cardTitle}>Notes</Text>
          </View>
          <TextInput value={notesInput} onChangeText={setNotesInput}
            placeholder="Add notes about this room..." placeholderTextColor={C.textMuted}
            multiline numberOfLines={3} style={[s.input, { minHeight: 72, textAlignVertical: 'top', marginBottom: 8 }]}
          />
          <TouchableOpacity onPress={handleSaveNotes} style={s.saveBtn}>
            <Ionicons name="save-outline" size={14} color={C.teal} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.teal, marginLeft: 4 }}>Save Notes</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        {actionLabel && nextStatus && (
          <TouchableOpacity onPress={handleAdvance} style={s.ctaBtn} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={16} color={BG.white} />
            <Text style={s.ctaText}>{actionLabel} → {nextStatus}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, backgroundColor: C.cardBg, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.inactive, alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: C.textHeading },
  sub: { fontSize: 12, color: C.textMuted },
  headerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: C.cardBg, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.textHeading, flex: 1 },
  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  flowDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  flowLine: { width: 40, height: 3, borderRadius: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, fontSize: 14, lineHeight: 21 },
  checklistCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginLeft: 'auto' },
  input: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: C.textPrimary },
  assignBtn: { backgroundColor: C.teal, paddingHorizontal: 14, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 4, backgroundColor: C.teal + '10' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 4, backgroundColor: C.navy, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 6 },
  ctaText: { fontSize: 15, fontWeight: '700', color: BG.white },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.pageBg, paddingHorizontal: 32 },
});
