import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { useBookings } from '@/lib/context/booking-context';
import { useFavorites } from '@/lib/context/favorites-context';
import type { GuestProfile } from '@/types/api';
import { FONTS } from '@/constants/portal-theme';
import * as ImagePicker from 'expo-image-picker';

const ACCENT = '#2E86AB';
const NAVY = '#1A3C5E';

interface MenuItem {
  icon: IconSymbolName;
  label: string;
  route: string;
  color?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: 'calendar', label: 'My Bookings', route: '/(tabs)/profile/bookings', color: '#2563EB' },
  { icon: 'person.fill', label: 'About Me', route: '/(tabs)/profile/about', color: '#7C3AED' },
  { icon: 'heart', label: 'Favourites', route: '/(tabs)/profile/favorites', color: '#E63946' },
  { icon: 'discount', label: 'My Coupons', route: '/(tabs)/profile/coupons', color: '#F59E0B' },
  { icon: 'star', label: 'My Reviews', route: '/(tabs)/profile/reviews', color: '#10B981' },
  { icon: 'notifications', label: 'Notifications', route: '/(tabs)/profile/notifications', color: '#6366F1' },
];

export default function ProfileScreen() {
  const { user: authUser, logout } = useAuth();
  const user = authUser as GuestProfile | null;
  const { bookings } = useBookings();
  const { favorites } = useFavorites();

  const [photoData, setPhotoData] = useState('');
  const photoKey = user?.id ? `photo_${user.id}` : 'photo_guest';

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
  const displayInitials = (firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const loyaltyPoints = user && 'loyalty_points' in user ? (user as any).loyalty_points || 0 : 0;
  const tier = loyaltyPoints >= 5000 ? 'PLATINUM' : loyaltyPoints >= 2000 ? 'GOLD' : loyaltyPoints >= 500 ? 'SILVER' : 'BRONZE';
  const upcomingCount = bookings.filter(b => b.status === 'upcoming').length;
  const favoritesCount = favorites.size;

  const memberSince = user && 'created_at' in user
    ? new Date((user as any).created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '2024';

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
          <IconSymbol name="person.fill" size={32} color={ACCENT} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: NAVY, marginBottom: 8 }}>Welcome to StayEasy</Text>
        <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          Login to view your bookings, manage favourites, and earn loyalty points.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{ backgroundColor: ACCENT, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%' }}
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
      AsyncStorage.setItem(photoKey, uri);
    }
  };

  const getBadgeCount = (label: string): number | null => {
    if (label === 'My Bookings' && upcomingCount > 0) return upcomingCount;
    if (label === 'Favourites' && favoritesCount > 0) return favoritesCount;
    return null;
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }} contentInsetAdjustmentBehavior="automatic">
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>

      {/* User Card */}
      <View style={s.userCard}>
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
        <View style={s.userInfo}>
          <Text style={s.userName}>{user?.name || 'Guest User'}</Text>
          <Text style={s.userEmail}>{user?.email || ''}</Text>
          <View style={s.tierRow}>
            <View style={[s.tierBadge, { backgroundColor: tierColor + '22' }]}>
              <Text style={[s.tierText, { color: tierColor }]}>{tier}</Text>
            </View>
            <Text style={s.memberSince}>Member since {memberSince}</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statVal}>{loyaltyPoints.toLocaleString()}</Text>
          <Text style={s.statLabel}>Points</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>{upcomingCount}</Text>
          <Text style={s.statLabel}>Bookings</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>{favoritesCount}</Text>
          <Text style={s.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={s.menuSection}>
        {MENU_ITEMS.map((item, i) => {
          const badge = getBadgeCount(item.label);
          return (
            <TouchableOpacity
              key={item.route}
              style={[s.menuItem, i < MENU_ITEMS.length - 1 && s.menuItemBorder]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[s.menuIcon, { backgroundColor: item.color + '12' }]}>
                <IconSymbol name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <View style={s.menuRight}>
                {badge !== null && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{badge}</Text>
                  </View>
                )}
                <IconSymbol name="chevron.right" size={16} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={s.signOutBtn}
        onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
        ])}
        activeOpacity={0.7}
      >
        <IconSymbol name="logout" size={18} color="#EF4444" />
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: NAVY, letterSpacing: -0.5 },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 24, fontWeight: '700', color: ACCENT },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 22, height: 22,
    borderRadius: 11, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 17, fontWeight: '700', color: NAVY },
  userEmail: { fontSize: 13, color: '#94A3B8' },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierText: { fontSize: 10, fontWeight: '700' },
  memberSince: { fontSize: 11, color: '#94A3B8' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: NAVY },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#F1F5F9' },

  menuSection: {
    marginHorizontal: 16, borderRadius: 16,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 16, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F8F9FB' },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: ACCENT + '15', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, minWidth: 24, alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: ACCENT },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});
