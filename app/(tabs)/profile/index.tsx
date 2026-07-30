import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { useBookings } from '@/lib/context/booking-context';
import { useFavorites } from '@/lib/context/favorites-context';
import { useCoupons } from '@/lib/context/coupon-context';
import type { GuestProfile } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { BookingModifyModal } from "@/components/feature/booking-modify-modal";
import { FONTS } from '@/constants/portal-theme';

const ACCENT = '#2E86AB';
const NAVY = '#1A3C5E';

interface DiningReservation {
  id: string;
  restaurantName: string;
  section: string;
  date: string;
  time: string;
  partySize: number;
}

const DINING_KEY = 'stayeasy_dining_reservations';

function SectionRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: IconSymbolName;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.settingRow} onPress={onPress}>
      <View style={s.rowIcon}>
        <IconSymbol name={icon} size={18} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.settingLabel}>{label}</Text>
        {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const user = authUser as GuestProfile | null;
  const { bookings, cancelBooking } = useBookings();
  const { favorites } = useFavorites();
  const { activeCoupons } = useCoupons();

  const [photoData, setPhotoData] = useState('');
  const photoKey = user?.id ? `photo_${user.id}` : 'photo_guest';
  useEffect(() => { AsyncStorage.getItem(photoKey).then(d => { if (d) setPhotoData(d); }); }, [photoKey]);

  const firstName = user?.name?.split(' ')[0] || '';
  const displayInitials = (firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const loyaltyPoints = user && 'loyalty_points' in user ? (user as any).loyalty_points || 0 : 0;
  const tier = loyaltyPoints >= 5000 ? 'PLATINUM' : loyaltyPoints >= 2000 ? 'GOLD' : loyaltyPoints >= 500 ? 'SILVER' : 'BRONZE';
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
  const favoritesCount = favorites.size;

  const [diningReservations, setDiningReservations] = useState<DiningReservation[]>([]);
  const [modifyBooking, setModifyBooking] = useState<any>(null);
  useEffect(() => {
    AsyncStorage.getItem(DINING_KEY)
      .then(raw => {
        if (!raw) return;
        try {
          const list = JSON.parse(raw) as DiningReservation[];
          const today = new Date().toISOString().slice(0, 10);
          setDiningReservations(list.filter(r => r.date >= today));
        } catch { }
      })
      .catch(() => {});
  }, []);

  const tierColor = tier === 'PLATINUM' ? '#E5E4E2' : tier === 'GOLD' ? '#FFD700' : tier === 'SILVER' ? '#C0C0C0' : '#CD7F32';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('profile.title')}</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(t('profile.logout'), t('profile.logoutConfirmMessage'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('profile.logout'), style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
            ]);
          }}
          style={s.logoutBtn}
        >
          <IconSymbol name="logout" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Profile Card — tappable to About */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile/about')}
        style={s.profileCard}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={s.avatarBox}>
            {photoData ? (
              <Image source={{ uri: photoData }} style={s.avatar} resizeMode="cover" />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{displayInitials}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={s.userName}>{user?.name || t('profile.userLabel')}</Text>
            <Text style={s.userEmail}>{user?.email || ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={[s.tierDot, { backgroundColor: tierColor }]} />
              <Text style={[s.tierLabel, { color: tierColor }]}>{t('profile.' + tier.toLowerCase())}</Text>
            </View>
          </View>
          <View style={s.editBtn}>
            <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Loyalty */}
      <View style={s.loyaltyCard}>
        <View style={s.loyaltyTop}>
          <Text style={s.loyaltyLabel}>{t('profile.loyaltyPoints')}</Text>
          <Text style={[s.tierBadge, { color: tierColor, backgroundColor: tierColor + '18' }]}>{t('profile.' + tier.toLowerCase())}</Text>
        </View>
        <Text style={s.pointsValue}>{loyaltyPoints.toLocaleString()}</Text>
        {loyaltyPoints < 5000 && (
          <View style={s.progressBar}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${Math.min((loyaltyPoints / 5000) * 100, 100)}%` }]} />
            </View>
            <Text style={s.progressText}>
              {loyaltyPoints < 500 ? t('profile.pointsToNext', { n: 500 - loyaltyPoints, tier: t('profile.silver') }) : loyaltyPoints < 2000 ? t('profile.pointsToNext', { n: 2000 - loyaltyPoints, tier: t('profile.gold') }) : t('profile.pointsToNext', { n: 5000 - loyaltyPoints, tier: t('profile.platinum') })}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('profile.quickLinks')}</Text>

        <SectionRow
          icon="calendar"
          label={t('profile.myBookings')}
          subtitle={upcomingBookings.length > 0 ? t('profile.upcomingCount', { n: upcomingBookings.length }) : undefined}
          onPress={() => router.push('/(tabs)/profile/bookings')}
        />

        <SectionRow
          icon="heart"
          label={t('profile.savedHotels')}
          subtitle={favoritesCount > 0 ? t('profile.savedCount', { n: favoritesCount }) : undefined}
          onPress={() => router.push('/(tabs)/profile/favorites')}
        />

        <SectionRow
          icon="discount"
          label={t('profile.myCoupons')}
          subtitle={activeCoupons.length > 0 ? t('profile.activeCount', { n: activeCoupons.length }) : undefined}
          onPress={() => router.push('/(tabs)/profile/coupons')}
        />

        <SectionRow
          icon="star"
          label={t('profile.myReviews')}
          onPress={() => router.push('/(tabs)/profile/reviews')}
        />

        {diningReservations.length > 0 && (
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 12 }}>
            <Text style={[s.settingLabel, { marginBottom: 8 }]}>
              {t('profile.upcomingDining', { n: diningReservations.length })}
            </Text>
            {diningReservations.slice(0, 3).map(r => (
              <View key={r.id} style={s.diningCard}>
                <View style={s.diningIcon}>
                  <IconSymbol name="restaurant" size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.diningRestaurant}>{r.restaurantName} · {r.section}</Text>
                  <Text style={s.diningMeta}>
                    {r.date} · {r.time} · {r.partySize} {r.partySize === 1 ? t('profile.guest') : t('profile.guests')}
                  </Text>
                  <Text style={s.diningRef}>Ref {r.id}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      t('profile.cancelReservation'),
                      t('profile.cancelTable', { restaurant: r.restaurantName, date: r.date, time: r.time }),
                      [
                        { text: t('profile.keep'), style: 'cancel' },
                        {
                          text: t('profile.cancel'),
                          style: 'destructive',
                          onPress: () =>
                            AsyncStorage.getItem(DINING_KEY).then(raw => {
                              const list: DiningReservation[] = raw ? JSON.parse(raw) : [];
                              const next = list.filter(x => x.id !== r.id);
                              AsyncStorage.setItem(DINING_KEY, JSON.stringify(next));
                              setDiningReservations(prev => prev.filter(x => x.id !== r.id));
                            }),
                        },
                      ],
                    )
                  }
                  style={s.diningCancelBtn}
                >
                  <Text style={s.diningCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <SectionRow
          icon="notifications"
          label={t('profile.notifications')}
          onPress={() => router.push('/(tabs)/profile/notifications')}
        />
      </View>

      {/* Settings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('profile.settings')}</Text>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push('/profile-edit')}>
          <IconSymbol name="person.fill" size={18} color={NAVY} />
          <Text style={s.settingLabel}>{t('profile.editProfile')}</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/(tabs)/self-checkin")}>
          <IconSymbol name="checkin" size={18} color={ACCENT} />
          <Text style={s.settingLabel}>{t('profile.selfCheckin')}</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/(tabs)/self-checkout")}>
          <IconSymbol name="checkout" size={18} color={ACCENT} />
          <Text style={s.settingLabel}>{t('profile.selfCheckout')}</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/(tabs)/services")}>
          <IconSymbol name="waiter" size={18} color={ACCENT} />
          <Text style={s.settingLabel}>{t('profile.hotelServices')}</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/post-stay-review")}>
          <IconSymbol name="star" size={18} color="#FFD700" />
          <Text style={s.settingLabel}>{t('profile.writeReview')}</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {modifyBooking && (
        <BookingModifyModal
          visible={!!modifyBooking}
          onClose={() => setModifyBooking(null)}
          booking={{
            id: modifyBooking.id,
            hotelName: modifyBooking.hotelName,
            roomType: modifyBooking.roomTypeName,
            checkIn: modifyBooking.checkIn,
            checkOut: modifyBooking.checkOut,
            nights: Math.max(1, Math.ceil((new Date(modifyBooking.checkOut).getTime() - new Date(modifyBooking.checkIn).getTime()) / 86400000)),
            totalPrice: modifyBooking.totalPrice,
          }}
          onSave={(updated) => {
            setModifyBooking(null);
            Alert.alert(t('profile.bookingUpdatedTitle'), t('profile.bookingUpdatedMessage'));
          }}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: NAVY, letterSpacing: -0.5, fontFamily: FONTS.sora },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  profileCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 },
  avatarBox: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  userName: { fontSize: 16, fontWeight: '700', color: NAVY, fontFamily: FONTS.inter.semiBold },
  userEmail: { fontSize: 12, color: '#94A3B8', marginTop: 1, fontFamily: FONTS.inter.regular },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, fontFamily: FONTS.inter.bold },
  editBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  loyaltyCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: NAVY, marginBottom: 12, gap: 4 },
  loyaltyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loyaltyLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500', fontFamily: FONTS.inter.regular },
  tierBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontFamily: FONTS.inter.bold },
  pointsValue: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1, fontFamily: FONTS.sora },
  progressBar: { gap: 4, marginTop: 4 },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  progressText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: FONTS.inter.regular },
  section: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY, letterSpacing: -0.2, fontFamily: FONTS.inter.semiBold },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  rowSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: FONTS.inter.regular },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingLabel: { fontSize: 13, color: NAVY, flex: 1, fontFamily: FONTS.inter.regular },
  diningCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: ACCENT + '06', borderWidth: 1, borderColor: ACCENT + '14', marginTop: 8 },
  diningIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  diningRestaurant: { fontSize: 13, fontWeight: '600', color: NAVY, fontFamily: FONTS.inter.semiBold },
  diningMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontFamily: FONTS.inter.regular },
  diningRef: { fontSize: 10, color: ACCENT, fontWeight: '700', marginTop: 2, letterSpacing: 0.5, fontFamily: FONTS.inter.bold },
  diningCancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  diningCancelText: { fontSize: 11, fontWeight: '600', color: '#EF4444', fontFamily: FONTS.inter.semiBold },
});
