import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { PropertyDashboard } from '@/components/host/screens/PropertyDashboard';
import { PropertyBookings } from '@/components/host/screens/PropertyBookings';
import { PropertyRooms } from '@/components/host/screens/PropertyRooms';
import { PropertyGuests } from '@/components/host/screens/PropertyGuests';
import { PropertyStaff } from '@/components/host/screens/PropertyStaff';
import { PropertyHousekeeping } from '@/components/host/screens/PropertyHousekeeping';
import { PropertyPricingDiscounts } from '@/components/host/screens/PropertyPricingDiscounts';
import { PropertyReports } from '@/components/host/screens/PropertyReports';
import { PropertySettings } from '@/components/host/screens/PropertySettings';

const ACCENT = '#2E86AB';
const NAVY = '#1A3C5E';

type Section = 'dashboard' | 'bookings' | 'rooms' | 'guests' | 'staff' | 'housekeeping' | 'pricing' | 'reports' | 'settings';

const SECTIONS: { key: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'bookings', label: 'Bookings', icon: 'receipt-outline' },
  { key: 'rooms', label: 'Rooms', icon: 'bed-outline' },
  { key: 'guests', label: 'Guests', icon: 'people-outline' },
  { key: 'staff', label: 'Staff', icon: 'briefcase-outline' },
  { key: 'housekeeping', label: 'Housekeeping', icon: 'sparkles-outline' },
  { key: 'pricing', label: 'Pricing', icon: 'pricetags-outline' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { properties, activePropertyId, setActivePropertyId, refreshRooms } = useHost();
  const [activeSection, setActiveSection] = React.useState<Section>('dashboard');

  React.useEffect(() => {
    if (id && id !== activePropertyId) setActivePropertyId(id);
    refreshRooms(id);
  }, [id]);

  const property = useMemo(() => properties.find(p => p.id === id), [id, properties]);

  if (!property) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#64748B' }}>Property not found</Text>
      </View>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <PropertyDashboard property={property} />;
      case 'bookings': return <PropertyBookings property={property} />;
      case 'rooms': return <PropertyRooms property={property} />;
      case 'guests': return <PropertyGuests property={property} />;
      case 'staff': return <PropertyStaff property={property} />;
      case 'housekeeping': return <PropertyHousekeeping property={property} />;
      case 'pricing': return <PropertyPricingDiscounts property={property} />;
      case 'reports': return <PropertyReports property={property} />;
      case 'settings': return <PropertySettings property={property} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FB' }}>
      <View style={[headerStyles.bar, { paddingTop: insets.top + 12 }]}>
        <View style={headerStyles.row}>
          <TouchableOpacity onPress={() => router.back()} style={headerStyles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={NAVY} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={headerStyles.title} numberOfLines={1}>{property.name}</Text>
            <Text style={headerStyles.sub}>{property.city}, {property.country}</Text>
          </View>
          <TouchableOpacity style={headerStyles.editBtn} onPress={() => router.push(`/(host)/property/edit/${id}`)}>
            <Ionicons name="create-outline" size={18} color={ACCENT} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={navStyles.bar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
          {SECTIONS.map(s => (
            <TouchableOpacity
              key={s.key}
              onPress={() => setActiveSection(s.key)}
              style={[navStyles.chip, activeSection === s.key && navStyles.chipActive]}
            >
              <Ionicons name={s.icon} size={14} color={activeSection === s.key ? '#FFF' : '#64748B'} />
              <Text style={[navStyles.label, activeSection === s.key && navStyles.labelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderSection()}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  bar: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#111' },
  sub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  editBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EBF5FB', alignItems: 'center', justifyContent: 'center' },
});

const navStyles = StyleSheet.create({
  bar: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9' },
  chipActive: { backgroundColor: ACCENT },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  labelActive: { color: '#FFF' },
});
