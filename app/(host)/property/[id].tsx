import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { isApiPropertyId } from '@/lib/context/host-utils';
import { PropertySyncBanner } from '@/components/host/PropertySyncBanner';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

type Section = 'dashboard' | 'bookings' | 'rooms' | 'guests' | 'staff' | 'housekeeping' | 'pricing' | 'reports' | 'settings';

interface SectionDef {
  key: Section;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}

export default function PropertyHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { properties, activePropertyId, setActivePropertyId, getFilteredRooms, getFilteredBookings, getFilteredStaff, getFilteredRoomTypes, discountCodes, specialOffers } = useHost();

  React.useEffect(() => {
    if (id && id !== activePropertyId) setActivePropertyId(id);
  }, [id, activePropertyId, setActivePropertyId]);

  const property = useMemo(() => properties.find(p => p.id === id), [id, properties]);

  const rooms = getFilteredRooms(id || '');
  const bookings = getFilteredBookings(id || '');
  const staffArr = getFilteredStaff(id || '');
  const roomTypes = getFilteredRoomTypes(id || '');

  const dirty = rooms.filter(r => r.status === 'DIRTY' || r.status === 'CLEANING' || r.status === 'MAINTENANCE').length;
  const activeBookings = bookings.filter(b => b.status === 'checked_in').length;

  const SECTIONS: SectionDef[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', subtitle: 'Overview & KPIs' },
    { key: 'bookings', label: 'Bookings', icon: 'receipt-outline', subtitle: `${activeBookings} checked in` },
    { key: 'rooms', label: 'Rooms', icon: 'bed-outline', subtitle: `${rooms.length} total · ${dirty} need attention` },
    { key: 'guests', label: 'Guests', icon: 'people-outline', subtitle: 'Guest profiles & stays' },
    { key: 'staff', label: 'Staff', icon: 'briefcase-outline', subtitle: `${staffArr.length} team members` },
    { key: 'housekeeping', label: 'Housekeeping', icon: 'sparkles-outline', subtitle: `${dirty} rooms to clean` },
    { key: 'pricing', label: 'Pricing', icon: 'pricetags-outline', subtitle: `${roomTypes.length} rates · ${discountCodes.length} codes · ${specialOffers.length} offers` },
    { key: 'reports', label: 'Reports', icon: 'bar-chart-outline', subtitle: 'Revenue & trends' },
    { key: 'settings', label: 'Settings', icon: 'settings-outline', subtitle: 'Configuration & activity' },
  ];

  if (!property) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GRAY[50] }}>
        <Ionicons name="alert-circle-outline" size={48} color={GRAY[400]} />
        <Text style={{ marginTop: 12, ...TYPOGRAPHY.body, color: GRAY[500] }}>Property not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: GRAY[50] }}>
      <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={SRS.navy} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{property.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>{property.city}, {property.country}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(host)/property/edit/${id}`)}>
            <Ionicons name="create-outline" size={18} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      {!isApiPropertyId(property.id) && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <PropertySyncBanner property={property} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Manage Property</Text>
        <View style={styles.grid}>
          {SECTIONS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/(host)/property/${id}/${s.key}` as any)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={s.icon} size={22} color={ACCENT} />
              </View>
              <Text style={styles.cardLabel}>{s.label}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>{s.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200], paddingBottom: 12, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  sub: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 1 },
  editBtn: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16,
    ...SHADOWS.card,
    gap: 6,
  },
  iconWrap: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  cardSub: { ...TYPOGRAPHY.caption, color: GRAY[400], lineHeight: 15 },
});