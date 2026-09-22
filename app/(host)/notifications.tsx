import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from '@/lib/utils';
import { BLUE, STATUS, AMBER, RED, PURPLE, CYAN, PINK, GRAY, SLATE, BG } from '@/lib/constants/figma-tokens';
import { useNotifications } from '@/lib/context/notification-context';

const ACCENT = BLUE[600];

type NotifType = 'booking' | 'checkin' | 'checkout' | 'cancellation' | 'maintenance' | 'payment' | 'subscription' | 'review' | 'system';

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; label: string }> = {
  booking: { icon: 'calendar', color: BLUE[500], label: 'Booking' },
  checkin: { icon: 'checkin', color: STATUS.activeGreen, label: 'Check-in' },
  checkout: { icon: 'checkout', color: AMBER[500], label: 'Check-out' },
  cancellation: { icon: 'cancel', color: RED[500], label: 'Cancellation' },
  maintenance: { icon: 'settings', color: PURPLE[500], label: 'Maintenance' },
  payment: { icon: 'payment', color: CYAN[500], label: 'Payment' },
  subscription: { icon: 'wallet', color: PINK[500], label: 'Subscription' },
  review: { icon: 'star', color: AMBER[500], label: 'Review' },
  system: { icon: 'verified', color: GRAY[500], label: 'System' },
};

const PRIORITY_DOT: Record<string, string> = {
  high: RED[500],
  medium: AMBER[500],
  low: STATUS.activeGreen,
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'booking', label: 'Bookings' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'subscription', label: 'Subscriptions' },
  { key: 'checkin', label: 'Check-ins' },
  { key: 'checkout', label: 'Check-outs' },
  { key: 'payment', label: 'Payments' },
  { key: 'cancellation', label: 'Cancellations' },
];

export default function HostNotificationsScreen() {
  const { notifications: ctxNotifs, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refreshNotifications();
  }, []);

  const notifications = ctxNotifs.map(n => ({
    ...n,
    type: (n.type || 'system') as NotifType,
    time: n.timestamp,
    property: 'Platform',
    priority: 'medium' as const,
  }));

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const markRead = (id: string) => markAsRead(id);
  const markAllRead = () => markAllAsRead();

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?');
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={s.unreadLabel}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
              <Text style={s.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary cards */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: BLUE[50] }]}>
            <IconSymbol name="calendar" size={16} color={BLUE[500]} />
            <Text style={s.summaryCount}>{notifications.filter(n => n.type === 'booking' || n.type === 'checkin' || n.type === 'checkout' || n.type === 'cancellation').length}</Text>
            <Text style={s.summaryLabel}>Bookings</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: PURPLE[50] }]}>
            <IconSymbol name="settings" size={16} color={PURPLE[500]} />
            <Text style={s.summaryCount}>{notifications.filter(n => n.type === 'maintenance').length}</Text>
            <Text style={s.summaryLabel}>Maintenance</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: PINK[50] }]}>
            <IconSymbol name="wallet" size={16} color={PINK[500]} />
            <Text style={s.summaryCount}>{notifications.filter(n => n.type === 'subscription').length}</Text>
            <Text style={s.summaryLabel}>Subscription</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[s.filterChip, filter === f.key && s.filterChipActive]}
            >
              <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <IconSymbol name="notifications" size={32} color={SLATE[200]} />
            </View>
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptyDesc}>
              {filter === 'unread' ? "You're all caught up!" : 'No notifications match this filter.'}
            </Text>
          </View>
        ) : (
          filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            return (
              <TouchableOpacity
                key={n.id}
                style={[s.card, !n.read && s.cardUnread]}
                onPress={() => markRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={s.cardLeft}>
                  <View style={[s.typeIcon, { backgroundColor: cfg.color + '14' }]}>
                    <IconSymbol name={cfg.icon as any} size={16} color={cfg.color} />
                  </View>
                  <View style={[s.priorityDot, { backgroundColor: PRIORITY_DOT[n.priority] }]} />
                </View>
                <View style={s.cardContent}>
                  <View style={s.cardTop}>
                    <Text style={s.cardTitle} numberOfLines={1}>{n.title}</Text>
                    {!n.read && <View style={s.unreadDot} />}
                  </View>
                  <Text style={s.cardMessage} numberOfLines={2}>{n.message}</Text>
                  <View style={s.cardMeta}>
                    <View style={[s.propBadge, { backgroundColor: cfg.color + '10' }]}>
                      <IconSymbol name="hotel" size={10} color={cfg.color} />
                      <Text style={[s.propText, { color: cfg.color }]} numberOfLines={1}>{n.property}</Text>
                    </View>
                    <Text style={s.timeText}>{n.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={s.clearBtn}>
            <Text style={s.clearBtnText}>Clear All Notifications</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900] },
  unreadLabel: { fontSize: 13, color: SLATE[400], marginTop: 2 },
  markAllBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: ACCENT + '10' },
  markAllText: { fontSize: 13, fontWeight: '600', color: ACCENT },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 4,
  },
  summaryCount: { fontSize: 18, fontWeight: '800', color: SLATE[900] },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: SLATE[500] },

  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200] },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  filterTextActive: { color: BG.white },

  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
  },
  cardUnread: { borderColor: ACCENT + '30', backgroundColor: ACCENT + '04' },
  cardLeft: { alignItems: 'center', gap: 6 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  cardContent: { flex: 1, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: SLATE[900], flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  cardMessage: { fontSize: 13, color: SLATE[500], lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  propBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 1 },
  propText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  timeText: { fontSize: 11, color: SLATE[400] },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  emptyDesc: { fontSize: 14, color: SLATE[400], textAlign: 'center' },

  clearBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8, borderRadius: 12, backgroundColor: RED[50], borderWidth: 1, borderColor: RED[200] },
  clearBtnText: { fontSize: 14, fontWeight: '700', color: RED[500] },
});
