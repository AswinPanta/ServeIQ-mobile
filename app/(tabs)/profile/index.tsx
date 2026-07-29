import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { useBookings } from '@/lib/context/booking-context';
import { useFavorites } from '@/lib/context/favorites-context';
import { useCoupons } from '@/lib/context/coupon-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { BookingModifyModal } from "@/components/feature/booking-modify-modal";
import type { GuestProfile } from '@/types/api';
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

// NOTE: Same key used in app/(tabs)/dining-reservations.tsx (那里叫 STORAGE_KEY)
const DINING_KEY = 'stayeasy_dining_reservations';

export default function ProfileScreen() {
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
  const favoriteHotels = MOCK_PROPERTIES.filter(h => favorites.has(h.id));
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');

  // RS-003 — pull confirmed dining reservations from AsyncStorage so the
  // guest can see (and act on) them in their profile.
  const [diningReservations, setDiningReservations] = useState<DiningReservation[]>([]);
  const [modifyBooking, setModifyBooking] = useState<any>(null);
  useEffect(() => {
    AsyncStorage.getItem(DINING_KEY)
      .then(raw => {
        if (!raw) return;
        try {
          const list = JSON.parse(raw) as DiningReservation[];
          // Filter out anything in the past so the list is "upcoming-only".
          const today = new Date().toISOString().slice(0, 10);
          setDiningReservations(list.filter(r => r.date >= today));
        } catch { /* ignore parse failures */ }
      })
      .catch(() => {/* persistence read is best-effort */});
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
        <Text style={s.title}>Profile</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
            ]);
          }}
          style={s.logoutBtn}
        >
          <IconSymbol name="logout" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={s.profileCard}>
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
            <Text style={s.userName}>{user?.name || 'User'}</Text>
            <Text style={s.userEmail}>{user?.email || ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={[s.tierDot, { backgroundColor: tierColor }]} />
              <Text style={[s.tierLabel, { color: tierColor }]}>{tier}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile-edit')} style={s.editBtn}>
            <IconSymbol name="edit" size={16} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loyalty */}
      <View style={s.loyaltyCard}>
        <View style={s.loyaltyTop}>
          <Text style={s.loyaltyLabel}>Loyalty Points</Text>
          <Text style={[s.tierBadge, { color: tierColor, backgroundColor: tierColor + '18' }]}>{tier}</Text>
        </View>
        <Text style={s.pointsValue}>{loyaltyPoints.toLocaleString()}</Text>
        {loyaltyPoints < 5000 && (
          <View style={s.progressBar}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${Math.min((loyaltyPoints / 5000) * 100, 100)}%` }]} />
            </View>
            <Text style={s.progressText}>
              {loyaltyPoints < 500 ? `${500 - loyaltyPoints} to SILVER` : loyaltyPoints < 2000 ? `${2000 - loyaltyPoints} to GOLD` : `${5000 - loyaltyPoints} to PLATINUM`}
            </Text>
          </View>
        )}
      </View>

      {/* Bookings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Upcoming Stays</Text>
        {upcomingBookings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No upcoming reservations</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={s.browseBtn}>
              <Text style={s.browseBtnText}>Book a stay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingBookings.slice(0, 2).map(b => (
            <View key={b.id} style={s.bookingCard}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Image source={{ uri: b.hotelImage }} style={s.bookingImg} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={s.bookingHotel}>{b.hotelName}</Text>
                  <Text style={s.bookingMeta}>
                    {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}
                  </Text>
                  <Text style={s.bookingPrice}>NPR {b.totalPrice?.toLocaleString()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setModifyBooking(b)} style={s.modifyBtn}>
                  <Text style={s.modifyBtnText}>Modify</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    'Cancel booking?',
                    `Cancel your stay at ${b.hotelName}? This action cannot be undone.`,
                    [
                      { text: 'Keep Booking', style: 'cancel' },
                      {
                        text: 'Cancel Booking',
                        style: 'destructive',
                        onPress: () => cancelBooking(b.id),
                      },
                    ],
                  );
                }} style={s.cancelBtn}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Favorites preview */}
      {favoriteHotels.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Saved Hotels ({favoriteHotels.length})</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {favoriteHotels.slice(0, 4).map(h => (
              <TouchableOpacity
                key={h.id}
                onPress={() => router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: h.id } })}
                style={s.favCard}
              >
                <Image source={{ uri: h.images?.[0] }} style={s.favImg} resizeMode="cover" />
                <View style={{ padding: 8 }}>
                  <Text style={s.favName} numberOfLines={1}>{h.name}</Text>
                  <Text style={s.favPrice}>NPR {h.price.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* RS-003 — Upcoming dining reservations surfaced from local persistence */}
      {diningReservations.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Upcoming Dining ({diningReservations.length})</Text>
          {diningReservations.slice(0, 3).map(r => (
            <View key={r.id} style={s.diningCard}>
              <View style={s.diningIcon}>
                <IconSymbol name="restaurant" size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.diningRestaurant}>{r.restaurantName} · {r.section}</Text>
                <Text style={s.diningMeta}>
                  {r.date} · {r.time} · {r.partySize} guest{r.partySize === 1 ? '' : 's'}
                </Text>
                <Text style={s.diningRef}>Ref {r.id}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Cancel reservation?',
                    `Cancel your table at ${r.restaurantName} (${r.date} at ${r.time})?`,
                    [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Cancel',
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

      {/* Coupons preview */}
      {activeCoupons.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Active Coupons ({activeCoupons.length})</Text>
          {activeCoupons.slice(0, 2).map(c => (
            <View key={c.id} style={s.couponCard}>
              <View style={s.couponIcon}>
                <IconSymbol name="discount" size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.couponCode}>{c.code}</Text>
                <Text style={s.couponDesc}>{c.description}</Text>
              </View>
              <Text style={s.couponValue}>{c.discountType === 'percentage' ? `${c.discount}%` : `NPR ${c.discount}`}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Settings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Settings</Text>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push('/profile-edit')}>
          <IconSymbol name="person.fill" size={18} color={NAVY} />
          <Text style={s.settingLabel}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/(tabs)/self-checkin")}>
          <IconSymbol name="checkin" size={18} color={ACCENT} />
          <Text style={s.settingLabel}>Self Check-in</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/(tabs)/self-checkout")}>
          <IconSymbol name="checkout" size={18} color={ACCENT} />
          <Text style={s.settingLabel}>Self Check-out</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/(tabs)/services")}>
          <IconSymbol name="waiter" size={18} color={ACCENT} />
          <Text style={s.settingLabel}>Hotel Services</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/post-stay-review")}>
          <IconSymbol name="star" size={18} color="#FFD700" />
          <Text style={s.settingLabel}>Write a Review</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push("/notifications")}>
          <IconSymbol name="notifications" size={18} color={NAVY} />
          <Text style={s.settingLabel}>Notifications</Text>
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
            Alert.alert('Booking Updated', 'Your booking has been updated successfully.');
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
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
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
  emptyBox: { alignItems: 'center', paddingVertical: 16, gap: 12 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontFamily: FONTS.inter.regular },
  browseBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, backgroundColor: ACCENT },
  browseBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF', fontFamily: FONTS.inter.semiBold },
  bookingCard: { padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', gap: 8 },
  bookingImg: { width: 56, height: 56, borderRadius: 8 },
  bookingHotel: { fontSize: 13, fontWeight: '600', color: NAVY, fontFamily: FONTS.inter.semiBold },
  bookingMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: FONTS.inter.regular },
  bookingPrice: { fontSize: 13, fontWeight: '700', color: ACCENT, marginTop: 4, fontFamily: FONTS.inter.bold },
  modifyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: ACCENT + '40', alignSelf: 'flex-start' },
  modifyBtnText: { fontSize: 11, fontWeight: '600', color: ACCENT, fontFamily: FONTS.inter.semiBold },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5', alignSelf: 'flex-start' },
  cancelBtnText: { fontSize: 11, fontWeight: '600', color: '#EF4444', fontFamily: FONTS.inter.semiBold },
  favCard: { width: '47%', borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  favImg: { width: '100%', height: 80 },
  favName: { fontSize: 12, fontWeight: '600', color: NAVY, fontFamily: FONTS.inter.semiBold },
  favPrice: { fontSize: 11, fontWeight: '700', color: ACCENT, marginTop: 2, fontFamily: FONTS.inter.bold },
  couponCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: ACCENT + '06', borderWidth: 1, borderColor: ACCENT + '12' },
  couponIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  couponCode: { fontSize: 13, fontWeight: '700', color: NAVY, letterSpacing: 1, fontFamily: FONTS.inter.bold },
  couponDesc: { fontSize: 11, color: '#94A3B8', fontFamily: FONTS.inter.regular },
  couponValue: { fontSize: 13, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingLabel: { fontSize: 13, color: NAVY, flex: 1, fontFamily: FONTS.inter.regular },
  diningCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: ACCENT + '06', borderWidth: 1, borderColor: ACCENT + '14' },
  diningIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  diningRestaurant: { fontSize: 13, fontWeight: '600', color: NAVY, fontFamily: FONTS.inter.semiBold },
  diningMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontFamily: FONTS.inter.regular },
  diningRef: { fontSize: 10, color: ACCENT, fontWeight: '700', marginTop: 2, letterSpacing: 0.5, fontFamily: FONTS.inter.bold },
  diningCancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  diningCancelText: { fontSize: 11, fontWeight: '600', color: '#EF4444', fontFamily: FONTS.inter.semiBold },
});
