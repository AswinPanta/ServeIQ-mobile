import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useHost } from '@/lib/context/host-context';
import type { RatePlan } from '@/types/api';

const ACCENT = '#2563EB';

type TabKey = 'rate-plans' | 'pricing-calendar' | 'date-overrides' | 'discount-codes' | 'offers-taxes';

function MinRateFloorCard({
  property, currency, colors, onSave, ratePlans, roomTypeMap,
}: {
  property: { id: string; name: string; min_rate_floor?: number };
  currency: string;
  colors: { surface: string; border: string; foreground: string; muted: string; background: string };
  onSave: (val: number) => void;
  ratePlans: { base_rate_per_room_type: Record<string, number>; rate_type: string; weekday_rate?: Record<string, number>; weekend_rate?: Record<string, number> }[];
  roomTypeMap: Map<string, string>;
}) {
  'use no memo';
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(property.min_rate_floor));

  const allRates: { rtId: string; rate: number; label: string }[] = [];
  for (const rp of ratePlans) {
    for (const [rtId, rate] of Object.entries(rp.base_rate_per_room_type)) {
      allRates.push({ rtId, rate, label: roomTypeMap.get(rtId) || rtId });
    }
    if (rp.rate_type === 'day_of_week') {
      for (const [rtId, rate] of Object.entries(rp.weekday_rate || {})) {
        allRates.push({ rtId, rate, label: `${roomTypeMap.get(rtId) || rtId} (wd)` });
      }
      for (const [rtId, rate] of Object.entries(rp.weekend_rate || {})) {
        allRates.push({ rtId, rate, label: `${roomTypeMap.get(rtId) || rtId} (we)` });
      }
    }
  }

  const floor = property.min_rate_floor ?? 0;
  const violations = allRates.filter(r => r.rate < floor);

  return (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: violations.length > 0 ? '#EF4444' : '#10B981', marginBottom: 16 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-foreground">Rate Floor</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: violations.length > 0 ? '#EF444420' : '#10B98120' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: violations.length > 0 ? '#EF4444' : '#10B981' }}>
              {violations.length > 0 ? `${violations.length} below` : 'OK'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {
          if (editing) {
            const num = parseFloat(value);
            if (!isNaN(num) && num > 0) onSave(num);
            setEditing(false);
          } else {
            setValue(String(floor));
            setEditing(true);
          }
        }}
          style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: editing ? '#10B98120' : '#3B82F615' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: editing ? '#10B981' : '#3B82F6' }}>
            {editing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 16, fontWeight: '700', color: colors.foreground, backgroundColor: colors.background }}
        />
      ) : (
        <Text style={{ fontSize: 24, fontWeight: '800', color: violations.length > 0 ? '#EF4444' : '#10B981', marginTop: 4 }}>
          {currency}{floor}
        </Text>
      )}
      <Text className="text-xs text-muted mt-1">
        Minimum allowed rate per night across all room types
      </Text>
      {violations.length > 0 && (
        <View style={{ marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: '#EF444410' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444', marginBottom: 4 }}>
            Rates below floor:
          </Text>
          {violations.map((v, i) => (
            <Text key={i} style={{ fontSize: 11, color: '#EF4444' }}>
              {v.label}: {currency}{v.rate} (floor: {currency}{floor})
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export function HostPricing() {
  'use no memo';
  const colors = useColors();
  const {
    properties, activePropertyId, ratePlans, dateOverrides, discountCodes,
    specialOffers, taxConfigs, roomTypes,
    addRatePlan, updateRatePlan, removeRatePlan, removeDateOverride,
    addDateOverride,
    addDiscountCode, updateDiscountCode, removeDiscountCode,
    addSpecialOffer, updateSpecialOffer, removeSpecialOffer,
    addTaxConfig, updateTaxConfig, removeTaxConfig,
    updateProperty,
  } = useHost();

  const [activeTab, setActiveTab] = useState<TabKey>('rate-plans');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newCodeType, setNewCodeType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCodeValue, setNewCodeValue] = useState('');
  const [newCodeMin, setNewCodeMin] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editBaseRate, setEditBaseRate] = useState<Record<string, string>>({});
  const [editWeekdayRate, setEditWeekdayRate] = useState<Record<string, string>>({});
  const [editWeekendRate, setEditWeekendRate] = useState<Record<string, string>>({});

  // Create form states
  const [showAddRatePlan, setShowAddRatePlan] = useState(false);
  const [newRatePlanName, setNewRatePlanName] = useState('');
  const [newRatePlanDesc, setNewRatePlanDesc] = useState('');
  const [newRatePlanType, setNewRatePlanType] = useState<'standard' | 'day_of_week'>('standard');
  const [newRatePlanMinStay, setNewRatePlanMinStay] = useState('1');
  const [newRatePlanMaxStay, setNewRatePlanMaxStay] = useState('30');
  const [newRatePlanRates, setNewRatePlanRates] = useState<Record<string, string>>({});
  const [newRatePlanWeekday, setNewRatePlanWeekday] = useState<Record<string, string>>({});
  const [newRatePlanWeekend, setNewRatePlanWeekend] = useState<Record<string, string>>({});

  const [showAddDateOverride, setShowAddDateOverride] = useState(false);
  const [newOverrideRoomTypeId, setNewOverrideRoomTypeId] = useState('');
  const [newOverrideStart, setNewOverrideStart] = useState('');
  const [newOverrideEnd, setNewOverrideEnd] = useState('');
  const [newOverridePrice, setNewOverridePrice] = useState('');
  const [newOverrideReason, setNewOverrideReason] = useState('');

  const [showAddSpecialOffer, setShowAddSpecialOffer] = useState(false);
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferPct, setNewOfferPct] = useState('');
  const [newOfferStart, setNewOfferStart] = useState('');
  const [newOfferEnd, setNewOfferEnd] = useState('');
  const [newOfferAdvanceDays, setNewOfferAdvanceDays] = useState('');
  const [newOfferWithinDays, setNewOfferWithinDays] = useState('');
  const [newOfferMinNights, setNewOfferMinNights] = useState('');

  const [showAddTaxConfig, setShowAddTaxConfig] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxType, setNewTaxType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newTaxInclusive, setNewTaxInclusive] = useState(false);

  const activeProperty = properties.find(p => p.id === activePropertyId);
  const currency = activeProperty?.currency || 'रू';

  const filteredRatePlans = ratePlans.filter(rp => rp.property_id === activePropertyId);
  const filteredDateOverrides = dateOverrides.filter(d => d.property_id === activePropertyId);
  const filteredDiscountCodes = discountCodes.filter(dc => dc.property_id === activePropertyId);
  const filteredSpecialOffers = specialOffers.filter(so => so.property_id === activePropertyId);
  const filteredTaxConfigs = taxConfigs.filter(tx => tx.property_id === activePropertyId);

  const roomTypeMap = new Map(roomTypes.map(rt => [rt.id, rt.room_type_name]));

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'rate-plans', label: 'Rate Plans' },
    { key: 'pricing-calendar', label: 'Calendar' },
    { key: 'date-overrides', label: 'Date Overrides' },
    { key: 'discount-codes', label: 'Discount Codes' },
    { key: 'offers-taxes', label: 'Offers & Taxes' },
  ];

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const toggleRatePlan = (id: string, current: boolean) => {
    updateRatePlan(id, { is_active: !current });
  };

  const toggleDiscountCode = (id: string, current: boolean) => {
    updateDiscountCode(id, { is_active: !current });
  };

  const toggleSpecialOffer = (id: string, current: boolean) => {
    updateSpecialOffer(id, { is_active: !current });
  };

  const toggleTaxConfig = (id: string, current: boolean) => {
    updateTaxConfig(id, { is_active: !current });
  };

  const handleDeleteRatePlan = (id: string, name: string) => {
    Alert.alert('Delete Rate Plan', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeRatePlan(id) },
    ]);
  };

  const handleDeleteDateOverride = (id: string) => {
    Alert.alert('Delete Override', 'Remove this date override?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDateOverride(id) },
    ]);
  };

  const handleDeleteDiscountCode = (id: string, code: string) => {
    Alert.alert('Delete Discount Code', `Delete "${code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDiscountCode(id) },
    ]);
  };

  const handleDeleteSpecialOffer = (id: string, title: string) => {
    Alert.alert('Delete Special Offer', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSpecialOffer(id) },
    ]);
  };

  const handleDeleteTaxConfig = (id: string, name: string) => {
    Alert.alert('Delete Tax', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTaxConfig(id) },
    ]);
  };

  // ─── Create Form Handlers ─────────────────────────────────────────────────

  const handleAddRatePlan = () => {
    if (!newRatePlanName.trim()) { Alert.alert('Error', 'Plan name is required'); return; }
    const ratePerRoom: Record<string, number> = {};
    for (const [rtId, val] of Object.entries(newRatePlanRates)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) ratePerRoom[rtId] = num;
    }
    if (Object.keys(ratePerRoom).length === 0) { Alert.alert('Error', 'Set at least one room type rate'); return; }
    const rp: RatePlan = {
      id: `rp-${Date.now()}`,
      property_id: activePropertyId || '',
      name: newRatePlanName.trim(),
      description: newRatePlanDesc.trim(),
      base_rate_per_room_type: ratePerRoom,
      rate_type: newRatePlanType,
      weekday_rate: newRatePlanType === 'day_of_week' ? (() => {
        const wd: Record<string, number> = {};
        for (const [rtId, val] of Object.entries(newRatePlanWeekday)) {
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0) wd[rtId] = num;
        }
        return Object.keys(wd).length > 0 ? wd : undefined;
      })() : undefined,
      weekend_rate: newRatePlanType === 'day_of_week' ? (() => {
        const we: Record<string, number> = {};
        for (const [rtId, val] of Object.entries(newRatePlanWeekend)) {
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0) we[rtId] = num;
        }
        return Object.keys(we).length > 0 ? we : undefined;
      })() : undefined,
      min_stay: parseInt(newRatePlanMinStay, 10) || 1,
      max_stay: parseInt(newRatePlanMaxStay, 10) || 30,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addRatePlan(rp);
    setNewRatePlanName(''); setNewRatePlanDesc(''); setNewRatePlanRates({});
    setNewRatePlanWeekday({}); setNewRatePlanWeekend({});
    setNewRatePlanMinStay('1'); setNewRatePlanMaxStay('30');
    setShowAddRatePlan(false);
  };

  const handleAddDateOverride = () => {
    if (!newOverrideRoomTypeId || !newOverrideStart || !newOverrideEnd || !newOverridePrice) {
      Alert.alert('Error', 'Room type, date range, and price are required');
      return;
    }
    const price = parseFloat(newOverridePrice);
    if (isNaN(price) || price <= 0) { Alert.alert('Error', 'Enter a valid override price'); return; }
    const firstRp = filteredRatePlans[0];
    addDateOverride({
      // eslint-disable-next-line react-hooks/purity
      id: `do-${Date.now()}`,
      property_id: activePropertyId || '',
      room_type_id: newOverrideRoomTypeId,
      rate_plan_id: firstRp?.id || 'rp-1',
      start_date: newOverrideStart,
      end_date: newOverrideEnd,
      override_price: price,
      reason: newOverrideReason.trim(),
    });
    setNewOverrideRoomTypeId(''); setNewOverrideStart(''); setNewOverrideEnd('');
    setNewOverridePrice(''); setNewOverrideReason('');
    setShowAddDateOverride(false);
  };

  const handleAddSpecialOffer = () => {
    if (!newOfferTitle.trim() || !newOfferPct) { Alert.alert('Error', 'Title and discount % are required'); return; }
    const pct = parseFloat(newOfferPct);
    if (isNaN(pct) || pct <= 0 || pct > 100) { Alert.alert('Error', 'Enter a valid discount percentage (1-100)'); return; }
    const start = newOfferStart || new Date().toISOString().split('T')[0];
    const end = newOfferEnd || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    const conditions: { advance_days?: number; within_days?: number; min_nights?: number } = {};
    if (newOfferAdvanceDays) conditions.advance_days = parseInt(newOfferAdvanceDays, 10);
    if (newOfferWithinDays) conditions.within_days = parseInt(newOfferWithinDays, 10);
    if (newOfferMinNights) conditions.min_nights = parseInt(newOfferMinNights, 10);
    addSpecialOffer({
      id: `so-${Date.now()}`,
      property_id: activePropertyId || '',
      title: newOfferTitle.trim(),
      description: newOfferDesc.trim() || null,
      discount_percentage: pct,
      start_date: start,
      end_date: end,
      is_active: true,
      is_custom: false,
      conditions: Object.keys(conditions).length > 0 ? conditions : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setNewOfferTitle(''); setNewOfferDesc(''); setNewOfferPct('');
    setNewOfferStart(''); setNewOfferEnd('');
    setNewOfferAdvanceDays(''); setNewOfferWithinDays(''); setNewOfferMinNights('');
    setShowAddSpecialOffer(false);
  };

  const handleAddTaxConfig = () => {
    if (!newTaxName.trim() || !newTaxRate) { Alert.alert('Error', 'Name and rate are required'); return; }
    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate <= 0) { Alert.alert('Error', 'Enter a valid tax rate'); return; }
    addTaxConfig({
      id: `tx-${Date.now()}`,
      property_id: activePropertyId || '',
      name: newTaxName.trim(),
      type: newTaxType,
      rate,
      is_inclusive: newTaxInclusive,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setNewTaxName(''); setNewTaxRate(''); setNewTaxType('PERCENTAGE'); setNewTaxInclusive(false);
    setShowAddTaxConfig(false);
  };

  const initNewRatePlanRates = () => {
    const rates: Record<string, string> = {};
    const weekday: Record<string, string> = {};
    const weekend: Record<string, string> = {};
    for (const rt of roomTypes) {
      if (rt.property_id === activePropertyId) {
        rates[rt.id] = String(rt.base_rate || 0);
        weekday[rt.id] = String(rt.base_rate || 0);
        weekend[rt.id] = String(Math.round((rt.base_rate || 0) * 1.2));
      }
    }
    setNewRatePlanRates(rates);
    setNewRatePlanWeekday(weekday);
    setNewRatePlanWeekend(weekend);
  };

  const handleAddDiscountCode = () => {
    if (!newCode.trim() || !newCodeValue.trim()) return;
    const val = parseFloat(newCodeValue);
    if (isNaN(val) || val <= 0) return;
    const minAmt = parseFloat(newCodeMin) || 0;
    const maxUses = parseInt(newCodeMaxUses, 10) || 100;
    const codeObj = {
      id: `dc-${Date.now()}`,
      property_id: activePropertyId || '',
      code: newCode.trim().toUpperCase(),
      type: newCodeType,
      discount_value: val,
      min_amount: minAmt,
      max_uses: maxUses,
      used_count: 0,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      applicable_room_types: [],
      combinable: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addDiscountCode(codeObj);
    setNewCode('');
    setNewCodeValue('');
    setNewCodeMin('');
    setNewCodeMaxUses('');
    setShowAddDiscount(false);
  };

  const toggleRateType = (id: string) => {
    const rp = filteredRatePlans.find(p => p.id === id);
    if (!rp) return;
    const newType = rp.rate_type === 'standard' ? 'day_of_week' : 'standard';
    if (newType === 'day_of_week' && !rp.weekday_rate) {
      const weekday: Record<string, number> = {};
      const weekend: Record<string, number> = {};
      for (const [rtId, rate] of Object.entries(rp.base_rate_per_room_type)) {
        weekday[rtId] = Math.round(rate);
        weekend[rtId] = Math.round(rate * 1.2);
      }
      updateRatePlan(id, { rate_type: newType, weekday_rate: weekday, weekend_rate: weekend });
    } else {
      updateRatePlan(id, { rate_type: newType });
    }
  };

  const startEditingPlan = (rp: typeof filteredRatePlans[0]) => {
    setEditingPlanId(rp.id);
    const base: Record<string, string> = {};
    const weekday: Record<string, string> = {};
    const weekend: Record<string, string> = {};
    for (const [rtId, rate] of Object.entries(rp.base_rate_per_room_type)) {
      base[rtId] = String(rate);
    }
    if (rp.weekday_rate) {
      for (const [rtId, rate] of Object.entries(rp.weekday_rate)) {
        weekday[rtId] = String(rate);
      }
    }
    if (rp.weekend_rate) {
      for (const [rtId, rate] of Object.entries(rp.weekend_rate)) {
        weekend[rtId] = String(rate);
      }
    }
    setEditBaseRate(base);
    setEditWeekdayRate(weekday);
    setEditWeekendRate(weekend);
  };

  const saveEditingPlan = (rp: typeof filteredRatePlans[0]) => {
    const base: Record<string, number> = {};
    for (const [rtId, val] of Object.entries(editBaseRate)) {
      base[rtId] = parseFloat(val) || 0;
    }
    const updates: Partial<typeof rp> = { base_rate_per_room_type: base };
    if (rp.rate_type === 'day_of_week') {
      const weekday: Record<string, number> = {};
      const weekend: Record<string, number> = {};
      for (const [rtId, val] of Object.entries(editWeekdayRate)) {
        weekday[rtId] = parseFloat(val) || 0;
      }
      for (const [rtId, val] of Object.entries(editWeekendRate)) {
        weekend[rtId] = parseFloat(val) || 0;
      }
      updates.weekday_rate = weekday;
      updates.weekend_rate = weekend;
    }
    updateRatePlan(rp.id, updates);
    setEditingPlanId(null);
  };

  const renderCreateRatePlanForm = () => (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
      <Text className="text-sm font-bold text-foreground mb-3">New Rate Plan</Text>
      <TextInput placeholder="Plan name" placeholderTextColor={colors.muted} value={newRatePlanName} onChangeText={setNewRatePlanName}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="Description (optional)" placeholderTextColor={colors.muted} value={newRatePlanDesc} onChangeText={setNewRatePlanDesc}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity onPress={() => setNewRatePlanType('standard')}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: newRatePlanType === 'standard' ? ACCENT : colors.border }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: newRatePlanType === 'standard' ? '#fff' : colors.foreground }}>Standard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNewRatePlanType('day_of_week')}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: newRatePlanType === 'day_of_week' ? '#8B5CF6' : colors.border }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: newRatePlanType === 'day_of_week' ? '#fff' : colors.foreground }}>Day of Week</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row gap-2 mb-3">
        <View style={{ flex: 1 }}>
          <Text className="text-xs text-muted mb-1">Min stay</Text>
          <TextInput value={newRatePlanMinStay} onChangeText={setNewRatePlanMinStay} keyboardType="numeric"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: colors.foreground, backgroundColor: colors.background }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-xs text-muted mb-1">Max stay</Text>
          <TextInput value={newRatePlanMaxStay} onChangeText={setNewRatePlanMaxStay} keyboardType="numeric"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: colors.foreground, backgroundColor: colors.background }} />
        </View>
      </View>
      <Text className="text-xs font-semibold text-foreground mb-2">Rates per night</Text>
      {roomTypes.filter(rt => rt.property_id === activePropertyId).map(rt => (
        <View key={rt.id} className="mb-2">
          <Text className="text-xs text-muted mb-1">{rt.room_type_name}</Text>
          {newRatePlanType === 'day_of_week' ? (
            <View className="flex-row gap-2">
              <TextInput placeholder="Weekday" placeholderTextColor={colors.muted}
                value={newRatePlanWeekday[rt.id] ?? ''} onChangeText={t => setNewRatePlanWeekday(p => ({ ...p, [rt.id]: t }))}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: '#10B981', backgroundColor: colors.background }} />
              <TextInput placeholder="Weekend" placeholderTextColor={colors.muted}
                value={newRatePlanWeekend[rt.id] ?? ''} onChangeText={t => setNewRatePlanWeekend(p => ({ ...p, [rt.id]: t }))}
                keyboardType="numeric"
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: '#EF4444', backgroundColor: colors.background }} />
            </View>
          ) : (
            <TextInput placeholder="Rate" placeholderTextColor={colors.muted}
              value={newRatePlanRates[rt.id] ?? ''} onChangeText={t => setNewRatePlanRates(p => ({ ...p, [rt.id]: t }))}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: colors.foreground, backgroundColor: colors.background }} />
          )}
        </View>
      ))}
      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity onPress={() => { setShowAddRatePlan(false); setNewRatePlanRates({}); }}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddRatePlan}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: ACCENT }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Create Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRatePlans = () => (
    <View>
      {showAddRatePlan && renderCreateRatePlanForm()}
      <TouchableOpacity onPress={() => { setShowAddRatePlan(true); initNewRatePlanRates(); }}
        style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: ACCENT }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Add Rate Plan</Text>
      </TouchableOpacity>
      {filteredRatePlans.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No rate plans for this property</Text>
        </View>
      ) : (
        filteredRatePlans.map(rp => {
          const isEditing = editingPlanId === rp.id;
          const isDow = rp.rate_type === 'day_of_week';
          return (
          <View key={rp.id} style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{rp.name}</Text>
                {rp.description ? (
                  <Text className="text-sm text-muted mt-0.5">{rp.description}</Text>
                ) : null}
                <View className="flex-row items-center mt-1.5 gap-2">
                  <TouchableOpacity onPress={() => toggleRateType(rp.id)}
                    style={{
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                      backgroundColor: isDow ? '#8B5CF620' : '#6B728020',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDow ? '#8B5CF6' : '#6B7280' }}>
                      {isDow ? 'Day-of-Week' : 'Standard'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row items-center">
                {isEditing ? (
                  <>
                    <TouchableOpacity onPress={() => saveEditingPlan(rp)}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, backgroundColor: '#10B98120' }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingPlanId(null)}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, backgroundColor: '#6B728020' }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={() => startEditingPlan(rp)}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6, backgroundColor: '#3B82F615' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDeleteRatePlan(rp.id, rp.name)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EF444420' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row mt-2">
              <Text className="text-xs text-muted">Min stay: {rp.min_stay} night{rp.min_stay !== 1 ? 's' : ''}</Text>
              <Text className="text-xs text-muted ml-4">Max stay: {rp.max_stay} night{rp.max_stay !== 1 ? 's' : ''}</Text>
            </View>
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
              {Object.entries(rp.base_rate_per_room_type).length === 0 ? (
                <Text className="text-xs text-muted">No room type rates configured</Text>
              ) : isDow ? (
                <View>
                  <View className="flex-row pb-1.5 mb-1.5" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text className="flex-[2] text-xs font-semibold text-muted">Room Type</Text>
                    <Text className="flex-1 text-xs font-semibold text-muted text-center">Weekday</Text>
                    <Text className="flex-1 text-xs font-semibold text-muted text-center">Weekend</Text>
                  </View>
                  {Object.entries(rp.base_rate_per_room_type).map(([rtId, rate]) => (
                    <View key={rtId} className="flex-row items-center py-1">
                      <Text className="flex-[2] text-sm text-foreground">{roomTypeMap.get(rtId) || rtId}</Text>
                      {isEditing ? (
                        <>
                          <TextInput
                            value={editWeekdayRate[rtId] ?? String(rate)}
                            onChangeText={t => setEditWeekdayRate(p => ({ ...p, [rtId]: t }))}
                            keyboardType="numeric"
                            style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#10B981', borderWidth: 1, borderColor: colors.border, borderRadius: 6, marginHorizontal: 2, paddingVertical: 2 }}
                          />
                          <TextInput
                            value={editWeekendRate[rtId] ?? String(rp.weekend_rate?.[rtId] ?? Math.round(rate * 1.2))}
                            onChangeText={t => setEditWeekendRate(p => ({ ...p, [rtId]: t }))}
                            keyboardType="numeric"
                            style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#EF4444', borderWidth: 1, borderColor: colors.border, borderRadius: 6, marginHorizontal: 2, paddingVertical: 2 }}
                          />
                        </>
                      ) : (
                        <>
                          <Text style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#10B981' }}>
                            {currency}{rp.weekday_rate?.[rtId] ?? rate}
                          </Text>
                          <Text style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#EF4444' }}>
                            {currency}{rp.weekend_rate?.[rtId] ?? Math.round(rate * 1.2)}
                          </Text>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              ) : isEditing ? (
                Object.entries(rp.base_rate_per_room_type).map(([rtId, rate]) => (
                  <View key={rtId} className="flex-row justify-between items-center py-1">
                    <Text className="text-sm text-foreground">{roomTypeMap.get(rtId) || rtId}</Text>
                    <TextInput
                      value={editBaseRate[rtId] ?? String(rate)}
                      onChangeText={t => setEditBaseRate(p => ({ ...p, [rtId]: t }))}
                      keyboardType="numeric"
                      style={{ fontSize: 13, fontWeight: '600', color: ACCENT, textAlign: 'right', borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, minWidth: 80 }}
                    />
                  </View>
                ))
              ) : (
                Object.entries(rp.base_rate_per_room_type).map(([rtId, rate]) => (
                  <View key={rtId} className="flex-row justify-between items-center py-1">
                    <Text className="text-sm text-foreground">{roomTypeMap.get(rtId) || rtId}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT }}>
                      {currency}{rate}
                    </Text>
                  </View>
                ))
              )}
            </View>
            <TouchableOpacity onPress={() => toggleRatePlan(rp.id, rp.is_active)}
              style={{
                marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12,
                backgroundColor: rp.is_active ? '#10B98120' : '#EF444420', alignSelf: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: rp.is_active ? '#10B981' : '#EF4444' }}>
                {rp.is_active ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          </View>
          );
        })
      )}
    </View>
  );

  const renderOverrideUserTypeOptions = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
      {roomTypes.filter(rt => rt.property_id === activePropertyId).map(rt => (
        <TouchableOpacity key={rt.id} onPress={() => setNewOverrideRoomTypeId(rt.id)}
          style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 6, backgroundColor: newOverrideRoomTypeId === rt.id ? '#8B5CF6' : colors.border }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: newOverrideRoomTypeId === rt.id ? '#fff' : colors.foreground }}>{rt.room_type_name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCreateDateOverrideForm = () => (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
      <Text className="text-sm font-bold text-foreground mb-3">New Date Override</Text>
      <Text className="text-xs text-muted mb-2">Room Type</Text>
      {renderOverrideUserTypeOptions()}
      <TextInput placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={newOverrideStart} onChangeText={setNewOverrideStart}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="End date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={newOverrideEnd} onChangeText={setNewOverrideEnd}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder={`Override price (${currency})`} placeholderTextColor={colors.muted} value={newOverridePrice} onChangeText={setNewOverridePrice} keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="Reason (optional)" placeholderTextColor={colors.muted} value={newOverrideReason} onChangeText={setNewOverrideReason}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 12 }} />
      <View className="flex-row gap-2">
        <TouchableOpacity onPress={() => setShowAddDateOverride(false)}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddDateOverride}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#F59E0B' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Add Override</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDateOverrides = () => (
    <View>
      {showAddDateOverride && renderCreateDateOverrideForm()}
      <TouchableOpacity onPress={() => setShowAddDateOverride(true)}
        style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#F59E0B' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Add Date Override</Text>
      </TouchableOpacity>
      {filteredDateOverrides.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No date overrides</Text>
        </View>
      ) : (
        filteredDateOverrides.map(d => (
          <View key={d.id} style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {formatDate(d.start_date)} - {formatDate(d.end_date)}
                </Text>
                <Text className="text-sm text-muted mt-0.5">
                  {roomTypeMap.get(d.room_type_id) || d.room_type_id}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteDateOverride(d.id)}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EF444420' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm text-foreground">Override Price</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: ACCENT }}>{currency}{d.override_price}</Text>
            </View>
            {d.reason ? (
              <View style={{ marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
                <Text className="text-xs text-muted">{d.reason}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  );

  const renderDiscountCodes = () => (
    <View>
      {filteredDiscountCodes.length === 0 && !showAddDiscount ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No discount codes</Text>
        </View>
      ) : (
        filteredDiscountCodes.map(dc => (
          <View key={dc.id} style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View style={{
                  width: 10, height: 10, borderRadius: 5, marginRight: 8,
                  backgroundColor: dc.is_active ? '#10B981' : '#EF4444',
                }} />
                <Text className="text-base font-bold text-foreground tracking-wider">{dc.code}</Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => toggleDiscountCode(dc.id, dc.is_active)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6,
                    backgroundColor: dc.is_active ? '#10B98120' : '#6B728020',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: dc.is_active ? '#10B981' : '#6B7280' }}>
                    {dc.is_active ? 'Active' : 'Off'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteDiscountCode(dc.id, dc.code)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EF444420' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row items-center mt-2">
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                backgroundColor: dc.type === 'PERCENTAGE' ? '#3B82F620' : '#8B5CF620',
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
                  color: dc.type === 'PERCENTAGE' ? '#3B82F6' : '#8B5CF6',
                }}>
                  {dc.type}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT, marginLeft: 10 }}>
                {dc.type === 'PERCENTAGE' ? `${dc.discount_value}%` : `${currency}${dc.discount_value}`}
              </Text>
            </View>
            <View className="flex-row flex-wrap mt-2">
              <Text className="text-xs text-muted">Min: {currency}{dc.min_amount}</Text>
              <Text className="text-xs text-muted ml-4">Used: {dc.used_count}/{dc.max_uses}</Text>
            </View>
            <Text className="text-xs text-muted mt-1.5">
              Valid: {formatDate(dc.valid_from)} - {formatDate(dc.valid_to)}
            </Text>
          </View>
        ))
      )}
      {showAddDiscount && (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
          <Text className="text-sm font-bold text-foreground mb-3">New Discount Code</Text>
          <TextInput
            placeholder="Code (e.g. SUMMER20)"
            placeholderTextColor={colors.muted}
            value={newCode}
            onChangeText={setNewCode}
            autoCapitalize="characters"
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12,
              fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8,
            }}
          />
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity onPress={() => setNewCodeType('PERCENTAGE')}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                backgroundColor: newCodeType === 'PERCENTAGE' ? ACCENT : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: newCodeType === 'PERCENTAGE' ? '#fff' : colors.foreground }}>
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNewCodeType('FIXED')}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                backgroundColor: newCodeType === 'FIXED' ? ACCENT : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: newCodeType === 'FIXED' ? '#fff' : colors.foreground }}>
                Fixed
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder={newCodeType === 'PERCENTAGE' ? 'Discount %' : `Discount amount (${currency})`}
            placeholderTextColor={colors.muted}
            value={newCodeValue}
            onChangeText={setNewCodeValue}
            keyboardType="numeric"
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12,
              fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8,
            }}
          />
          <TextInput
            placeholder={`Min amount (${currency})`}
            placeholderTextColor={colors.muted}
            value={newCodeMin}
            onChangeText={setNewCodeMin}
            keyboardType="numeric"
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12,
              fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8,
            }}
          />
          <TextInput
            placeholder="Max uses"
            placeholderTextColor={colors.muted}
            value={newCodeMaxUses}
            onChangeText={setNewCodeMaxUses}
            keyboardType="numeric"
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12,
              fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 12,
            }}
          />
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setShowAddDiscount(false)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                backgroundColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddDiscountCode}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                backgroundColor: ACCENT,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Add Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <TouchableOpacity onPress={() => setShowAddDiscount(true)}
        style={{
          paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 8,
          backgroundColor: ACCENT,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Add Discount Code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateSpecialOfferForm = () => (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
      <Text className="text-sm font-bold text-foreground mb-3">New Special Offer</Text>
      <TextInput placeholder="Offer title" placeholderTextColor={colors.muted} value={newOfferTitle} onChangeText={setNewOfferTitle}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="Description (optional)" placeholderTextColor={colors.muted} value={newOfferDesc} onChangeText={setNewOfferDesc}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="Discount % (e.g. 20)" placeholderTextColor={colors.muted} value={newOfferPct} onChangeText={setNewOfferPct} keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={newOfferStart} onChangeText={setNewOfferStart}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TextInput placeholder="End date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={newOfferEnd} onChangeText={setNewOfferEnd}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <Text className="text-xs font-semibold text-foreground mb-2">Conditions (optional)</Text>
      <View className="flex-row gap-2 mb-2">
        <View style={{ flex: 1 }}>
          <Text className="text-xs text-muted mb-1">Book X+ days ahead</Text>
          <TextInput value={newOfferAdvanceDays} onChangeText={setNewOfferAdvanceDays} keyboardType="numeric" placeholder="e.g. 30" placeholderTextColor={colors.muted}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: colors.foreground, backgroundColor: colors.background }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-xs text-muted mb-1">Within X days</Text>
          <TextInput value={newOfferWithinDays} onChangeText={setNewOfferWithinDays} keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor={colors.muted}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: colors.foreground, backgroundColor: colors.background }} />
        </View>
      </View>
      <View className="mb-3">
        <Text className="text-xs text-muted mb-1">Min nights</Text>
        <TextInput value={newOfferMinNights} onChangeText={setNewOfferMinNights} keyboardType="numeric" placeholder="e.g. 7" placeholderTextColor={colors.muted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 8, fontSize: 13, color: colors.foreground, backgroundColor: colors.background }} />
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity onPress={() => setShowAddSpecialOffer(false)}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddSpecialOffer}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#F59E0B' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Create Offer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateTaxConfigForm = () => (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
      <Text className="text-sm font-bold text-foreground mb-3">New Tax Configuration</Text>
      <TextInput placeholder="Tax name (e.g. VAT)" placeholderTextColor={colors.muted} value={newTaxName} onChangeText={setNewTaxName}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity onPress={() => setNewTaxType('PERCENTAGE')}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: newTaxType === 'PERCENTAGE' ? '#3B82F6' : colors.border }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: newTaxType === 'PERCENTAGE' ? '#fff' : colors.foreground }}>Percentage</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNewTaxType('FLAT')}
          style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: newTaxType === 'FLAT' ? '#8B5CF6' : colors.border }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: newTaxType === 'FLAT' ? '#fff' : colors.foreground }}>Flat Amount</Text>
        </TouchableOpacity>
      </View>
      <TextInput placeholder={newTaxType === 'PERCENTAGE' ? 'Rate %' : `Amount (${currency})`} placeholderTextColor={colors.muted}
        value={newTaxRate} onChangeText={setNewTaxRate} keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 8 }} />
      <TouchableOpacity onPress={() => setNewTaxInclusive(!newTaxInclusive)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: newTaxInclusive ? '#10B981' : colors.border, backgroundColor: newTaxInclusive ? '#10B981' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {newTaxInclusive && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
        </View>
        <Text style={{ fontSize: 13, color: colors.foreground }}>Inclusive tax (included in listed price)</Text>
      </TouchableOpacity>
      <View className="flex-row gap-2">
        <TouchableOpacity onPress={() => setShowAddTaxConfig(false)}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: colors.border }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddTaxConfig}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#0D9488' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Add Tax</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOffersAndTaxes = () => (
    <View>
      <Text className="text-base font-bold text-foreground mb-3">Special Offers</Text>
      {showAddSpecialOffer && renderCreateSpecialOfferForm()}
      <TouchableOpacity onPress={() => setShowAddSpecialOffer(true)}
        style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#F59E0B' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Add Special Offer</Text>
      </TouchableOpacity>
      {filteredSpecialOffers.length === 0 ? (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 16, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No special offers</Text>
        </View>
      ) : (
        filteredSpecialOffers.map(so => (
          <View key={so.id} style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{so.title}</Text>
                {so.description ? (
                  <Text className="text-sm text-muted mt-0.5">{so.description}</Text>
                ) : null}
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => toggleSpecialOffer(so.id, so.is_active)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6,
                    backgroundColor: so.is_active ? '#10B98120' : '#6B728020',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: so.is_active ? '#10B981' : '#6B7280' }}>
                    {so.is_active ? 'Active' : 'Off'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSpecialOffer(so.id, so.title)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EF444420' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row items-center mt-2">
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F59E0B20' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>
                  {so.discount_percentage}% OFF
                </Text>
              </View>
              <Text className="text-xs text-muted ml-3">
                {formatDate(so.start_date)} - {formatDate(so.end_date)}
              </Text>
            </View>
            {so.conditions && (
              <View className="flex-row flex-wrap mt-2">
                {so.conditions.advance_days != null && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#3B82F615', marginRight: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '500', color: '#3B82F6' }}>
                      Book {so.conditions.advance_days}+ days ahead
                    </Text>
                  </View>
                )}
                {so.conditions.within_days != null && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#8B5CF615', marginRight: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '500', color: '#8B5CF6' }}>
                      Within {so.conditions.within_days} days
                    </Text>
                  </View>
                )}
                {so.conditions.min_nights != null && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#10B98115', marginRight: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '500', color: '#10B981' }}>
                      Min {so.conditions.min_nights} night{so.conditions.min_nights !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))
      )}

      <Text className="text-base font-bold text-foreground mb-3 mt-4">Taxes</Text>
      {showAddTaxConfig && renderCreateTaxConfigForm()}
      <TouchableOpacity onPress={() => setShowAddTaxConfig(true)}
        style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#0D9488' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>+ Add Tax Config</Text>
      </TouchableOpacity>
      {filteredTaxConfigs.length === 0 ? (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
          <Text className="text-sm text-muted">No taxes configured</Text>
        </View>
      ) : (
        filteredTaxConfigs.map(tx => (
          <View key={tx.id} style={{ padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{tx.name}</Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => toggleTaxConfig(tx.id, tx.is_active)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6,
                    backgroundColor: tx.is_active ? '#10B98120' : '#6B728020',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: tx.is_active ? '#10B981' : '#6B7280' }}>
                    {tx.is_active ? 'Active' : 'Off'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTaxConfig(tx.id, tx.name)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EF444420' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row items-center mt-2">
              <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT }}>
                {tx.type === 'PERCENTAGE' ? `${tx.rate}%` : `${currency}${tx.rate}`}
              </Text>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 10,
                backgroundColor: tx.type === 'PERCENTAGE' ? '#3B82F620' : '#8B5CF620',
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
                  color: tx.type === 'PERCENTAGE' ? '#3B82F6' : '#8B5CF6',
                }}>
                  {tx.type}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6,
                backgroundColor: tx.is_inclusive ? '#10B98115' : '#F59E0B15',
              }}>
                <Text style={{
                  fontSize: 10, fontWeight: '600',
                  color: tx.is_inclusive ? '#10B981' : '#F59E0B',
                }}>
                  {tx.is_inclusive ? 'Included' : 'Excluded'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderPricingCalendar = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getRateForDate = (day: number) => {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const override = filteredDateOverrides.find(d => dateStr >= d.start_date && dateStr <= d.end_date);
      if (override) return { rate: override.override_price, isOverride: true };
      const firstRp = filteredRatePlans[0];
      if (firstRp) {
        const firstRtId = Object.keys(firstRp.base_rate_per_room_type)[0];
        if (!firstRtId) return { rate: 0, isOverride: false };
        if (firstRp.rate_type === 'day_of_week') {
          const date = new Date(calendarYear, calendarMonth, day);
          const dow = date.getDay();
          const isWeekend = dow === 0 || dow === 5 || dow === 6;
          if (isWeekend && firstRp.weekend_rate?.[firstRtId]) {
            return { rate: firstRp.weekend_rate[firstRtId], isOverride: false };
          }
          if (firstRp.weekday_rate?.[firstRtId]) {
            return { rate: firstRp.weekday_rate[firstRtId], isOverride: false };
          }
        }
        return { rate: firstRp.base_rate_per_room_type[firstRtId] || 0, isOverride: false };
      }
      return { rate: 0, isOverride: false };
    };

    const prevMonth = () => {
      if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
      else setCalendarMonth(calendarMonth - 1);
    };
    const nextMonth = () => {
      if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
      else setCalendarMonth(calendarMonth + 1);
    };

    const weeks: number[][] = [];
    let week: number[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) week.push(0);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) weeks.push(week);

    const today = new Date();
    const isCurrentMonth = today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;

    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 12, borderRadius: 8, backgroundColor: colors.border }}>
            <Text style={{ fontSize: 16, color: colors.foreground }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
            {monthNames[calendarMonth]} {calendarYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 12, borderRadius: 8, backgroundColor: colors.border }}>
            <Text style={{ fontSize: 16, color: colors.foreground }}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {days.map(d => (
            <View key={d} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted }}>{d}</Text>
            </View>
          ))}
        </View>

        {weeks.map((w, wi) => (
          <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
            {w.map((day, di) => {
              if (day === 0) return <View key={`e-${di}`} style={{ flex: 1 }} />;
              const { rate, isOverride } = getRateForDate(day);
              const isToday = isCurrentMonth && today.getDate() === day;
              return (
                <TouchableOpacity key={day}
                  style={{
                    flex: 1, alignItems: 'center', paddingVertical: 8, marginHorizontal: 4, borderRadius: 8,
                    backgroundColor: isOverride ? '#F59E0B40' : isToday ? ACCENT + '30' : 'transparent',
                    borderWidth: isToday ? 1 : 0, borderColor: ACCENT,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: isToday ? '700' : '500', color: colors.foreground }}>{day}</Text>
                  <Text style={{ fontSize: 10, color: isOverride ? '#F59E0B' : colors.muted, marginTop: 4 }}>
                    {currency}{rate > 0 ? rate >= 1000 ? `${(rate / 1000).toFixed(0)}k` : rate : '-'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View className="flex-row gap-4 mt-4">
          <View className="flex-row items-center gap-1.5">
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: ACCENT + '30', borderWidth: 1, borderColor: ACCENT }} />
            <Text className="text-xs text-muted">Today</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#F59E0B40', borderWidth: 1, borderColor: '#F59E0B' }} />
            <Text className="text-xs text-muted">Override</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      >
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 8,
              backgroundColor: activeTab === tab.key ? ACCENT : colors.border,
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: activeTab === tab.key ? '#fff' : colors.foreground,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {activeProperty && (
          <MinRateFloorCard
            property={activeProperty}
            currency={currency}
            colors={colors}
            onSave={(val) => updateProperty(activeProperty.id, { min_rate_floor: val })}
            ratePlans={filteredRatePlans}
            roomTypeMap={roomTypeMap}
          />
        )}
        {activeTab === 'rate-plans' && renderRatePlans()}
        {activeTab === 'pricing-calendar' && renderPricingCalendar()}
        {activeTab === 'date-overrides' && renderDateOverrides()}
        {activeTab === 'discount-codes' && renderDiscountCodes()}
        {activeTab === 'offers-taxes' && renderOffersAndTaxes()}
      </ScrollView>
    </View>
  );
}
