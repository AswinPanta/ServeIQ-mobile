import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { HotelCard } from '@/components/feature/hotel-card';
import { FilterModal } from '@/components/feature/filter-modal';
import { ScarcityBadge } from '@/components/feature/scarcity-badge';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

export default function GuestSearchResults() {
  const { location, checkIn, checkOut, guests } = useLocalSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating'>('rating');
  const [filters, setFilters] = useState({
    priceRange: [0, 50000] as [number, number],
    rating: 0,
    amenities: [] as string[],
    roomTypes: [] as string[],
    bedTypes: [] as string[],
  });

  const filteredHotels = MOCK_PROPERTIES.filter((hotel) => {
    if (hotel.price < filters.priceRange[0] || hotel.price > filters.priceRange[1]) return false;
    if (hotel.rating < filters.rating) return false;
    if (filters.amenities.length > 0) {
      if (!filters.amenities.some(a => hotel.amenities.some(ha => ha.name === a))) return false;
    }
    return true;
  }).sort((a, b) => sortBy === 'price' ? a.price - b.price : b.rating - a.rating);

  const handleHotelPress = (hotelId: string) => {
    router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: hotelId, checkIn: checkIn || '', checkOut: checkOut || '', guests: guests || '1' } });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={SRS.navy} />
        </TouchableOpacity>
        <Text style={s.title}>Search Results</Text>
      </View>

      {/* Search Summary */}
      <View style={s.summary}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <IconSymbol name="location" size={14} color={SRS.teal} />
          <Text style={s.summaryText}>{location} · {guests} guest{guests !== '1' ? 's' : ''}</Text>
        </View>
        {(checkIn || checkOut) && (
          <Text style={s.summaryDates}>{checkIn} to {checkOut}</Text>
        )}
      </View>

      <FlatList
        data={filteredHotels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
            <TouchableOpacity onPress={() => setShowFilters(true)}
              style={[s.filterBtn, { borderColor: GRAY[200] }]}
            >
              <IconSymbol name="filter" size={14} color={SRS.navy} />
              <Text style={s.filterBtnText}>Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSortBy(sortBy === 'price' ? 'rating' : 'price')}
              style={[s.filterBtn, { backgroundColor: SRS.teal + '10', borderColor: SRS.teal }]}
            >
              <IconSymbol name={sortBy === 'price' ? 'payment' : 'star'} size={14} color={SRS.teal} />
              <Text style={[s.filterBtnText, { color: SRS.teal }]}>{sortBy === 'price' ? 'Price' : 'Rating'}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleHotelPress(item.id)} style={{ marginBottom: SPACING.md }}>
            <HotelCard
              hotel={{
                id: item.id, name: item.name, description: item.shortDescription || item.description,
                property_type: 'Hotel' as const, address: item.address, city: item.city, country: item.country,
                latitude: item.coordinates?.lat || 0, longitude: item.coordinates?.lng || 0,
                phone: item.phone, email: item.email, rating: item.rating, review_count: item.review_count,
                price: item.price, currency: item.currency,
                photos: item.images.map((img, idx) => ({ url: img, caption: '', id: String(idx), order: idx })),
                amenities: item.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' as const })),
                check_in_time: item.checkInTime, check_out_time: item.checkOutTime, cancellation_policy: item.cancellationPolicy,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              }}
            />
            <ScarcityBadge count={item.availableRooms} position="relative" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <IconSymbol name="hotel" size={48} color={GRAY[300]} />
            <Text style={s.emptyTitle}>No hotels found</Text>
            <Text style={s.emptyDesc}>Try adjusting your search criteria</Text>
          </View>
        }
      />

      <FilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={setFilters} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: GRAY[50], alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  summary: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: GRAY[100], gap: 2 },
  summaryText: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  summaryDates: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.card, borderWidth: 1.5 },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: SRS.navy },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: SPACING.sm },
  emptyTitle: { ...TYPOGRAPHY.h3, color: GRAY[500] },
  emptyDesc: { ...TYPOGRAPHY.body, color: GRAY[400] },
});
