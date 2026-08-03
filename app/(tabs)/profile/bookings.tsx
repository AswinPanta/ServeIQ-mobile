import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBookings } from '@/lib/context/booking-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';

type BookingTab = 'upcoming' | 'completed' | 'cancelled';

const TABS: BookingTab[] = ['upcoming', 'completed', 'cancelled'];

const CORAL = '#E63946';
const NAVY = '#1A3C5E';

const STATUS_BADGE = {
  upcoming: { bg: CORAL + '14', text: CORAL },
  completed: { bg: '#1E844914', text: '#1E8449' },
  cancelled: { bg: '#C0392B14', text: '#C0392B' },
} as const;

export default function BookingsScreen() {
  const { bookings } = useBookings();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = bookings.filter(b => b.status === activeTab);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const renderBooking = ({ item }: { item: typeof bookings[number] }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.hotelName} numberOfLines={1}>{item.hotelName}</Text>
        <View style={[s.badge, { backgroundColor: STATUS_BADGE[item.status].bg }]}>
          <Text style={[s.badgeText, { color: STATUS_BADGE[item.status].text }]}>
            {t('profile.bookings.' + item.status)}
          </Text>
        </View>
      </View>
      <View style={s.dateRow}>
        <View style={s.dateBlock}>
          <Text style={s.dateLabel}>{t('profile.bookings.checkin')}</Text>
          <Text style={s.dateValue}>
            {new Date(item.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color="#CBD5E1" />
        <View style={s.dateBlock}>
          <Text style={s.dateLabel}>{t('profile.bookings.checkout')}</Text>
          <Text style={s.dateValue}>
            {new Date(item.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>
      <View style={s.cardFooter}>
        <Text style={s.price}>
          NPR {item.totalPrice.toLocaleString()}
        </Text>
        <TouchableOpacity
          style={s.detailBtn}
          onPress={() => router.push(`/(tabs)/profile/bookings/${item.id}`)}
        >
          <Text style={s.detailBtnText}>{t('profile.bookings.viewDetails')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    const tabLabel = t('profile.bookings.' + activeTab);
    return (
      <View style={s.emptyState}>
        <View style={s.emptyIcon}>
          <IconSymbol name={activeTab === 'cancelled' ? 'cancel' : 'calendar'} size={32} color="#E2E8F0" />
        </View>
        <Text style={s.emptyTitle}>{t('profile.bookings.empty', { tab: tabLabel })}</Text>
        <Text style={s.emptyDesc}>{t('profile.bookings.emptyDesc', { tab: tabLabel })}</Text>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.title}>{t('profile.bookings.title')}</Text>
        <View style={s.backBtn} />
      </View>

      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {t('profile.bookings.' + tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderBooking}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filtered.length === 0 ? s.emptyList : s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CORAL} />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: NAVY, letterSpacing: -0.5, fontFamily: FONTS.sora },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8', fontFamily: FONTS.inter.semiBold },
  tabTextActive: { color: CORAL },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  emptyList: { flexGrow: 1 },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hotelName: { fontSize: 15, fontWeight: '700', color: NAVY, flex: 1, fontFamily: FONTS.inter.semiBold },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.inter.bold },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBlock: { flex: 1 },
  dateLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500', fontFamily: FONTS.inter.regular, marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#475569', fontFamily: FONTS.inter.medium },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  price: { fontSize: 16, fontWeight: '800', color: CORAL, fontFamily: FONTS.sora },
  detailBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: CORAL },
  detailBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF', fontFamily: FONTS.inter.bold },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: NAVY, fontFamily: FONTS.inter.semiBold },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20, fontFamily: FONTS.inter.regular },
});
