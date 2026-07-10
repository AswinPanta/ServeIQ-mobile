import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const QUICK_FILTERS = [
  { label: 'Budget', param: 'budget', icon: 'wallet' as const },
  { label: 'Luxury', param: 'luxury', icon: 'star' as const },
  { label: 'Near Me', param: 'nearby', icon: 'location' as const },
  { label: 'Best Rated', param: 'rated', icon: 'star.border' as const },
];

export default function SearchScreen() {
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleSearch = () => {
    router.push({
      pathname: '/guest-search-results',
      params: {
        location: location || '', checkIn: checkInDate ? checkInDate.toISOString() : '',
        checkOut: checkOutDate ? checkOutDate.toISOString() : '',
        guests: guests.toString(), filter: activeFilter || '',
      },
    });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={s.body}>
        {/* Header */}
        <View style={s.headerSection}>
          <Text style={s.title}>Find Hotels</Text>
          <Text style={s.sub}>Search and book your perfect stay</Text>
        </View>

        {/* Search Form */}
        <View style={{ gap: SPACING.lg }}>
          {/* Location */}
          <View>
            <Text style={s.fieldLabel}>Location</Text>
            <View style={s.inputRow}>
              <IconSymbol name="search" size={18} color={GRAY[400]} style={{ marginRight: SPACING.sm }} />
              <TextInput placeholder="Enter city or hotel name" placeholderTextColor={GRAY[400]}
                value={location} onChangeText={setLocation} style={s.input}
              />
            </View>
          </View>

          {/* Date */}
          <View>
            <Text style={s.fieldLabel}>Check-in / Check-out</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[s.inputRow, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <IconSymbol name="calendar" size={18} color={GRAY[400]} style={{ marginRight: SPACING.sm }} />
                <Text style={[s.dateText, { color: checkInDate ? SRS.navy : GRAY[400] }]}>
                  {checkInDate && checkOutDate
                    ? `${checkInDate.toLocaleDateString()} — ${checkOutDate.toLocaleDateString()}`
                    : 'Select dates'}
                </Text>
              </View>
              <IconSymbol name="chevron.down" size={16} color={GRAY[400]} />
            </TouchableOpacity>
          </View>

          {/* Guests & Rooms */}
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            {[{ label: 'Guests', val: guests, set: setGuests, min: 1, max: 10 },
              { label: 'Rooms', val: rooms, set: setRooms, min: 1, max: 5 },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>{item.label}</Text>
                <View style={[s.inputRow, { justifyContent: 'space-between', paddingVertical: 4 }]}>
                  <TouchableOpacity onPress={() => item.val > item.min && item.set(item.val - 1)} style={s.counterBtn}>
                    <IconSymbol name="minus" size={14} color={SRS.teal} />
                  </TouchableOpacity>
                  <Text style={s.counterVal}>{item.val}</Text>
                  <TouchableOpacity onPress={() => item.val < item.max && item.set(item.val + 1)} style={s.counterBtn}>
                    <IconSymbol name="add" size={14} color={SRS.teal} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Search CTA */}
          <TouchableOpacity onPress={handleSearch} style={s.searchBtn} activeOpacity={0.85}>
            <IconSymbol name="search" size={18} color="#FFF" />
            <Text style={s.searchBtnText}>Search Hotels</Text>
          </TouchableOpacity>

          {/* Quick Filters */}
          <View>
            <Text style={[s.fieldLabel, { marginBottom: SPACING.md }]}>Quick Filters</Text>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
              {QUICK_FILTERS.map((f) => (
                <TouchableOpacity key={f.param} onPress={() => setActiveFilter(activeFilter === f.param ? null : f.param)}
                  style={[s.filterChip, { backgroundColor: activeFilter === f.param ? SRS.teal + '12' : GRAY[100], borderColor: activeFilter === f.param ? SRS.teal : GRAY[200] }]}
                >
                  <IconSymbol name={f.icon} size={14} color={activeFilter === f.param ? SRS.teal : GRAY[500]} />
                  <Text style={[s.filterLabel, { color: activeFilter === f.param ? SRS.teal : GRAY[600] }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <TouchableOpacity style={s.dateOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={s.dateModal}>
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              {['Check-in', 'Check-out'].map((label, i) => (
                <TouchableOpacity key={label} style={s.dateOption}
                  onPress={() => {
                    const today = new Date();
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                    const out = new Date(today); out.setDate(out.getDate() + (i === 0 ? 1 : 3));
                    setCheckInDate(i === 0 ? today : checkInDate || today);
                    setCheckOutDate(i === 0 ? tomorrow : out);
                  }}
                >
                  <Text style={s.dateOptionLabel}>{label}</Text>
                  <Text style={s.dateOptionVal}>
                    {i === 0
                      ? (checkInDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : (checkOutDate || new Date(Date.now() + 2 * 86400000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={s.dateApplyBtn}>
              <Text style={s.dateApplyText}>Apply Dates</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, gap: SPACING.xl },
  headerSection: { gap: SPACING.xs },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy },
  sub: { ...TYPOGRAPHY.body, color: GRAY[500] },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: SPACING.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, color: SRS.navy },
  dateText: { flex: 1, fontSize: 14 },
  counterBtn: { width: 32, height: 32, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: SRS.navy, minWidth: 24, textAlign: 'center' },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.card, backgroundColor: SRS.navy, ...SHADOWS.card },
  searchBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  filterLabel: { fontSize: 12, fontWeight: '600' },
  dateOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dateModal: { backgroundColor: '#FFF', borderTopLeftRadius: RADIUS.modal, borderTopRightRadius: RADIUS.modal, padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 40 },
  dateOption: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], alignItems: 'center', gap: 4 },
  dateOptionLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy },
  dateOptionVal: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.teal },
  dateApplyBtn: { paddingVertical: 14, borderRadius: RADIUS.card, backgroundColor: SRS.navy, alignItems: 'center' },
  dateApplyText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
