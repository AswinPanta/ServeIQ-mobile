import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property, AdminDiscountCode, SpecialOffer } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { SRS, GRAY, TYPOGRAPHY, RADIUS } from '@/constants/portal-theme';
import { BG, STATUS, BLUE, RED, AMBER } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

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
            <Ionicons name={t.icon} size={13} color={tab === t.key ? BG.white : GRAY[500]} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && <Overview roomTypes={roomTypes} />}
        {tab === 'seasonal' && <Seasonal />}
        {tab === 'discounts' && <Discounts property={property} />}
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
        <View style={[styles.kpiCard, { borderLeftColor: STATUS.activeGreen }]}>
          <Text style={styles.kpiValue}>{roomTypes.length}</Text>
          <Text style={styles.kpiLabel}>Room Types</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: BLUE[500] }]}>
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
    { name: 'Peak Season', period: 'Dec–Feb', multiplier: '1.5x', color: RED[500] },
    { name: 'High Season', period: 'Mar–May, Sep–Nov', multiplier: '1.2x', color: AMBER[500] },
    { name: 'Low Season', period: 'Jun–Aug', multiplier: '0.8x', color: STATUS.activeGreen },
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

function Discounts({ property }: { property: Property }) {
  const { discountCodes, specialOffers, addDiscountCode, addSpecialOffer, updateDiscountCode, removeDiscountCode, updateSpecialOffer, removeSpecialOffer } = useHost();

  const codes = discountCodes.filter(dc => dc.property_id === property.id);
  const offers = specialOffers.filter(so => so.property_id === property.id);

  const [showAddCode, setShowAddCode] = React.useState(false);
  const [codeForm, setCodeForm] = React.useState({ code: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', discount_value: '', min_amount: '', max_uses: '' });
  const [showAddOffer, setShowAddOffer] = React.useState(false);
  const [offerForm, setOfferForm] = React.useState({ title: '', description: '', discount_percentage: '', start_date: '', end_date: '' });

  const resetCodeForm = () => setCodeForm({ code: '', type: 'PERCENTAGE', discount_value: '', min_amount: '', max_uses: '' });
  const resetOfferForm = () => setOfferForm({ title: '', description: '', discount_percentage: '', start_date: '', end_date: '' });

  const handleAddCode = () => {
    const code = codeForm.code.trim().toUpperCase();
    const value = parseFloat(codeForm.discount_value);
    if (!code || isNaN(value) || value <= 0) { Alert.alert('Error', 'Enter a code and a discount value'); return; }
    if (code.length > 10) { Alert.alert('Invalid Code', 'Discount codes can be at most 10 characters.'); return; }
    const minAmt = codeForm.type === 'FIXED'
      ? (parseFloat(codeForm.min_amount) || value)
      : (parseFloat(codeForm.min_amount) || 0);
    if (codeForm.type === 'FIXED' && parseFloat(codeForm.min_amount) > 0 && minAmt < value) {
      Alert.alert('Minimum Spend Required', `A fixed discount of ${value} needs a minimum spend of at least ${value}.`);
      return;
    }
    const dc: AdminDiscountCode = {
      id: `dc-${Date.now()}`,
      property_id: property.id,
      code,
      type: codeForm.type,
      discount_value: value,
      min_amount: minAmt,
      max_uses: parseInt(codeForm.max_uses, 10) || 100,
      used_count: 0,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      applicable_room_types: [],
      combinable: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addDiscountCode(dc);
    setShowAddCode(false);
    resetCodeForm();
  };

  const handleAddOffer = () => {
    const title = offerForm.title.trim();
    const pct = parseFloat(offerForm.discount_percentage);
    if (!title || isNaN(pct) || pct <= 0 || pct > 100) { Alert.alert('Error', 'Enter a title and a valid discount % (1-100)'); return; }
    const startDate = offerForm.start_date || new Date().toISOString().split('T')[0];
    const endDate = offerForm.end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    // Validate end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert('Error', 'End date must be on or after start date');
      return;
    }
    const so: SpecialOffer = {
      id: `so-${Date.now()}`,
      property_id: property.id,
      title,
      description: offerForm.description.trim() || null,
      discount_percentage: pct,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      is_custom: false,
      conditions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addSpecialOffer(so);
    setShowAddOffer(false);
    resetOfferForm();
  };

  const confirmDeleteCode = (id: string, code: string) => {
    Alert.alert('Delete Discount Code', `Delete "${code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDiscountCode(id) },
    ]);
  };

  const confirmDeleteOffer = (id: string, title: string) => {
    Alert.alert('Delete Special Offer', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSpecialOffer(id) },
    ]);
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Discount Codes</Text>
      {codes.length === 0 && !showAddCode ? (
        <EmptyState icon="pricetags-outline" message="No discount codes yet" />
      ) : (
        codes.map(dc => (
          <View key={dc.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.activeDot, { backgroundColor: dc.is_active ? STATUS.activeGreen : GRAY[300] }]} />
                <Text style={styles.typeName}>{dc.code}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => updateDiscountCode(dc.id, { is_active: !dc.is_active })}
                  style={[styles.iconBtn, { backgroundColor: dc.is_active ? STATUS.badgeGreen : GRAY[100] }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: dc.is_active ? STATUS.activeGreenDark : GRAY[500] }}>
                    {dc.is_active ? 'Active' : 'Off'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDeleteCode(dc.id, dc.code)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={16} color={RED[500]} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
              <View style={[styles.discountBadge, { backgroundColor: dc.type === 'PERCENTAGE' ? BLUE[50] : GRAY[100] }]}>
                <Text style={[styles.discountBadgeText, { color: dc.type === 'PERCENTAGE' ? BLUE[500] : GRAY[500] }]}>{dc.type}</Text>
              </View>
              <Text style={styles.typePrice}>
                {dc.type === 'PERCENTAGE' ? `${dc.discount_value}%` : `${property.currency || '$'}${dc.discount_value}`}
              </Text>
            </View>
            <Text style={styles.typeDesc}>Min spend: {property.currency || '$'}{dc.min_amount} · Used {dc.used_count}/{dc.max_uses}</Text>
            <Text style={styles.typeCapacity}>Valid {dc.valid_from} → {dc.valid_to}</Text>
          </View>
        ))
      )}

      {showAddCode && (
        <View style={[styles.card, { gap: 8 }]}>
          <Text style={styles.sectionTitle}>New Discount Code</Text>
          <TextInput style={styles.input} placeholder="Code (max 10 chars)" placeholderTextColor={GRAY[400]} autoCapitalize="characters" maxLength={10}
            value={codeForm.code} onChangeText={t => setCodeForm(f => ({ ...f, code: t }))} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['PERCENTAGE', 'FIXED'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setCodeForm(f => ({ ...f, type: t }))}
                style={[styles.segBtn, { backgroundColor: codeForm.type === t ? ACCENT : GRAY[100] }]}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: codeForm.type === t ? BG.white : GRAY[600] }}>
                  {t === 'PERCENTAGE' ? '% Off' : 'Flat Amount'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} keyboardType="numeric"
            placeholder={codeForm.type === 'PERCENTAGE' ? 'Discount %' : 'Discount amount'}
            placeholderTextColor={GRAY[400]}
            value={codeForm.discount_value} onChangeText={t => setCodeForm(f => ({ ...f, discount_value: t }))} />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Minimum spend" placeholderTextColor={GRAY[400]}
            value={codeForm.min_amount} onChangeText={t => setCodeForm(f => ({ ...f, min_amount: t }))} />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Max uses" placeholderTextColor={GRAY[400]}
            value={codeForm.max_uses} onChangeText={t => {
              const num = parseInt(t, 10);
              if (t === '' || (num >= 0 && !t.includes('-'))) {
                setCodeForm(f => ({ ...f, max_uses: t }));
              }
            }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GRAY[200] }]} onPress={() => { setShowAddCode(false); resetCodeForm(); }}>
              <Text style={{ color: GRAY[700], fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ACCENT }]} onPress={handleAddCode}>
              <Text style={{ color: BG.white, fontWeight: '600' }}>Add Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ACCENT, marginBottom: 20 }]} onPress={() => setShowAddCode(true)}>
        <Ionicons name="add" size={16} color={BG.white} />
        <Text style={{ color: BG.white, fontWeight: '600' }}>Add Discount Code</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Special Offers</Text>
      {offers.length === 0 && !showAddOffer ? (
        <EmptyState icon="gift-outline" message="No special offers yet" />
      ) : (
        offers.map(so => (
          <View key={so.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.activeDot, { backgroundColor: so.is_active ? STATUS.activeGreen : GRAY[300] }]} />
                <Text style={styles.typeName}>{so.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => updateSpecialOffer(so.id, { is_active: !so.is_active })}
                  style={[styles.iconBtn, { backgroundColor: so.is_active ? STATUS.badgeGreen : GRAY[100] }]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: so.is_active ? STATUS.activeGreenDark : GRAY[500] }}>
                    {so.is_active ? 'Active' : 'Off'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDeleteOffer(so.id, so.title)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={16} color={RED[500]} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.typeDesc}>{so.description}</Text>
            <Text style={styles.discountPercent}>{so.discount_percentage}% off</Text>
            <Text style={styles.typeCapacity}>Valid {so.start_date} → {so.end_date}</Text>
          </View>
        ))
      )}

      {showAddOffer && (
        <View style={[styles.card, { gap: 8 }]}>
          <Text style={styles.sectionTitle}>New Special Offer</Text>
          <TextInput style={styles.input} placeholder="Offer title" placeholderTextColor={GRAY[400]}
            value={offerForm.title} onChangeText={t => setOfferForm(f => ({ ...f, title: t }))} />
          <TextInput style={styles.input} placeholder="Description (optional)" placeholderTextColor={GRAY[400]}
            value={offerForm.description} onChangeText={t => setOfferForm(f => ({ ...f, description: t }))} />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Discount % (1-100)" placeholderTextColor={GRAY[400]}
            value={offerForm.discount_percentage} onChangeText={t => setOfferForm(f => ({ ...f, discount_percentage: t }))} />
          <TextInput style={styles.input} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={GRAY[400]}
            value={offerForm.start_date} onChangeText={t => setOfferForm(f => ({ ...f, start_date: t }))} />
          <TextInput style={styles.input} placeholder="End date (YYYY-MM-DD)" placeholderTextColor={GRAY[400]}
            value={offerForm.end_date} onChangeText={t => setOfferForm(f => ({ ...f, end_date: t }))} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GRAY[200] }]} onPress={() => { setShowAddOffer(false); resetOfferForm(); }}>
              <Text style={{ color: GRAY[700], fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: ACCENT }]} onPress={handleAddOffer}>
              <Text style={{ color: BG.white, fontWeight: '600' }}>Add Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: AMBER[500] }]} onPress={() => setShowAddOffer(true)}>
        <Ionicons name="add" size={16} color={BG.white} />
        <Text style={{ color: BG.white, fontWeight: '600' }}>Add Special Offer</Text>
      </TouchableOpacity>
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
                <View style={[styles.activeDot, { backgroundColor: pkg.active ? STATUS.activeGreen : GRAY[300] }]} />
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
      <Ionicons name={icon} size={48} color={GRAY[300]} />
      <Text style={{ marginTop: 12, fontSize: 15, color: GRAY[400] }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: GRAY[200], flexWrap: 'wrap' },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: GRAY[100] },
  tabChipActive: { backgroundColor: ACCENT },
  tabLabel: { fontSize: 11, fontWeight: '600', color: GRAY[500] },
  tabLabelActive: { color: BG.white },

  kpiCard: { flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, borderLeftWidth: 3, gap: 4 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: GRAY[900] },
  kpiLabel: { fontSize: 11, color: GRAY[400] },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: GRAY[900], marginBottom: 10 },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16, marginBottom: 10, gap: 6 },
  typeName: { fontSize: 15, fontWeight: '700', color: GRAY[900] },
  typePrice: { fontSize: 15, fontWeight: '800', color: ACCENT },
  typeDesc: { ...TYPOGRAPHY.small, color: GRAY[500] },
  typeCapacity: { fontSize: 11, color: GRAY[400] },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, fontSize: 12, fontWeight: '700', color: STATUS.activeGreenDark, overflow: 'hidden' },
  discountBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  discountPercent: { fontSize: 16, fontWeight: '800', color: ACCENT, marginTop: 4 },
  packagePrice: { fontSize: 17, fontWeight: '800', color: ACCENT },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: GRAY[200], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: GRAY[900], backgroundColor: BG.white },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: 10 },
});
