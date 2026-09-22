import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, GRAY } from '@/constants/portal-theme';
import { safeGoBack } from '@/lib/utils';
import { BG, SRS as SRSTokens, AMBER, RED, EMERALD, BLUE, PURPLE } from '@/lib/constants/figma-tokens';
import { useNotifications } from '@/lib/context/notification-context';

type Category = 'all' | 'guest_requests' | 'arrivals' | 'housekeeping' | 'payments';

const TABS: { key: Category; label: string; icon: Parameters<typeof IconSymbol>[0]['name'] }[] = [
  { key: 'all', label: 'All', icon: 'bell' },
  { key: 'guest_requests', label: 'Requests', icon: 'message' },
  { key: 'arrivals', label: 'Arrivals', icon: 'checkin' },
  { key: 'housekeeping', label: 'Housekeeping', icon: 'housekeeping' },
  { key: 'payments', label: 'Payments', icon: 'payment' },
];

interface InboxItem {
  id: string;
  category: Exclude<Category, 'all'>;
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  icon: Parameters<typeof IconSymbol>[0]['name'];
  color: string;
}

function relTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { notifications: ctxNotifs, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [tab, setTab] = useState<Category>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    refreshNotifications();
  }, []);

  const items = useMemo((): InboxItem[] => {
    const CATEGORY_MAP: Record<string, { category: InboxItem['category']; icon: InboxItem['icon']; color: string }> = {
      booking: { category: 'arrivals', icon: 'checkin', color: SRSTokens.green },
      checkin: { category: 'arrivals', icon: 'checkin', color: SRSTokens.green },
      checkout: { category: 'arrivals', icon: 'checkin', color: SRSTokens.green },
      payment: { category: 'payments', icon: 'payment', color: SRSTokens.orange },
      maintenance: { category: 'housekeeping', icon: 'housekeeping', color: PURPLE[700] },
      subscription: { category: 'guest_requests', icon: 'message', color: BLUE[500] },
      review: { category: 'guest_requests', icon: 'message', color: BLUE[500] },
      system: { category: 'guest_requests', icon: 'message', color: BLUE[500] },
      cancellation: { category: 'payments', icon: 'payment', color: RED[500] },
    };
    return ctxNotifs.map(n => {
      const cat = CATEGORY_MAP[n.type] || CATEGORY_MAP.system;
      return {
        id: n.id,
        category: cat.category,
        title: n.title,
        description: n.message,
        created_at: n.created_at,
        read: n.read,
        icon: cat.icon,
        color: cat.color,
      };
    });
  }, [ctxNotifs]);

  const withRead = useMemo(
    () => items.map(i => (readIds.has(i.id) ? { ...i, read: true } : i)),
    [items, readIds],
  );

  const filtered = useMemo(
    () => (tab === 'all' ? withRead : withRead.filter(i => i.category === tab)),
    [withRead, tab],
  );

  const unreadCount = withRead.filter(i => !i.read).length;
  const tabCounts = useMemo(() => {
    const counts = new Map<Category, number>();
    counts.set('all', withRead.length);
    withRead.forEach(i => counts.set(i.category, (counts.get(i.category) || 0) + 1));
    return counts;
  }, [withRead]);

  const markAllRead = () => {
    markAllAsRead();
    setReadIds(new Set(withRead.map(i => i.id)));
  };
  const markRead = (id: string) => {
    markAsRead(id);
    setReadIds(prev => new Set(prev).add(id));
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.sub}>Guest needs, room readiness, and team handoffs</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
            <IconSymbol name="check" size={14} color={SRS.teal} />
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
        {TABS.map(t => {
          const count = tabCounts.get(t.key) || 0;
          if (t.key !== 'all' && count === 0) return null;
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[s.tabChip, active && s.tabChipActive]}>
              <IconSymbol name={t.icon} size={12} color={active ? BG.white : GRAY[500]} />
              <Text style={[s.tabChipText, active && { color: BG.white }]}>
                {t.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <IconSymbol name="bell" size={40} color={GRAY[300]} />
            <Text style={s.emptyText}>No notifications</Text>
            <Text style={s.emptyHint}>You're all caught up!</Text>
          </View>
        ) : (
          filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => markRead(item.id)}
              style={[s.itemCard, !item.read && s.itemCardUnread]}
              activeOpacity={0.7}
            >
              <View style={[s.itemIcon, { backgroundColor: item.color + '15' }]}>
                <IconSymbol name={item.icon} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                  {!item.read && <View style={[s.unreadDot, { backgroundColor: item.color }]} />}
                </View>
                <Text style={s.itemDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={s.itemTime}>{relTime(item.created_at)}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={GRAY[300]} />
            </TouchableOpacity>
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
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2, flex: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '10' },
  markAllText: { fontSize: 11, fontWeight: '700', color: SRS.teal },

  tabScroll: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingBottom: SPACING.md },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200] },
  tabChipActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  tabChipText: { fontSize: 12, fontWeight: '600', color: GRAY[600] },

  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[100], padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, gap: SPACING.md },
  itemCardUnread: { borderColor: SRS.teal + '40' },
  itemIcon: { width: 38, height: 38, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, flexShrink: 1 },
  itemDesc: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  itemTime: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 3 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400], fontWeight: '600' },
  emptyHint: { ...TYPOGRAPHY.caption, color: GRAY[400] },
});
