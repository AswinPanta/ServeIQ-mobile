import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { SRS, BG, SLATE, BLUE, AMBER, PURPLE, TEAL, RED } from '@/lib/constants/figma-tokens';

const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  hk_alert: { icon: 'sparkles', color: PURPLE[500] },
  system: { icon: 'settings-outline', color: SLATE[500] },
  payment: { icon: 'card-outline', color: AMBER[500] },
  new_order: { icon: 'restaurant-outline', color: TEAL[600] },
  kitchen_ready: { icon: 'checkmark-circle-outline', color: SRS.green },
  review: { icon: 'star-outline', color: BLUE[500] },
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OperationsNotificationsScreen() {
  const notifications = useNotificationStore(s => s.notifications);
  const markAsRead = useNotificationStore(s => s.markAsRead);
  const markAllRead = useNotificationStore(s => s.markAllRead);
  const clearAll = useNotificationStore(s => s.clearAll);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.headerIconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={SLATE[700]} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && <Text style={s.headerSub}>{unreadCount} unread</Text>}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}><Text style={s.markAllText}>Mark all read</Text></TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {notifications.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={SLATE[300]} />
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptySub}>Activity like orders, check-outs and task alerts will appear here.</Text>
          </View>
        ) : (
          notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            return (
              <TouchableOpacity
                key={n.id}
                style={[s.card, !n.read && s.cardUnread]}
                onPress={() => markAsRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={[s.iconBox, { backgroundColor: cfg.color + '14' }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={s.itemBody}>
                  <Text style={s.itemTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={s.itemMsg} numberOfLines={2}>{n.message}</Text>
                  <Text style={s.itemTime}>{timeAgo(n.created_at)}</Text>
                </View>
                {!n.read && <View style={s.dot} />}
              </TouchableOpacity>
            );
          })
        )}
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={s.clearBtn}>
            <Text style={s.clearBtnText}>Clear all notifications</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  headerSub: { fontSize: 12, color: SLATE[400], marginTop: 1 },
  markAllText: { fontSize: 13, fontWeight: '600', color: TEAL[600] },
  empty: { alignItems: 'center', paddingTop: 72, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: SLATE[500] },
  emptySub: { fontSize: 13, color: SLATE[400], textAlign: 'center', lineHeight: 18 },
  card: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  cardUnread: { borderColor: TEAL[600] + '55', backgroundColor: TEAL[600] + '14' },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: SLATE[900] },
  itemMsg: { fontSize: 13, color: SLATE[500], marginTop: 3, lineHeight: 18 },
  itemTime: { fontSize: 11, color: SLATE[400], marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL[600], marginTop: 4 },
  clearBtn: { marginHorizontal: 16, marginTop: 20, paddingVertical: 13, borderRadius: 12, backgroundColor: RED[50], borderWidth: 1, borderColor: RED[200], alignItems: 'center' },
  clearBtnText: { fontSize: 14, fontWeight: '700', color: RED[500] },
});