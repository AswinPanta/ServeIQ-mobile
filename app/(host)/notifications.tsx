import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from '@/lib/utils';
import { useHost } from '@/lib/context/host-context';

const ACCENT = '#2563EB';

type NotifType = 'booking' | 'checkin' | 'checkout' | 'cancellation' | 'maintenance' | 'payment' | 'subscription' | 'review' | 'system';

interface HostNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  property: string;
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; label: string }> = {
  booking: { icon: 'calendar', color: '#3B82F6', label: 'Booking' },
  checkin: { icon: 'checkin', color: '#10B981', label: 'Check-in' },
  checkout: { icon: 'checkout', color: '#F59E0B', label: 'Check-out' },
  cancellation: { icon: 'cancel', color: '#EF4444', label: 'Cancellation' },
  maintenance: { icon: 'settings', color: '#8B5CF6', label: 'Maintenance' },
  payment: { icon: 'payment', color: '#06B6D4', label: 'Payment' },
  subscription: { icon: 'wallet', color: '#EC4899', label: 'Subscription' },
  review: { icon: 'star', color: '#F59E0B', label: 'Review' },
  system: { icon: 'verified', color: '#6B7280', label: 'System' },
};

const PRIORITY_DOT: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
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

function buildNotifications(properties: { name: string }[]): HostNotification[] {
  const pNames = properties.map(p => p.name);
  const p1 = pNames[0] || 'Your Property';
  const p2 = pNames[1] || p1;
  const p3 = pNames[2] || p1;

  return [
    {
      id: 'hn1', type: 'booking', title: `New Booking — ${p1}`,
      message: `Rahul Sharma booked Annapurna Penthouse (3 nights, Aug 15–18). Total: NPR 156,000.`,
      property: p1, time: '5 min ago', read: false, priority: 'high',
    },
    {
      id: 'hn2', type: 'checkin', title: `Check-in Completed — ${p1}`,
      message: 'Guest Priya Adhikari checked into Courtyard Room. ID verified, welcome kit delivered.',
      property: p1, time: '18 min ago', read: false, priority: 'medium',
    },
    {
      id: 'hn3', type: 'maintenance', title: `Maintenance Request — ${p2}`,
      message: 'Room 204 (Mountain Suite): AC not cooling. Maintenance team dispatched. ETA 30 min.',
      property: p2, time: '32 min ago', read: false, priority: 'high',
    },
    {
      id: 'hn4', type: 'subscription', title: 'Subscription Renewal Due',
      message: 'Your Premium Host plan renews on Aug 20, 2026. NPR 4,999/year. Ensure billing info is up to date.',
      property: 'Platform', time: '1 hr ago', read: false, priority: 'high',
    },
    {
      id: 'hn5', type: 'payment', title: `Payment Received — ${p2}`,
      message: 'NPR 42,500 received for booking #BK-2026-0847 via Khalti. Folio updated.',
      property: p2, time: '1.5 hrs ago', read: false, priority: 'medium',
    },
    {
      id: 'hn6', type: 'cancellation', title: `Cancellation — ${p3}`,
      message: 'Booking #BK-2026-0832 cancelled by guest. 1-night penalty applied per policy.',
      property: p3, time: '2 hrs ago', read: false, priority: 'high',
    },
    {
      id: 'hn7', type: 'checkout', title: `Check-out Completed — ${p1}`,
      message: 'Guest Thomas Hall checked out of Lakeview Room. Room marked for housekeeping.',
      property: p1, time: '3 hrs ago', read: true, priority: 'low',
    },
    {
      id: 'hn8', type: 'review', title: `New 5-Star Review — ${p1}`,
      message: '"Absolutely magical stay!" — Yuki S. gave 5/5 stars. Review published.',
      property: p1, time: '4 hrs ago', read: true, priority: 'low',
    },
    {
      id: 'hn9', type: 'maintenance', title: `Maintenance Completed — ${p2}`,
      message: 'Room 108 (Deluxe Lake View): Plumbing fixed. Room status changed to Available.',
      property: p2, time: '5 hrs ago', read: true, priority: 'low',
    },
    {
      id: 'hn10', type: 'subscription', title: 'New Feature: Express Check-in',
      message: 'SuperAdmin has enabled Express Check-in for your properties. Guests can now check in via QR code.',
      property: 'Platform', time: '6 hrs ago', read: true, priority: 'medium',
    },
    {
      id: 'hn11', type: 'booking', title: `Bulk Booking — ${p3}`,
      message: 'Corporate group booking: 8 rooms, Sep 5–8. 10% group discount applied automatically.',
      property: p3, time: '8 hrs ago', read: true, priority: 'high',
    },
    {
      id: 'hn12', type: 'system', title: 'Platform Update v2.4',
      message: 'New analytics dashboard available. Check your host portal for revenue insights and booking trends.',
      property: 'Platform', time: '12 hrs ago', read: true, priority: 'low',
    },
  ];
}

export default function HostNotificationsScreen() {
  const { properties } = useHost();
  const [notifications, setNotifications] = useState<HostNotification[]>(() => buildNotifications(properties));
  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setNotifications([]) },
    ]);
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
          <View style={[s.summaryCard, { backgroundColor: '#EFF6FF' }]}>
            <IconSymbol name="calendar" size={16} color="#3B82F6" />
            <Text style={s.summaryCount}>{notifications.filter(n => n.type === 'booking' || n.type === 'checkin' || n.type === 'checkout' || n.type === 'cancellation').length}</Text>
            <Text style={s.summaryLabel}>Bookings</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: '#F5F3FF' }]}>
            <IconSymbol name="settings" size={16} color="#8B5CF6" />
            <Text style={s.summaryCount}>{notifications.filter(n => n.type === 'maintenance').length}</Text>
            <Text style={s.summaryLabel}>Maintenance</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: '#FDF2F8' }]}>
            <IconSymbol name="wallet" size={16} color="#EC4899" />
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
              <IconSymbol name="notifications" size={32} color="#E2E8F0" />
            </View>
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptyDesc}>
              {filter === 'unread' ? "You're all caught up!" : 'No notifications match this filter.'}
            </Text>
          </View>
        ) : (
          filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type];
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  unreadLabel: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  markAllBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: ACCENT + '10' },
  markAllText: { fontSize: 13, fontWeight: '600', color: ACCENT },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 4,
  },
  summaryCount: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFF' },

  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardUnread: { borderColor: ACCENT + '30', backgroundColor: ACCENT + '04' },
  cardLeft: { alignItems: 'center', gap: 6 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  cardContent: { flex: 1, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  cardMessage: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  propBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 1 },
  propText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  timeText: { fontSize: 11, color: '#94A3B8' },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },

  clearBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  clearBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
