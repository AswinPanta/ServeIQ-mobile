import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousekeepingStore, STATUS_ORDER, STATUS_FLOW_COLORS } from '@/stores/useHousekeepingStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuth } from '@/lib/context/auth-context';
import { SyncIndicator } from '@/components/operations/SyncIndicator';
import { safeGoBack } from '@/lib/utils';
import { HK_COLORS as C, HK_STATUS_TEXT as STATUS_TEXT_COLORS, HK_STATUS_BG as STATUS_BGS } from '@/lib/constants/housekeeping-theme';
import { TEXT, STATUS, UI } from '@/lib/constants/figma-tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// Bottom nav items matching Figma SVG
const BOTTOM_NAV = [
  { id: 'home', label: 'Home', icon: 'home' as const },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'sparkles' as const },
  { id: 'front-desk', label: 'Front Desk', icon: 'desktop' as const },
];

export default function HousekeepingScreen() {
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const tasks = useHousekeepingStore((s) => s.tasks);
  const setPropertyId = useHousekeepingStore((s) => s.setPropertyId);
  const refreshSyncCount = useHousekeepingStore((s) => s.refreshSyncCount);

  useEffect(() => {
    if (operator?.property_id) {
      setPropertyId(operator.property_id);
    }
    refreshSyncCount();
  }, [operator?.property_id, setPropertyId]);

  const [activeNav, setActiveNav] = useState('housekeeping');

  const stats = useMemo(() => {
    const dirty = tasks.filter((t) => t.status === 'Dirty').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const cleaned = tasks.filter((t) => t.status === 'Cleaned').length;
    const inspected = tasks.filter((t) => t.status === 'Inspected').length;
    const allGood = dirty === 0 && inProgress === 0;
    return { dirty, inProgress, cleaned, inspected, total: tasks.length, allGood };
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

  const handleCardPress = (room: string) => {
    router.push(`/(operations)/housekeeping/${room}`);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <View style={s.container}>
      <SyncIndicator compact />

      {/* Header — matches Figma SVG exactly */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerTitleWrap}>
            <Text style={s.headerTitle}>Housekeeping</Text>
            <Text style={s.headerSub}>{dateStr} · {timeStr}</Text>
          </View>
          <TouchableOpacity style={s.menuBtn}>
            <Ionicons name="menu" size={20} color={C.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Status indicator — matches Figma green dot with "All good" text */}
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: stats.allGood ? STATUS.activeGreen : UI.warning }]} />
          <Text style={[s.statusText, { color: stats.allGood ? STATUS.cleaned : UI.warningText }]}>
            {stats.allGood ? 'All good' : `${stats.dirty + stats.inProgress} need attention`}
          </Text>
        </View>
      </View>

      {/* Room cards grid — matches Figma SVG card layout */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={C.border} />
            <Text style={s.emptyTitle}>No rooms to clean</Text>
            <Text style={s.emptySub}>All rooms are inspected and ready</Text>
          </View>
        ) : (
        <View style={s.cardGrid}>
          {tasks.map((task) => {
            const statusColor = STATUS_TEXT_COLORS[task.status] || C.textMuted;
            const statusBg = STATUS_BGS[task.status] || C.inactive;
            return (
              <TouchableOpacity
                key={task.id}
                onPress={() => handleCardPress(task.room)}
                style={s.roomCard}
                activeOpacity={0.7}
              >
                {/* Room number in colored box */}
                <View style={[s.roomNumberBox, { backgroundColor: statusBg }]}>
                  <Text style={[s.roomNumber, { color: statusColor }]}>{task.room}</Text>
                </View>

                {/* Room info */}
                <Text style={s.roomName}>Room {task.room}</Text>
                <Text style={s.roomMeta}>Floor {task.floor}</Text>
                <Text style={s.roomMeta}>{task.taskType?.replace(/_/g, ' ') || 'Standard'}</Text>

                {/* Status tag */}
                <View style={[s.statusTag, { backgroundColor: statusBg }]}>
                  <View style={[s.statusTagDot, { backgroundColor: statusColor }]} />
                  <Text style={[s.statusTagText, { color: statusColor }]}>{task.status}</Text>
                </View>

                {/* Action button */}
                {task.status !== 'Inspected' && (
                  <TouchableOpacity
                    onPress={() => handleAdvance(task.room)}
                    style={[s.actionBtn, { backgroundColor: C.teal }]}
                  >
                    <Text style={s.actionBtnText}>
                      {task.status === 'Dirty' ? 'Start' : task.status === 'In Progress' ? 'Clean' : 'Inspect'}
                    </Text>
                  </TouchableOpacity>
                )}
                {task.status === 'Inspected' && (
                  <View style={s.completedRow}>
                    <Ionicons name="checkmark-circle" size={14} color={C.cleaned} />
                    <Text style={s.completedText}>Done</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        )}
      </ScrollView>

      {/* Bottom navigation — matches Figma SVG */}
      <View style={s.bottomNav}>
        {BOTTOM_NAV.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              if (item.id === 'home') router.replace('/(operations)');
              else setActiveNav(item.id);
            }}
            style={s.navItem}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={activeNav === item.id ? C.teal : C.textMuted}
            />
            <Text style={[s.navLabel, { color: activeNav === item.id ? C.teal : C.textMuted }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  // Header
  header: {
    backgroundColor: C.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textHeading,
  },
  headerSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Status indicator
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Card grid
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCard: {
    width: CARD_WIDTH,
    backgroundColor: C.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  roomNumberBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textHeading,
  },
  roomMeta: {
    fontSize: 12,
    color: C.textMuted,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT.inverse,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.cleaned,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textHeading,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: C.textMuted,
  },
  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
