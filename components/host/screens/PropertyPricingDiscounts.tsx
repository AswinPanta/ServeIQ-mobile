import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';

const ACCENT = '#2E86AB';

type PricingTab = 'overview' | 'seasonal' | 'discounts' | 'packages';

const TABS: { key: PricingTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'seasonal', label: 'Seasonal', icon: 'calendar-outline' },
  { key: 'discounts', label: 'Discount & Offers', icon: 'pricetags-outline' },
  { key: 'packages', label: 'Packages', icon: 'gift-outline' },
];

interface Props { property: Property }

export function PropertyPricingDiscounts({ property }: Props) {
  const { getFilteredRoomTypes } = useHost();
  const roomTypes = getFilteredRoomTypes(property.id);
  const [tab, setTab] = React.useState<PricingTab>('overview');

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabBar}>
        {(TABS).map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tabChip, tab === t.key && styles.tabChipActive]}>
            <Ionicons name={t.icon} size={13} color={tab === t.key ? '#FFF' : '#64748B'} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && <Overview roomTypes={roomTypes} />}
        {tab === 'seasonal' && <Seasonal />}
        {tab === 'discounts' && <Discounts />}
        {tab === 'packages' && <Packages />}
      </ScrollView>
    </View>
  );
}

function Overview({ roomTypes }: { roomTypes: any[] }) {
  const minRate = roomTypes.length > 0 ? Math.min(...roomTypes.map(rt => rt.base_rate)) : 0;
  const maxRate = roomTypes.length > 0 ? Math.max(...roomTypes.map(rt => rt.base_rate)) : 0;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.kpiValue}>{roomTypes.length}</Text>
          <Text style={styles.kpiLabel}>Room Types</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.kpiValue}>${minRate}–${maxRate}</Text>
          <Text style={styles.kpiLabel}>Price Range</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Current Rates</Text>
      {roomTypes.length === 0 ? (
        <EmptyState icon="pricetags-outline" message="No room types configured" />
      ) : (
        roomTypes.map(rt => (
          <View key={rt.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.typeName}>{rt.room_type_name}</Text>
              <Text style={styles.typePrice}>${rt.base_rate}/night</Text>
            </View>
            <Text style={styles.typeDesc}>{rt.description}</Text>
            <Text style={styles.typeCapacity}>Max {rt.max_occupancy} guests · {rt.bed_configuration}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Seasonal() {
  const seasons = [
    { name: 'Peak Season', period: 'Dec–Feb', multiplier: '1.5x', color: '#EF4444' },
    { name: 'High Season', period: 'Mar–May, Sep–Nov', multiplier: '1.2x', color: '#F59E0B' },
    { name: 'Low Season', period: 'Jun–Aug', multiplier: '0.8x', color: '#10B981' },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Seasonal Pricing</Text>
      {seasons.map(s => (
        <View key={s.name} style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.colorDot, { backgroundColor: s.color }]} />
              <View>
                <Text style={styles.typeName}>{s.name}</Text>
                <Text style={styles.typeDesc}>{s.period}</Text>
              </View>
            </View>
            <Text style={[styles.typePrice, { color: s.color }]}>{s.multiplier}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Discounts() {
  const discounts = [
    { name: 'Early Bird', desc: 'Book 30+ days ahead', discount: '15% off', active: true },
    { name: 'Last Minute', desc: 'Book within 3 days', discount: '10% off', active: true },
    { name: 'Weekly Stay', desc: '7+ nights', discount: '20% off', active: false },
    { name: 'Monthly Stay', desc: '28+ nights', discount: '35% off', active: false },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Discounts & Offers</Text>
      {discounts.map(d => (
        <View key={d.name} style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.typeName}>{d.name}</Text>
                <View style={[styles.activeDot, { backgroundColor: d.active ? '#10B981' : '#CBD5E1' }]} />
              </View>
              <Text style={styles.typeDesc}>{d.desc}</Text>
            </View>
            <Text style={[styles.discountBadge, { backgroundColor: d.active ? '#DCFCE7' : '#F1F5F9' }]}>
              {d.discount}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Packages() {
  const packages = [
    { name: 'Romantic Getaway', desc: 'Dinner + Spa + Late checkout', price: '$299', active: true },
    { name: 'Family Fun', desc: 'Breakfast + Park tickets + Kids eat free', price: '$449', active: true },
    { name: 'Business Traveler', desc: 'Early check-in + WiFi + Meeting room', price: '$199', active: false },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Packages</Text>
      {packages.map(pkg => (
        <View key={pkg.name} style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.typeName}>{pkg.name}</Text>
                <View style={[styles.activeDot, { backgroundColor: pkg.active ? '#10B981' : '#CBD5E1' }]} />
              </View>
              <Text style={styles.typeDesc}>{pkg.desc}</Text>
            </View>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 40 }}>
      <Ionicons name={icon} size={48} color="#CBD5E1" />
      <Text style={{ marginTop: 12, fontSize: 15, color: '#94A3B8' }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexWrap: 'wrap' },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9' },
  tabChipActive: { backgroundColor: ACCENT },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  tabLabelActive: { color: '#FFF' },

  kpiCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderLeftWidth: 3, gap: 4 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#111' },
  kpiLabel: { fontSize: 11, color: '#94A3B8' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 6 },
  typeName: { fontSize: 15, fontWeight: '700', color: '#111' },
  typePrice: { fontSize: 15, fontWeight: '800', color: ACCENT },
  typeDesc: { fontSize: 12, color: '#64748B' },
  typeCapacity: { fontSize: 11, color: '#94A3B8' },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '700', color: '#16A34A', overflow: 'hidden' },
  packagePrice: { fontSize: 17, fontWeight: '800', color: ACCENT },
});
