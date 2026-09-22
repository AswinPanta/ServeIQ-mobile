import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { safeGoBack } from '@/lib/utils';
import { BG, SRS as SRSTokens, AMBER, RED, EMERALD, BLUE, PURPLE } from '@/lib/constants/figma-tokens';
import { staffApi } from '@/lib/api/host-api';
import { useAuth } from '@/lib/context/auth-context';
import type { BackendActivityLog } from '@/types/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function typeColor(type: string): string {
  const t = (type || '').toUpperCase();
  if (t.includes('GUEST') || t.includes('REQUEST')) return BLUE[500];
  if (t.includes('TURNOVER') || t.includes('TURN')) return PURPLE[700];
  if (t.includes('MAINTENANCE')) return RED[500];
  if (t.includes('CLEAN') || t.includes('SUBMIT')) return SRSTokens.green;
  if (t.includes('REVIEW') || t.includes('INSPECT')) return SRSTokens.orange;
  return GRAY[500];
}

function isUrgent(type: string): boolean {
  const t = (type || '').toUpperCase();
  return t.includes('URGENT') || t.includes('MAINTENANCE');
}

function isCompletedType(type: string): boolean {
  const t = (type || '').toUpperCase();
  return t.includes('COMPLETED') || t.includes('SUBMITTED') || t.includes('REVIEWED');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function initials(name: string): string {
  return (name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function TasksScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState<BackendActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Full housekeeping activity feed (dashboard shows only the last 8 — this is the complete view)
  useEffect(() => {
    const propId = (user as { property_id?: string } | null)?.property_id;
    if (!propId || !UUID_RE.test(propId)) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      staffApi.getHousekeepingActivities(propId, { skip: 0, limit: 100 }),
      staffApi.getBookingActivities(propId, { skip: 0, limit: 100 }),
    ])
      .then(([hk, booking]) => {
        if (cancelled) return;
        const merged = [...hk, ...booking].sort(
          (a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0),
        );
        setActivities(merged);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    let list = activities;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        (a.description || '').toLowerCase().includes(q) ||
        (a.staff_name || '').toLowerCase().includes(q) ||
        (a.activity_type || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [activities, search]);

  const activeTasks = filtered.filter(a => !isCompletedType(a.activity_type));
  const completedTasks = filtered.filter(a => isCompletedType(a.activity_type));
  const urgentCount = activeTasks.filter(a => isUrgent(a.activity_type)).length;
  const shown = tab === 'active' ? activeTasks : completedTasks;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Tasks & Requests</Text>
          <Text style={s.sub}>Room turnovers, guest requests, maintenance, and team assignments</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { borderColor: BLUE[500] + '30' }]}>
          <Text style={[s.statValue, { color: BLUE[500] }]}>{filtered.length}</Text>
          <Text style={s.statLabel}>Total Today</Text>
        </View>
        <View style={[s.statCard, { borderColor: AMBER[500] + '30' }]}>
          <Text style={[s.statValue, { color: SRSTokens.orange }]}>{activeTasks.length}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={[s.statCard, { borderColor: RED[500] + '30' }]}>
          <Text style={[s.statValue, { color: RED[500] }]}>{urgentCount}</Text>
          <Text style={s.statLabel}>Urgent</Text>
        </View>
        <View style={[s.statCard, { borderColor: EMERALD[500] + '30' }]}>
          <Text style={[s.statValue, { color: SRSTokens.green }]}>{completedTasks.length}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <IconSymbol name="search" size={16} color={GRAY[400]} />
        <TextInput
          placeholder="Search tasks, room, assignee..."
          placeholderTextColor={GRAY[400]}
          value={search}
          onChangeText={setSearch}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <IconSymbol name="close" size={16} color={GRAY[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {([
          { key: 'active' as const, label: `Active (${activeTasks.length})` },
          { key: 'completed' as const, label: `Completed (${completedTasks.length})` },
        ]).map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[s.tabBtn, tab === t.key && s.tabBtnActive]}>
            <Text style={[s.tabLabel, tab === t.key && { color: BG.white }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <Text style={s.loadingText}>Loading activities…</Text>
        ) : shown.length === 0 ? (
          <View style={s.emptyState}>
            <IconSymbol name="tasks" size={40} color={GRAY[300]} />
            <Text style={s.emptyText}>{tab === 'active' ? 'No active tasks' : 'No completed tasks'}</Text>
          </View>
        ) : (
          shown.map(a => {
            const done = tab === 'completed';
            const color = typeColor(a.activity_type);
            return (
              <View key={a.id} style={[s.taskCard, done && { opacity: 0.6 }]}>
                <View style={[s.taskDot, { backgroundColor: isUrgent(a.activity_type) ? RED[500] : color }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[s.taskDesc, done && { textDecorationLine: 'line-through' }]} numberOfLines={2}>
                      {a.description || '—'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <View style={[s.typeBadge, { backgroundColor: color + '15' }]}>
                      <Text style={[s.typeBadgeText, { color }]}>{a.activity_type || '—'}</Text>
                    </View>
                    {a.room_id && <Text style={s.taskMeta}>Room {a.room_id}</Text>}
                    <Text style={s.taskMeta}>{formatTime(a.created_at)}</Text>
                  </View>
                </View>
                <View style={[s.avatar, { backgroundColor: color + '15' }]}>
                  <Text style={[s.avatarText, { color }]}>{initials(a.staff_name)}</Text>
                </View>
              </View>
            );
          })
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

  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, padding: SPACING.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200], gap: 8, paddingHorizontal: 12, marginHorizontal: SPACING.lg },
  searchInput: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 11 },

  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.md },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200] },
  tabBtnActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[600] },

  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[100], padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, gap: SPACING.md },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskDesc: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy, flex: 1 },
  taskMeta: { ...TYPOGRAPHY.caption, color: GRAY[400] },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700' },

  loadingText: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center', paddingVertical: SPACING.xl },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.md },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },
});
