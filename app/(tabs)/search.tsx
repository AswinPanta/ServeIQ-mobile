import React, { useState, useRef } from 'react';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';

const QUICK_FILTERS = [
  { label: 'Budget', param: 'budget', icon: 'wallet' as const },
  { label: 'Luxury', param: 'luxury', icon: 'star' as const },
  { label: 'Near Me', param: 'nearby', icon: 'location' as const },
  { label: 'Best Rated', param: 'rated', icon: 'star.border' as const },
];

export default function SearchScreen() {
  const [location, setLocation] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const routeKey = '/(tabs)/search';
  const handleScroll = useScrollRestoration(scrollRef, routeKey);

  const handleSearch = () => {
    router.push({
      pathname: '/guest-search-results',
      params: {
        location: location || '',
        checkIn: selectedCheckIn ? selectedCheckIn.toISOString() : '',
        checkOut: selectedCheckOut ? selectedCheckOut.toISOString() : '',
        guests: (adults + children).toString(),
        filter: activeFilter || '',
      },
    });
  };

  return (
    <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View style={s.headerSection}>
        <Text style={s.title}>Find Hotels</Text>
        <Text style={s.sub}>Search and book your perfect stay</Text>
      </View>

      <View style={s.form}>
        {/* Location */}
        <View style={s.field}>
          <Text style={s.fieldLabel}>Location</Text>
          <View style={s.inputRow}>
            <IconSymbol name="search" size={18} color="#94A3B8" />
            <TextInput
              placeholder="City or hotel name"
              placeholderTextColor="#94A3B8"
              value={location}
              onChangeText={setLocation}
              style={s.input}
            />
          </View>
        </View>

        {/* Date */}
        <View style={s.field}>
          <Text style={s.fieldLabel}>Check-in / Check-out</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={s.inputRow}>
            <IconSymbol name="calendar" size={18} color="#94A3B8" />
            <Text style={[s.dateText, selectedCheckIn && s.dateTextFilled]}>
              {selectedCheckIn && selectedCheckOut
                ? `${selectedCheckIn.toLocaleDateString()} — ${selectedCheckOut.toLocaleDateString()}`
                : 'Select dates'}
            </Text>
            <IconSymbol name="chevron.down" size={16} color="#94A3B8" />
          </TouchableOpacity>
          {selectedCheckIn && selectedCheckOut && (
            <Text style={s.nightsText}>
              {Math.ceil((selectedCheckOut.getTime() - selectedCheckIn.getTime()) / 86400000)} night(s)
            </Text>
          )}
        </View>

        <DatePickerCalendar
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectDates={(inDate, outDate) => {
            setSelectedCheckIn(inDate);
            setSelectedCheckOut(outDate);
          }}
          initialCheckIn={selectedCheckIn || undefined}
          initialCheckOut={selectedCheckOut || undefined}
        />

        {/* Adults, Children & Rooms */}
        <View style={s.counterRow}>
          {[{ label: 'Adults', val: adults, set: setAdults, min: 1, max: 10 },
            { label: 'Children', val: children, set: setChildren, min: 0, max: 6 },
            { label: 'Rooms', val: rooms, set: setRooms, min: 1, max: 5 },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>{item.label}</Text>
              <View style={s.counterBox}>
                <TouchableOpacity onPress={() => item.val > item.min && item.set(item.val - 1)} style={s.counterBtn}>
                  <IconSymbol name="minus" size={14} color="#2E86AB" />
                </TouchableOpacity>
                <Text style={s.counterVal}>{item.val}</Text>
                <TouchableOpacity onPress={() => item.val < item.max && item.set(item.val + 1)} style={s.counterBtn}>
                  <IconSymbol name="add" size={14} color="#2E86AB" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Search CTA */}
        <TouchableOpacity onPress={handleSearch} style={s.searchBtn} activeOpacity={0.9}>
          <IconSymbol name="search" size={18} color="#FFF" />
          <Text style={s.searchBtnText}>Search Hotels</Text>
        </TouchableOpacity>

        {/* Quick Filters */}
        <View>
          <Text style={[s.fieldLabel, { marginBottom: 12 }]}>Quick Filters</Text>
          <View style={s.filterRow}>
            {QUICK_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.param}
                onPress={() => setActiveFilter(activeFilter === f.param ? null : f.param)}
                style={[s.filterChip, activeFilter === f.param && s.filterChipActive]}
              >
                <IconSymbol name={f.icon} size={14} color={activeFilter === f.param ? '#FFF' : '#64748B'} />
                <Text style={[s.filterLabel, activeFilter === f.param && s.filterLabelActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  headerSection: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8, gap: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A3C5E', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#94A3B8' },
  form: { paddingHorizontal: 16, gap: 20, marginTop: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  input: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },
  dateText: { flex: 1, fontSize: 14, color: '#94A3B8' },
  dateTextFilled: { color: '#0F172A', fontWeight: '500' },
  nightsText: { fontSize: 11, color: '#94A3B8', marginTop: 4, marginLeft: 2 },
  counterRow: { flexDirection: 'row', gap: 12 },
  counterBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 },
  counterBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(46, 134, 171, 0.1)', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#0F172A', minWidth: 24, textAlign: 'center' },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: '#1A3C5E', shadowColor: '#1A3C5E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  searchBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#2E86AB', borderColor: '#2E86AB' },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterLabelActive: { color: '#FFF' },
});
