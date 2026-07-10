import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import { useBookings } from '@/lib/context/booking-context';
import { useFavorites } from '@/lib/context/favorites-context';
import { useCoupons } from '@/lib/context/coupon-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import type { GuestProfile } from '@/types/api';

export default function ProfileScreen() {
  const { user: authUser, logout } = useAuth();
  const user = authUser as GuestProfile | null;
  const { bookings, cancelBooking } = useBookings();
  const { favorites } = useFavorites();
  const { activeCoupons, usedCoupons } = useCoupons();

  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoData, setPhotoData] = useState('');

  const photoKey = user?.id ? `photo_${user.id}` : 'photo_guest';
  useEffect(() => { AsyncStorage.getItem(photoKey).then(d => { if (d) setPhotoData(d); }); }, [photoKey]);

  const firstName = user?.name?.split(' ')[0] || '';
  const displayInitials = (firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const loyaltyPoints = user && 'loyalty_points' in user ? (user as any).loyalty_points || 0 : 0;
  const tier = loyaltyPoints >= 5000 ? 'PLATINUM' : loyaltyPoints >= 2000 ? 'GOLD' : loyaltyPoints >= 500 ? 'SILVER' : 'BRONZE';
  const favoriteHotels = MOCK_PROPERTIES.filter(h => favorites.has(h.id));
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
        <TouchableOpacity onPress={async () => {
          Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
          ]);
        }} style={s.logoutBtn}>
          <IconSymbol name="logout" size={18} color={GRAY[500]} />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={s.profileCard}>
        <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
          <View>
            <View style={s.avatarBox}>
              {photoData ? (
                <Image source={{ uri: photoData }} style={s.avatar} resizeMode="cover" />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarInitial}>{displayInitials}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => setShowPhotoMenu(true)} style={s.cameraBtn}>
                <IconSymbol name="camera" size={12} color={SRS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={s.roleTag}>Guest</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{user?.name || 'User'}</Text>
            <View style={{ gap: 2, marginTop: 4 }}>
              <ProfileRow label="Email" value={user?.email || '—'} />
              <ProfileRow label="Phone" value={user?.phone || 'Not provided'} />
              {user?.nationality && <ProfileRow label="Nationality" value={user.nationality} />}
            </View>
          </View>
        </View>
      </View>

      {/* Loyalty */}
      <View style={s.loyaltyCard}>
        <View style={s.loyaltyHeader}>
          <IconSymbol name="star" size={16} color="#FFD700" />
          <Text style={s.loyaltyTitle}>Loyalty Program</Text>
          <View style={s.tierBadge}><Text style={s.tierText}>{tier}</Text></View>
        </View>
        <Text style={s.pointsValue}>{loyaltyPoints.toLocaleString()}</Text>
        <Text style={s.pointsLabel}>Points earned</Text>
        {loyaltyPoints < 5000 && (
          <View style={s.tierProgress}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${Math.min((loyaltyPoints / 5000) * 100, 100)}%` }]} />
            </View>
            <Text style={s.progressLabel}>
              {loyaltyPoints < 500 ? `${500 - loyaltyPoints} pts to SILVER` : loyaltyPoints < 2000 ? `${2000 - loyaltyPoints} pts to GOLD` : `${5000 - loyaltyPoints} pts to PLATINUM`}
            </Text>
          </View>
        )}
        <View style={s.tierRow}>
          {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((t, i) => {
            const pts = [0, 500, 2000, 5000][i];
            const unlocked = loyaltyPoints >= pts;
            return (
              <View key={t} style={{ alignItems: 'center', gap: 2 }}>
                <View style={[s.tierDot, { backgroundColor: unlocked ? ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2'][i] : GRAY[200], opacity: unlocked ? 1 : 0.4 }]}>
                  <IconSymbol name="star" size={10} color={unlocked ? '#FFF' : GRAY[400]} />
                </View>
                <Text style={[s.tierLabel, { color: unlocked ? ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2'][i] : GRAY[400] }]}>{t}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Bookings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          <IconSymbol name="booking" size={14} color={SRS.navy} /> My Bookings
        </Text>
        {upcomingBookings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No active reservations</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={s.browseBtn}>
              <Text style={s.browseBtnText}>Browse stays</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingBookings.slice(0, 2).map(b => (
            <View key={b.id} style={s.bookingCard}>
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <Image source={{ uri: b.hotelImage }} style={s.bookingImg} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={s.bookingHotel}>{b.hotelName}</Text>
                  <Text style={s.bookingMeta}>
                    {new Date(b.checkIn).toLocaleDateString()} — {new Date(b.checkOut).toLocaleDateString()}
                  </Text>
                  <Text style={s.bookingMeta}>{b.roomTypeName}</Text>
                  <Text style={s.bookingPrice}>NPR {b.totalPrice?.toLocaleString()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                <TouchableOpacity onPress={() => cancelBooking(b.id)} style={s.cancelBtn}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Favorites */}
      {favoriteHotels.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            <IconSymbol name="heart.fill" size={14} color={SRS.navy} /> Favorites ({favoriteHotels.length})
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
            {favoriteHotels.slice(0, 4).map(h => (
              <TouchableOpacity key={h.id} onPress={() => router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: h.id } })}
                style={s.favCard}
              >
                <Image source={{ uri: h.images?.[0] }} style={s.favImg} resizeMode="cover" />
                <View style={{ padding: SPACING.sm }}>
                  <Text style={s.favName} numberOfLines={1}>{h.name}</Text>
                  <Text style={s.favMeta}>{h.city}</Text>
                  <Text style={s.favPrice}>NPR {h.price.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Coupons */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          <IconSymbol name="discount" size={14} color={SRS.navy} /> Coupons ({activeCoupons.length})
        </Text>
        {activeCoupons.length === 0 ? (
          <Text style={s.emptyText}>No active coupons</Text>
        ) : (
          activeCoupons.slice(0, 2).map(c => (
            <View key={c.id} style={s.couponCard}>
              <View style={s.couponIcon}>
                <IconSymbol name="discount" size={20} color={SRS.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.couponCode}>{c.code}</Text>
                <Text style={s.couponDesc}>{c.description}</Text>
              </View>
              <Text style={s.couponValue}>{c.discountType === 'percentage' ? `${c.discount}%` : `NPR ${c.discount}`}</Text>
            </View>
          ))
        )}
      </View>

      {/* Settings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          <IconSymbol name="settings" size={14} color={SRS.navy} /> Settings
        </Text>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push('/profile-edit')}>
          <IconSymbol name="person.fill" size={18} color={SRS.navy} />
          <Text style={s.settingLabel}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={16} color={GRAY[400]} />
        </TouchableOpacity>
        <TouchableOpacity style={s.settingRow} onPress={() => router.push('/notifications')}>
          <IconSymbol name="notifications" size={18} color={SRS.navy} />
          <Text style={s.settingLabel}>Notifications</Text>
          <IconSymbol name="chevron.right" size={16} color={GRAY[400]} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.settingRow, { borderBottomWidth: 0 }]} onPress={async () => {
          await logout();
          router.replace('/');
        }}>
          <IconSymbol name="logout" size={18} color={SRS.red} />
          <Text style={[s.settingLabel, { color: SRS.red }]}>Switch Portal / Logout</Text>
          <IconSymbol name="chevron.right" size={16} color={GRAY[400]} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 11, color: GRAY[500] }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: SRS.navy }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md, backgroundColor: '#FFF' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  logoutBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[50], alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100] },
  avatarBox: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: SRS.teal + '18', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 24, fontWeight: '700', color: SRS.teal },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GRAY[200] },
  roleTag: { textAlign: 'center', fontSize: 10, fontWeight: '600', color: GRAY[400], marginTop: 4 },
  userName: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  loyaltyCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: SRS.navy, gap: SPACING.sm },
  loyaltyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  loyaltyTitle: { ...TYPOGRAPHY.body, fontWeight: '600', color: '#FFF', flex: 1 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.badge, backgroundColor: 'rgba(255,215,0,0.2)' },
  tierText: { fontSize: 10, fontWeight: '700', color: '#FFD700' },
  pointsValue: { fontSize: 36, fontWeight: '700', color: '#FFD700', letterSpacing: -1 },
  pointsLabel: { ...TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.6)' },
  tierProgress: { gap: 4 },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  progressLabel: { ...TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.5)' },
  tierRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  tierDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierLabel: { fontSize: 9, fontWeight: '600' },
  section: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.card, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.xs },
  emptyBox: { alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.md },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },
  browseBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: RADIUS.card, backgroundColor: SRS.teal },
  browseBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  bookingCard: { padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[100] },
  bookingImg: { width: 64, height: 64, borderRadius: RADIUS.button },
  bookingHotel: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  bookingMeta: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  bookingPrice: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.button, borderWidth: 1, borderColor: SRS.red },
  cancelBtnText: { fontSize: 11, fontWeight: '600', color: SRS.red },
  favCard: { width: '47%', borderRadius: RADIUS.card, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[100], overflow: 'hidden' },
  favImg: { width: '100%', height: 80 },
  favName: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy },
  favMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  favPrice: { ...TYPOGRAPHY.small, fontWeight: '700', color: SRS.teal },
  couponCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '06', borderWidth: 1, borderColor: SRS.teal + '15' },
  couponIcon: { width: 40, height: 40, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  couponCode: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, letterSpacing: 1 },
  couponDesc: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  couponValue: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  settingLabel: { ...TYPOGRAPHY.body, color: SRS.navy, flex: 1 },
});
