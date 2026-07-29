import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Hotel } from '@/types/api';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { searchHotelsApi } from '@/lib/api';
import { safeGoBack } from '@/lib/utils';
import { useFavorites } from '@/lib/context/favorites-context';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROPERTY_TYPE_FILTERS = ['All types', 'Hotels', 'Apartments', 'Villa', 'Resort', 'Others'];
const AMENITY_FILTERS = ['Pool', 'Free WiFi', 'Breakfast included', 'Free cancellation', 'Beachfront', 'Kitchen', 'Air conditioning', 'Hot tub'];
const BED_TYPE_FILTERS = ['King bed', 'Queen bed', 'Single bed', 'Sofa bed'];
const GUEST_RATINGS = ['Any', '4.0+', '4.5+', '5.0'];

export default function GuestSearchResults() {
  const { location, checkIn, checkOut, guests, adults, children, rooms, filter: quickFilter } = useLocalSearchParams();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [allHotels, setAllHotels] = useState<Hotel[]>(MOCK_PROPERTIES);
  const [isLoading, setIsLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All types']);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [guestRating, setGuestRating] = useState('Any');

  const scrollRef = useRef<ScrollView>(null);
  const routeKey = '/guest-search-results';
  const handleScroll = useScrollRestoration(scrollRef, routeKey);

  useEffect(() => {
    if (!quickFilter) return;
    switch (quickFilter) {
      case 'budget': setPriceRange([0, 150]); setSortBy('Price low to high'); break;
      case 'luxury': setPriceRange([250, 500]); setSortBy('Price high to low'); break;
      case 'rated': setGuestRating('4.5+'); setSortBy('Rating'); break;
      case 'nearby': setSortBy('Recommended'); break;
    }
  }, [quickFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const result = await searchHotelsApi({
        destination: (location as string) || '',
        checkIn: checkIn as string,
        checkOut: checkOut as string,
        adults: adults ? Number(adults) : (guests ? Number(guests) : 1),
        children: children ? Number(children) : 0,
        rooms: rooms ? Number(rooms) : 1,
      });
      if (!cancelled) {
        setAllHotels(result.hotels.length > 0 ? result.hotels : MOCK_PROPERTIES);
        setFromApi(result.fromApi);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [location, checkIn, checkOut, guests, adults, children, rooms]);

  const filteredHotels = allHotels.filter((hotel) => {
    if (hotel.price < priceRange[0] || hotel.price > priceRange[1]) return false;
    if (guestRating !== 'Any' && hotel.rating < parseFloat(guestRating)) return false;
    if (selectedAmenities.length > 0) {
      const hotelAmenityNames = hotel.amenities.map(a => a.name.toLowerCase());
      if (!selectedAmenities.every(a => hotelAmenityNames.some(ha => ha.includes(a.toLowerCase())))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Price low to high') return a.price - b.price;
    if (sortBy === 'Price high to low') return b.price - a.price;
    if (sortBy === 'Rating') return b.rating - a.rating;
    return 0;
  });

  const toggleType = (type: string) => {
    if (type === 'All types') { setSelectedTypes(['All types']); return; }
    setSelectedTypes(prev => {
      const next = prev.filter(t => t !== 'All types');
      return next.includes(type) ? next.filter(t => t !== type) : [...next, type];
    });
  };

  const toggleAmenity = (a: string) => setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const toggleBed = (b: string) => setSelectedBeds(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const clearAll = () => {
    setPriceRange([0, 500]); setSelectedTypes(['All types']); setSelectedAmenities([]);
    setSelectedBeds([]); setGuestRating('Any');
  };

  const handleHotelPress = (hotelId: string) => {
    router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: hotelId, checkIn: checkIn || '', checkOut: checkOut || '', guests: guests || '2' } });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color="#1A3C5E" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{location || 'All stays'}</Text>
          <Text style={s.headerSub}>{guests || '2'} guests · {checkIn || 'Flexible dates'}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Sort bar */}
      <View style={s.sortBar}>
        <Text style={s.resultCount}>
          {isLoading ? 'Searching...' : `${filteredHotels.length} stays${location ? ` in ${location}` : ''}`}
        </Text>
        <View style={s.sortRow}>
          <Text style={s.sortLabel}>Sort by:</Text>
          <TouchableOpacity onPress={() => {
            const opts = ['Recommended', 'Price low to high', 'Price high to low', 'Rating'];
            const idx = opts.indexOf(sortBy);
            setSortBy(opts[(idx + 1) % opts.length]);
          }}>
            <Text style={s.sortValue}>{sortBy} ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={s.loadingText}>Searching properties...</Text>
        </View>
      ) : filteredHotels.length === 0 ? (
        <View style={s.emptyState}>
          <IconSymbol name="hotel" size={48} color="#E2E8F0" />
          <Text style={s.emptyTitle}>No hotels found</Text>
          <Text style={s.emptyDesc}>Try adjusting your filters or search a different destination.</Text>
          <TouchableOpacity onPress={clearAll} style={s.clearBtn}>
            <Text style={s.clearBtnText}>Clear all filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {fromApi && (
            <View style={s.apiBadge}>
              <IconSymbol name="checkin" size={12} color="#10B981" />
              <Text style={s.apiBadgeText}>Live results from property database</Text>
            </View>
          )}

          {filteredHotels.map((hotel) => (
            <TouchableOpacity
              key={hotel.id}
              activeOpacity={0.9}
              onPress={() => handleHotelPress(hotel.id)}
              style={s.hotelCard}
            >
              {/* Image */}
              <View style={s.hotelImageWrap}>
                {hotel.images[0] ? (
                  <Image source={{ uri: hotel.images[0] }} style={s.hotelImage} />
                ) : (
                  <View style={s.hotelImagePlaceholder}>
                    <IconSymbol name="hotel" size={32} color="#CBD5E1" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => isFavorite(hotel.id) ? removeFavorite(hotel.id) : addFavorite(hotel.id)}
                  style={s.favBtn}
                >
                  <IconSymbol name={isFavorite(hotel.id) ? 'heart.fill' : 'heart'} size={16} color={isFavorite(hotel.id) ? '#EF4444' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              {/* Info */}
              <View style={s.hotelInfo}>
                <View style={{ flex: 1 }}>
                  <Text style={s.hotelName} numberOfLines={1}>{hotel.name}</Text>
                  <Text style={s.hotelAddress} numberOfLines={1}>
                    📍 {hotel.address || hotel.city}, {hotel.country}
                  </Text>
                  <View style={s.amenityRow}>
                    {hotel.amenities.slice(0, 4).map((a, i) => (
                      <View key={i} style={s.amenityChip}>
                        <Text style={s.amenityText}>{a.name}</Text>
                      </View>
                    ))}
                    {hotel.amenities.length > 4 && (
                      <Text style={s.moreAmenities}>+{hotel.amenities.length - 4}</Text>
                    )}
                  </View>
                  <Text style={s.availableText}>Available</Text>
                </View>

                {/* Price */}
                <View style={s.priceBlock}>
                  <Text style={s.priceNights}>
                    {(checkIn as string) && (checkOut as string) ? `${Math.max(1, Math.round((new Date(checkOut as string).getTime() - new Date(checkIn as string).getTime()) / 86400000))} nights` : '1 night'}, {guests || '2'} guests
                  </Text>
                  <Text style={s.priceAmount}>${hotel.price}</Text>
                  <Text style={s.priceNote}>Includes taxes and charges</Text>
                  <View style={s.seeAvailBtn}>
                    <Text style={s.seeAvailText}>See availability</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <View style={s.filterOverlay}>
          <TouchableOpacity style={s.filterBackdrop} onPress={() => setShowFilters(false)} />
          <View style={s.filterSheet}>
            <View style={s.filterHeader}>
              <Text style={s.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={clearAll}>
                <Text style={s.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Price Range */}
              <Text style={s.filterSectionTitle}>Price range per night</Text>
              <Text style={s.filterSectionSub}>${priceRange[0]} - ${priceRange[1]}+</Text>

              {/* Property Type */}
              <Text style={s.filterSectionTitle}>Property type</Text>
              {PROPERTY_TYPE_FILTERS.map(type => (
                <TouchableOpacity key={type} onPress={() => toggleType(type)} style={s.filterOption}>
                  <View style={[s.checkbox, selectedTypes.includes(type) && s.checkboxActive]}>
                    {selectedTypes.includes(type) && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <Text style={s.filterOptionText}>{type}</Text>
                </TouchableOpacity>
              ))}

              {/* Amenities */}
              <Text style={s.filterSectionTitle}>Amenities</Text>
              {AMENITY_FILTERS.map(a => (
                <TouchableOpacity key={a} onPress={() => toggleAmenity(a)} style={s.filterOption}>
                  <View style={[s.checkbox, selectedAmenities.includes(a) && s.checkboxActive]}>
                    {selectedAmenities.includes(a) && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <Text style={s.filterOptionText}>{a}</Text>
                </TouchableOpacity>
              ))}

              {/* Bed Types */}
              <Text style={s.filterSectionTitle}>Bed types</Text>
              {BED_TYPE_FILTERS.map(b => (
                <TouchableOpacity key={b} onPress={() => toggleBed(b)} style={s.filterOption}>
                  <View style={[s.checkbox, selectedBeds.includes(b) && s.checkboxActive]}>
                    {selectedBeds.includes(b) && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <Text style={s.filterOptionText}>{b}</Text>
                </TouchableOpacity>
              ))}

              {/* Guest Rating */}
              <Text style={s.filterSectionTitle}>Guest rating</Text>
              <View style={s.ratingRow}>
                {GUEST_RATINGS.map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setGuestRating(r)}
                    style={[s.ratingBtn, guestRating === r && s.ratingBtnActive]}
                  >
                    <Text style={[s.ratingBtnText, guestRating === r && s.ratingBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={s.applyBtn}>
              <Text style={s.applyBtnText}>Show {filteredHotels.length} results</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter FAB */}
      {!showFilters && (
        <TouchableOpacity onPress={() => setShowFilters(true)} style={s.filterFAB}>
          <IconSymbol name="filter" size={18} color="#FFF" />
          <Text style={s.filterFABText}>Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A3C5E' },
  headerSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  sortBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resultCount: { fontSize: 16, fontWeight: '700', color: '#1A3C5E' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortLabel: { fontSize: 12, color: '#94A3B8' },
  sortValue: { fontSize: 13, fontWeight: '600', color: '#1A3C5E' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#94A3B8' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#94A3B8' },
  emptyDesc: { fontSize: 14, color: '#CBD5E1', textAlign: 'center', paddingHorizontal: 40 },
  clearBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2E86AB' },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  apiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  apiBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '600' },

  hotelCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  hotelImageWrap: { height: 180, position: 'relative' },
  hotelImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hotelImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  favBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  hotelInfo: { flexDirection: 'row', padding: 14, gap: 12 },
  hotelName: { fontSize: 15, fontWeight: '700', color: '#1A3C5E', marginBottom: 4 },
  hotelAddress: { fontSize: 11, color: '#64748B', marginBottom: 8 },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F1F5F9' },
  amenityText: { fontSize: 10, color: '#64748B' },
  moreAmenities: { fontSize: 10, color: '#94A3B8', alignSelf: 'center' },
  availableText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  priceBlock: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 90 },
  priceNights: { fontSize: 10, color: '#94A3B8', textAlign: 'right' },
  priceAmount: { fontSize: 18, fontWeight: '700', color: '#1A3C5E', marginTop: 2 },
  priceNote: { fontSize: 9, color: '#94A3B8', textAlign: 'right' },
  seeAvailBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EBF6EF' },
  seeAvailText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },

  filterOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  filterBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  filterSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingTop: 20, paddingHorizontal: 20 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  filterTitle: { fontSize: 18, fontWeight: '700', color: '#1A3C5E' },
  clearAll: { fontSize: 13, fontWeight: '600', color: '#2E86AB' },
  filterSectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginTop: 20, marginBottom: 8 },
  filterSectionSub: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  filterOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#2E86AB', borderColor: '#2E86AB' },
  checkmark: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  filterOptionText: { fontSize: 13, color: '#374151', flex: 1 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0' },
  ratingBtnActive: { backgroundColor: '#1A3C5E', borderColor: '#1A3C5E' },
  ratingBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  ratingBtnTextActive: { color: '#FFF' },
  applyBtn: { marginTop: 16, marginBottom: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1A3C5E', alignItems: 'center' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  filterFAB: { position: 'absolute', bottom: 24, left: '50%', marginLeft: -60, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#1A3C5E', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6, zIndex: 50 },
  filterFABText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
