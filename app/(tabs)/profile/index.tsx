import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput, StyleSheet } from 'react-native';
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
import * as ImagePicker from 'expo-image-picker';

const ACCENT = '#2E86AB';
const NAVY = '#1A3C5E';
const CORAL = '#E63946';

interface DiningReservation {
  id: string;
  restaurantName: string;
  section: string;
  date: string;
  time: string;
  partySize: number;
}

const DINING_KEY = 'stayeasy_dining_reservations';

const NAV_ITEMS: Array<{ icon: IconSymbolName; label: string; route: string; subtitleKey?: string }> = [
  { icon: 'person.fill', label: 'About Me', route: '/(tabs)/profile/about' },
  { icon: 'heart', label: 'Favourite Properties', route: '/(tabs)/profile/favorites' },
  { icon: 'calendar', label: 'My Bookings', route: '/(tabs)/profile/bookings' },
  { icon: 'discount', label: 'My Coupons', route: '/(tabs)/profile/coupons' },
  { icon: 'star', label: 'My Reviews', route: '/(tabs)/profile/reviews' },
  { icon: 'notifications', label: 'Notifications', route: '/(tabs)/profile/notifications' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user: authUser, logout } = useAuth();
  const user = authUser as GuestProfile | null;
  const { bookings } = useBookings();
  const { favorites } = useFavorites();
  const { activeCoupons } = useCoupons();

  const [photoData, setPhotoData] = useState('');
  const photoKey = user?.id ? `photo_${user.id}` : 'photo_guest';

  // Load photo: try backend profile fields first, then local AsyncStorage
  useEffect(() => {
    const bp = user && 'profile_image' in user ? (user as any).profile_image : undefined;
    const bp2 = user && 'profile_photo' in user ? (user as any).profile_photo : undefined;
    const backendPhoto = bp || bp2;
    if (backendPhoto) {
      setPhotoData(backendPhoto);
    } else if (photoKey) {
      AsyncStorage.getItem(photoKey).then(d => { if (d) setPhotoData(d); });
    }
  }, [photoKey, user]);

  const firstName = user?.name?.split(' ')[0] || '';
  const lastName = user?.name?.split(' ').slice(1).join(' ') || '';
  const displayInitials = (firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const loyaltyPoints = user && 'loyalty_points' in user ? (user as any).loyalty_points || 0 : 0;
  const tier = loyaltyPoints >= 5000 ? 'PLATINUM' : loyaltyPoints >= 2000 ? 'GOLD' : loyaltyPoints >= 500 ? 'SILVER' : 'BRONZE';
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
  const favoritesCount = favorites.size;
  const reviewCount = 0;

  const memberSince = user && 'created_at' in user
    ? new Date((user as any).created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '2024';

  const yearsOnPlatform = user && 'created_at' in user
    ? Math.max(1, Math.floor((Date.now() - new Date((user as any).created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : 1;

  const [diningReservations, setDiningReservations] = useState<DiningReservation[]>([]);
  const [modifyBooking, setModifyBooking] = useState<any>(null);
  const [aboutText, setAboutText] = useState('');
  const [editingBio, setEditingBio] = useState(false);

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

  useEffect(() => {
    AsyncStorage.getItem('stayeasy_about_me').then(d => { if (d) setAboutText(d); });
  }, []);

  // Not logged in — show login prompt
  const hasPromptedLogin = useRef(false);
  useEffect(() => {
    if (!user && !hasPromptedLogin.current) {
      hasPromptedLogin.current = true;
      Alert.alert(
        'Login Required',
        'Please login or sign up to view your profile, bookings, and favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login / Sign Up', onPress: () => router.push('/(auth)/login') },
        ]
      );
    }
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FB', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <IconSymbol name="person.fill" size={32} color="#2E86AB" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A3C5E', marginBottom: 8 }}>Welcome to StayEasy</Text>
        <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          Login to view your bookings, manage favorites, and earn loyalty points.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{ backgroundColor: '#2E86AB', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%' }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF', textAlign: 'center' }}>Login / Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tierColor = tier === 'PLATINUM' ? '#E5E4E2' : tier === 'GOLD' ? '#FFD700' : tier === 'SILVER' ? '#C0C0C0' : '#CD7F32';

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoData(uri);
      // Save locally as fallback
      AsyncStorage.setItem(photoKey, uri);
      // Try uploading to backend
      try {
        const { API_BASE_URL } = await import('@/constants/api-config');
        const { useAuth: getAuth } = await import('@/lib/context/auth-context');
        // Upload as multipart form data
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
        await fetch(`${API_BASE_URL}/properties/upload-image/`, {
          method: 'POST',
          body: formData,
        });
      } catch {
        // Backend upload failed — local save is sufficient
      }
    }
  };

  const handleSaveBio = () => {
    AsyncStorage.setItem('stayeasy_about_me', aboutText);
    setEditingBio(false);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 300 }} contentInsetAdjustmentBehavior="automatic">
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
          ])}
          style={s.logoutBtn}
        >
          <IconSymbol name="logout" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={s.profileCard}>
        <View style={s.profileTop}>
          <TouchableOpacity onPress={handlePickPhoto} style={s.avatarWrap}>
            {photoData ? (
              <Image source={{ uri: photoData }} style={s.avatar} resizeMode="cover" />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{displayInitials}</Text>
              </View>
            )}
            <View style={s.cameraBadge}>
              <IconSymbol name="photo" size={10} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={s.profileInfo}>
            <Text style={s.userName}>{user?.name || 'Guest User'}</Text>
            <View style={s.badgeRow}>
              <View style={s.guestBadge}>
                <IconSymbol name="person.fill" size={10} color={ACCENT} />
                <Text style={s.guestBadgeText}>Guest</Text>
              </View>
              <View style={s.verifiedBadge}>
                <IconSymbol name="verified" size={10} color="#10B981" />
                <Text style={s.verifiedText}>Identity Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nationality + Member since */}
        <View style={s.metaRow}>
          <Text style={s.metaText}>
            {user && 'nationality' in user ? (user as any).nationality || 'Nepal' : 'Nepal'}
            {' · '}Member since {memberSince}
          </Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <IconSymbol name="star" size={14} color={NAVY} />
            <Text style={s.statVal}>{reviewCount}</Text>
            <Text style={s.statLabel}>Reviews</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <IconSymbol name="calendar" size={14} color={NAVY} />
            <Text style={s.statVal}>{yearsOnPlatform}</Text>
            <Text style={s.statLabel}>{yearsOnPlatform === 1 ? 'Year' : 'Years'} on StayEasy</Text>
          </View>
        </View>
      </View>

      {/* Loyalty Card */}
      <View style={s.loyaltyCard}>
        <View style={s.loyaltyTop}>
          <Text style={s.loyaltyLabel}>LOYALTY POINTS</Text>
          <View style={[s.tierBadge, { backgroundColor: tierColor + '22' }]}>
            <Text style={[s.tierBadgeText, { color: tierColor }]}>{tier}</Text>
          </View>
        </View>
        <Text style={s.pointsValue}>{loyaltyPoints.toLocaleString()}</Text>
        {loyaltyPoints < 5000 && (
          <View style={s.progressBar}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${Math.min((loyaltyPoints / 5000) * 100, 100)}%` }]} />
            </View>
            <Text style={s.progressText}>
              {loyaltyPoints < 500 ? `${500 - loyaltyPoints} pts to Silver` : loyaltyPoints < 2000 ? `${2000 - loyaltyPoints} pts to Gold` : `${5000 - loyaltyPoints} pts to Platinum`}
            </Text>
          </View>
        )}
      </View>

      {/* My Bookings - Prominent Card */}
      <TouchableOpacity style={s.bookingsCard} onPress={() => router.push('/(tabs)/profile/bookings')} activeOpacity={0.85}>
        <View style={s.bookingsCardLeft}>
          <View style={s.bookingsIconWrap}>
            <IconSymbol name="calendar" size={22} color="#FFF" />
          </View>
          <View>
            <Text style={s.bookingsCardTitle}>My Bookings</Text>
            <Text style={s.bookingsCardDesc}>
              {upcomingBookings.length > 0
                ? `${upcomingBookings.length} upcoming booking${upcomingBookings.length > 1 ? 's' : ''}`
                : 'View and manage your reservations'}
            </Text>
          </View>
        </View>
        <View style={s.bookingsCardRight}>
          {upcomingBookings.length > 0 && (
            <View style={s.bookingsBadge}>
              <Text style={s.bookingsBadgeText}>{upcomingBookings.length}</Text>
            </View>
          )}
          <IconSymbol name="chevron.right" size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>

      {/* About Me */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.sectionTitleRow}>
            <IconSymbol name="person.fill" size={16} color={NAVY} />
            <Text style={s.sectionTitle}>About Me</Text>
          </View>
          {!editingBio && (
            <TouchableOpacity onPress={() => setEditingBio(true)}>
              <Text style={s.editLink}>{aboutText ? 'Edit' : 'Add bio'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {editingBio ? (
          <View>
            <TextInput
              value={aboutText}
              onChangeText={setAboutText}
              placeholder="Tell guests about yourself..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              style={s.bioInput}
            />
            <View style={s.bioActions}>
              <Text style={s.charCount}>{aboutText.length}/500</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => { setEditingBio(false); setAboutText(aboutText); }} style={s.bioCancelBtn}>
                  <Text style={s.bioCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveBio} style={s.bioSaveBtn}>
                  <Text style={s.bioSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text style={aboutText ? s.bioText : s.bioPlaceholder}>
            {aboutText || 'No bio added yet. Share a bit about yourself.'}
          </Text>
        )}
      </View>

      {/* Nav Items */}
      <View style={s.section}>
        {NAV_ITEMS.map((item, i) => {
          let subtitle: string | undefined;
          if (item.route === '/(tabs)/profile/bookings' && upcomingBookings.length > 0) {
            subtitle = `${upcomingBookings.length} upcoming`;
          } else if (item.route === '/(tabs)/profile/favorites' && favoritesCount > 0) {
            subtitle = `${favoritesCount} saved`;
          } else if (item.route === '/(tabs)/profile/coupons' && activeCoupons.length > 0) {
            subtitle = `${activeCoupons.length} active`;
          }
          return (
            <TouchableOpacity key={item.route} style={[s.navRow, i < NAV_ITEMS.length - 1 && s.navRowBorder]} onPress={() => router.push(item.route as any)}>
              <View style={s.navIcon}>
                <IconSymbol name={item.icon} size={18} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.navLabel}>{item.label}</Text>
                {subtitle && <Text style={s.navSubtitle}>{subtitle}</Text>}
              </View>
              <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dining Reservations */}
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
                <Text style={s.diningMeta}>{r.date} · {r.time} · {r.partySize} guests</Text>
              </View>
              <TouchableOpacity onPress={() => {
                Alert.alert('Cancel Reservation', `Cancel table at ${r.restaurantName}?`, [
                  { text: 'Keep', style: 'cancel' },
                  { text: 'Cancel', style: 'destructive', onPress: () => {
                    AsyncStorage.getItem(DINING_KEY).then(raw => {
                      const list: DiningReservation[] = raw ? JSON.parse(raw) : [];
                      AsyncStorage.setItem(DINING_KEY, JSON.stringify(list.filter(x => x.id !== r.id)));
                      setDiningReservations(prev => prev.filter(x => x.id !== r.id));
                    });
                  }},
                ]);
              }} style={s.diningCancelBtn}>
                <Text style={s.diningCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Settings Links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={s.navRow} onPress={() => router.push('/profile-edit')}>
          <View style={s.navIcon}><IconSymbol name="person.fill" size={18} color={NAVY} /></View>
          <Text style={s.navLabel}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.navRow, s.navRowBorder]} onPress={() => router.push('/(tabs)/self-checkin')}>
          <View style={s.navIcon}><IconSymbol name="checkin" size={18} color={ACCENT} /></View>
          <Text style={s.navLabel}>Self Check-in</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.navRow, s.navRowBorder]} onPress={() => router.push('/(tabs)/services')}>
          <View style={s.navIcon}><IconSymbol name="waiter" size={18} color={ACCENT} /></View>
          <Text style={s.navLabel}>Hotel Services</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity style={s.navRow} onPress={() => router.push('/post-stay-review')}>
          <View style={s.navIcon}><IconSymbol name="star" size={18} color="#FFD700" /></View>
          <Text style={s.navLabel}>Write a Review</Text>
          <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <View style={s.section}>
        <TouchableOpacity
          style={s.signOutBtn}
          onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
          ])}
        >
          <IconSymbol name="logout" size={18} color="#EF4444" />
          <Text style={s.signOutText}>Sign Out</Text>
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
          onSave={() => { setModifyBooking(null); Alert.alert('Booking Updated'); }}
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

  profileCard: { marginHorizontal: 16, padding: 20, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12 },
  profileTop: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: ACCENT + '15', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  profileInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  userName: { fontSize: 18, fontWeight: '700', color: NAVY, fontFamily: FONTS.inter.semiBold },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: ACCENT + '12' },
  guestBadgeText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 10, fontWeight: '500', color: '#10B981' },
  metaRow: { marginBottom: 12 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F1F5F9' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statVal: { fontSize: 14, fontWeight: '700', color: NAVY },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  statDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },

  loyaltyCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: NAVY, marginBottom: 12, gap: 4 },
  loyaltyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loyaltyLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.5 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  pointsValue: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1, fontFamily: FONTS.sora },
  progressBar: { gap: 4, marginTop: 4 },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 2 },
  progressText: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  section: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY, letterSpacing: -0.2, fontFamily: FONTS.inter.semiBold },
  editLink: { fontSize: 13, fontWeight: '600', color: ACCENT },
  bioInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 13, color: NAVY, minHeight: 80, textAlignVertical: 'top' },
  bioActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  charCount: { fontSize: 11, color: '#94A3B8' },
  bioCancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  bioCancelText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  bioSaveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: ACCENT },
  bioSaveText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  bioText: { fontSize: 13, color: '#64748B', lineHeight: 20 },
  bioPlaceholder: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  navRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  navIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 13, color: NAVY, flex: 1, fontFamily: FONTS.inter.regular },
  navSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  bookingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: CORAL,
    shadowColor: CORAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  bookingsCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  bookingsIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bookingsCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: FONTS.inter.semiBold },
  bookingsCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bookingsCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookingsBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  bookingsBadgeText: { fontSize: 12, fontWeight: '800', color: CORAL },

  diningCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: ACCENT + '06', borderWidth: 1, borderColor: ACCENT + '14', marginTop: 8 },
  diningIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  diningRestaurant: { fontSize: 13, fontWeight: '600', color: NAVY },
  diningMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  diningCancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  diningCancelText: { fontSize: 11, fontWeight: '600', color: '#EF4444' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
