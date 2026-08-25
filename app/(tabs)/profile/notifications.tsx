import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useNotifications } from '@/lib/context/notification-context';
import { FONTS } from '@/constants/portal-theme';
import type { TFunction } from 'i18next';
import { CORAL, SRS, AMBER, STATUS_COLORS, STATUS, SLATE, GRAY, BRAND, NEUTRAL, BG } from '@/lib/constants/figma-tokens';

const ACCENT = CORAL[500];

const TYPE_CONFIG: Record<string, { icon: IconSymbolName; color: string }> = {
  booking_confirmation: { icon: 'booking', color: SRS.teal },
  booking_reminder: { icon: 'clock', color: AMBER[500] },
  review_request: { icon: 'star', color: STATUS_COLORS.gold },
  promotion: { icon: 'tag', color: STATUS.activeGreen },
  system: { icon: 'settings', color: SLATE[400] },
};

function formatTime(iso: string, t: TFunction): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t('profile.notifications.justNow');
  if (diffMins < 60) return t('profile.notifications.minutesAgo', { n: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t('profile.notifications.hoursAgo', { n: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t('profile.notifications.daysAgo', { n: diffDays });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAllAsRead, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const renderItem = ({ item }: { item: typeof sorted[0] }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    return (
      <View style={s.item}>
        <View style={[s.iconBox, { backgroundColor: cfg.color + '14' }]}>
          <IconSymbol name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={s.itemBody}>
          <View style={s.itemTop}>
            <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.itemTime}>{formatTime(item.created_at, t)}</Text>
          </View>
          <Text style={s.itemMsg} numberOfLines={2}>{item.message}</Text>
        </View>
        <View style={[s.dot, { backgroundColor: item.read ? GRAY[300] : ACCENT }]} />
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={BRAND.navyLight} />
        </TouchableOpacity>
        <Text style={s.title}>{t('profile.notifications.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={s.markAllBtn}>
            <Text style={s.markAllText}>{t('profile.notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={sorted.length === 0 ? s.emptyContainer : s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <IconSymbol name="notifications" size={48} color={GRAY[300]} />
            <Text style={s.emptyTitle}>{t('profile.notifications.empty')}</Text>
            <Text style={s.emptySub}>{t('profile.notifications.allCaughtUp')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: BG.white,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: BRAND.navyLight, marginLeft: 4, fontFamily: FONTS.sora },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { fontSize: 13, fontWeight: '600', color: ACCENT, fontFamily: FONTS.inter.semiBold },
  listContent: { paddingVertical: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BG.white,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[50],
    minHeight: 72,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemBody: { flex: 1, justifyContent: 'center' },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: BRAND.navyLight, flex: 1, fontFamily: FONTS.inter.semiBold },
  itemTime: { fontSize: 11, color: SLATE[400], marginLeft: 8, fontFamily: FONTS.inter.regular },
  itemMsg: { fontSize: 12, color: SLATE[500], lineHeight: 16, fontFamily: FONTS.inter.regular },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
  emptyBox: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: SLATE[400], fontFamily: FONTS.inter.semiBold },
  emptySub: { fontSize: 13, color: SLATE[300], fontFamily: FONTS.inter.regular },
});
