import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Switch, Image,
} from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/context/auth-context';
import { useHost } from '@/lib/context/host-context';
import { AnimatedPressable } from '@/components/ui/motion';

const ACCENT = '#2E86AB';
const NAVY = '#1A3C5E';
const BG = '#F8F9FB';

export default function HostDrawerShell() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { properties, isDataLoading, fetchHostData, togglePropertyActivation } = useHost();
  const [open, setOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const userName = user && 'firstName' in user
    ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).name || 'Host'
    : 'Host';

  const hasRealProperties = properties.length > 0 && properties[0].id !== 'prop-1';

  useEffect(() => {
    if (!isDataLoading && !hasRealProperties) {
      router.replace('/(host)/listing-wizard');
    }
  }, [hasRealProperties, isDataLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHostData();
    setRefreshing(false);
  };

  const renderDrawerContent = () => (
    <View style={[s.drawer, { paddingTop: insets.top }]}>
      <View style={s.drawerHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{userName[0]}</Text>
        </View>
        <Text style={s.drawerName}>{userName}</Text>
        <Text style={s.drawerRole}>Host</Text>
      </View>

      <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
        onPress={() => { setOpen(false); }}
        style={[s.navItem, s.navItemActive]}
      >
        <View style={[s.navIcon, s.navIconActive]}>
          <Ionicons name="business-outline" size={18} color="#FFF" />
        </View>
        <Text style={[s.navLabel, s.navLabelActive]}>My Properties</Text>
        <View style={s.navActiveDot} />
      </AnimatedPressable>

      <AnimatedPressable portal="host" haptic="light" scaleTo={0.96}
        onPress={() => { setOpen(false); }}
        style={s.navItem}
      >
        <View style={s.navIcon}>
          <Ionicons name="notifications-outline" size={18} color="#8895A7" />
        </View>
        <Text style={s.navLabel}>Notifications</Text>
      </AnimatedPressable>

      <View style={{ flex: 1 }} />

      <AnimatedPressable portal="host" haptic="medium" scaleTo={0.97}
        onPress={() => { router.push('/(host)/listing-wizard'); setOpen(false); }}
        style={s.newListingBtn}
      >
        <Ionicons name="add" size={16} color="#FFF" />
        <Text style={s.newListingText}>New Listing</Text>
      </AnimatedPressable>

      <View style={s.divider} />

      <AnimatedPressable portal="host" haptic="light" scaleTo={0.97}
        onPress={() => { logout(); router.replace('/'); }}
        style={s.logoutBtn}
      >
        <Ionicons name="log-out-outline" size={16} color="#EF4444" />
        <Text style={s.logoutText}>Logout</Text>
      </AnimatedPressable>
    </View>
  );

  if (isDataLoading) {
    return <View style={s.shell}><ActivityIndicator size="large" color={ACCENT} style={{ flex: 1 }} /></View>;
  }

  return (
    <View style={s.shell}>
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.topBarLeft}>
          <TouchableOpacity onPress={() => setOpen(true)} style={s.menuBtn}>
            <Ionicons name="menu" size={20} color={NAVY} />
          </TouchableOpacity>
          <View>
            <Text style={s.brand}>StayEasy</Text>
            <Text style={s.tabLabel}>My Properties</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(host)/listing-wizard')} style={s.newBtn}>
          <Ionicons name="add" size={14} color="#FFF" />
          <Text style={s.newBtnText}>New Listing</Text>
        </TouchableOpacity>
      </View>

      <Drawer
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderDrawerContent={renderDrawerContent}
        drawerType="front"
        drawerStyle={{ width: 280 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        >
          <Text style={s.sectionTitle}>All Properties</Text>
          <Text style={s.sectionSub}>{properties.length} property{properties.length !== 1 ? 'ies' : 'y'}</Text>

          <View style={{ gap: 14, marginTop: 16 }}>
            {properties.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={s.propertyCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(host)/property/${p.id}`)}
                >
                  <View style={s.cardTop}>
                    {p.photos.find(ph => ph.category === 'cover')?.photo_url ? (
                      <Image source={{ uri: p.photos.find(ph => ph.category === 'cover')!.photo_url }} style={s.cardImage} />
                    ) : (
                      <View style={s.cardImagePlaceholder}>
                        <Ionicons name="business-outline" size={32} color={ACCENT} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{p.name}</Text>
                      <Text style={s.cardLocation}>
                        <Ionicons name="location-outline" size={12} color="#94A3B8" /> {p.city}, {p.country}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push(`/(host)/property/edit/${p.id}`)}
                      style={s.editIconBtn}
                    >
                      <Ionicons name="create-outline" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', gap: 2 }}>
                      <Switch
                        value={p.is_active}
                        onValueChange={() => togglePropertyActivation(p.id)}
                        trackColor={{ false: '#FEE2E2', true: '#DCFCE7' }}
                        thumbColor={p.is_active ? '#16A34A' : '#EF4444'}
                      />
                      <Text style={[s.statusText, { color: p.is_active ? '#16A34A' : '#EF4444' }]}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                <View style={s.cardStats}>
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{p.total_rooms}</Text>
                    <Text style={s.statLabel}>Rooms</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{p.type}</Text>
                    <Text style={s.statLabel}>Type</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={s.statValue}>{p.number_of_floors}</Text>
                    <Text style={s.statLabel}>Floors</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Drawer>
    </View>
  );
}

const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: BG },

  topBar: {
    paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 17, fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
  tabLabel: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  drawer: { flex: 1, backgroundColor: NAVY },
  drawerHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  drawerName: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  drawerRole: { fontSize: 12, color: '#8895A7', marginTop: 2 },

  navItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 12, borderRadius: 10 },
  navItemActive: { backgroundColor: 'rgba(46,134,171,0.2)' },
  navIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: ACCENT },
  navLabel: { fontSize: 15, fontWeight: '500', color: '#C8D0DB', flex: 1 },
  navLabelActive: { color: '#FFF', fontWeight: '700' },
  navActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },

  newListingBtn: { marginHorizontal: 12, marginBottom: 4, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newListingText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 20, marginVertical: 8 },
  logoutBtn: { marginHorizontal: 12, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutText: { fontSize: 15, fontWeight: '500', color: '#EF4444' },

  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  sectionSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  propertyCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', gap: 14, padding: 16, alignItems: 'center' },
  cardImage: { width: 56, height: 56, borderRadius: 12 },
  cardImagePlaceholder: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111' },
  cardLocation: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  editIconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardStats: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F1F5F9' },
});
