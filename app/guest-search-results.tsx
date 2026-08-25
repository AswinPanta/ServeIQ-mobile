import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, StyleSheet, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Hotel } from '@/types/api';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { searchHotelsApi } from '@/lib/api';
import { safeGoBack } from '@/lib/utils';
import { useFavorites } from '@/lib/context/favorites-context';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { PaginationControls } from '@/components/feature/pagination-controls';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { normalizePropertyType, PROPERTY_TYPE_LABELS } from '@/lib/mock/landing-data';
import { BRAND, SRS, SLATE, STATUS, RED, GRAY, BG, NEUTRAL, TEXT, GREEN } from '@/lib/constants/figma-tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 10;

const PROPERTY_TYPE_FILTERS = ['All types', 'Hotels', 'Apartments', 'Villa', 'Resort', 'Others'];
const AMENITY_FILTERS = ['Pool', 'Free WiFi', 'Breakfast included', 'Free cancellation', 'Beachfront', 'Kitchen', 'Air conditioning', 'Hot tub'];
const BED_TYPE_FILTERS = ['King bed', 'Queen bed', 'Single bed', 'Sofa bed'];
const GUEST_RATINGS = ['Any', '4.0+', '4.5+', '5.0'];

export default function GuestSearchResults() {
  const { location, checkIn, checkOut, guests, adults, children, rooms, filter: quickFilter, type: typeParam, vibe: vibeParam } = useLocalSearchParams();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const typeKey = normalizePropertyType(typeParam ? String(typeParam) : undefined);
  const typeLabel = typeParam ? PROPERTY_TYPE_LABELS[typeKey] || null : null;

  const [allHotels, setAllHotels] = useState<Hotel[]>(MOCK_PROPERTIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fromApi, setFromApi] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState<number | undefined>(undefined);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() =>
    typeLabel ? [typeLabel] : ['All types']
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [guestRating, setGuestRating] = useState('Any');
  const [vibe, setVibe] = useState<string | null>(vibeParam ? String(vibeParam) : null);

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

  const fetchResults = useCallback(async (pageNum: number) => {
    const result = await searchHotelsApi({
      destination: (location as string) || '',
      checkIn: checkIn as string,
      checkOut: checkOut as string,
      adults: adults ? Number(adults) : (guests ? Number(guests) : 1),
      children: children ? Number(children) : 0,
      rooms: rooms ? Number(rooms) : 1,
      limit: PAGE_SIZE,
      skip: pageNum * PAGE_SIZE,
    });
    if (result.hotels.length < PAGE_SIZE) setHasMore(false);
    else setHasMore(true);
    // Only seed the list from MOCK_PROPERTIES on the FIRST page — an empty
    // later page just means "no more results", never a full mock swap-in.
    if (pageNum === 0) {
      setAllHotels(result.hotels.length > 0 ? result.hotels : MOCK_PROPERTIES);
      // Seed the total from the backend meta on the first page
      setTotalResults(result.total ?? (result.hotels.length > 0 ? undefined : 0));
    } else if (result.hotels.length > 0) {
      setAllHotels(result.hotels);
    }
    setFromApi(result.fromApi);
    return result;
  }, [location, checkIn, checkOut, guests, adults, children, rooms]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setPage(0);
      await fetchResults(0);
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchResults]);

  const goToPage = useCallback(async (nextPage: number) => {
    if (nextPage < 0) return;
    setIsLoadingMore(true);
    const result = await fetchResults(nextPage);
    // Never advance to an empty page (page 0 handled by the effect)
    if (nextPage > 0 && result.hotels.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }
    setPage(nextPage);
    setIsLoadingMore(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [fetchResults]);

  const totalPages = totalResults != null ? Math.max(1, Math.ceil(totalResults / PAGE_SIZE)) : undefined;

  const typeActive = selectedTypes.length > 0 && !selectedTypes.includes('All types');

  const filteredHotels = allHotels.filter((hotel) => {
    if (hotel.price < priceRange[0] || hotel.price > priceRange[1]) return false;
    if (guestRating !== 'Any' && hotel.rating < parseFloat(guestRating)) return false;
    if (typeActive) {
      const label = PROPERTY_TYPE_LABELS[normalizePropertyType(hotel.property_type)] || 'Others';
      if (!selectedTypes.includes(label)) return false;
    }
    if (selectedAmenities.length > 0) {
      const hotelAmenityNames = hotel.amenities.map(a => a.name.toLowerCase());
      if (!selectedAmenities.every(a => hotelAmenityNames.some(ha => ha.includes(a.toLowerCase())))) return false;
    }
    // Vibe filtering: match hotel name, description, or city against the vibe keyword
    if (vibe) {
      const vibeLower = vibe.toLowerCase();
      const haystack = `${hotel.name} ${hotel.description || ''} ${hotel.city} ${hotel.property_type || ''}`.toLowerCase();
      if (!haystack.includes(vibeLower)) return false;
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
    router.push({
      pathname: '/guest-hotel-detail/[id]',
      params: {
        id: hotelId,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        guests: guests || '2',
        adults: adults || (guests ? String(guests) : '2'),
        children: children || '0',
      },
    });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={BRAND.navyLight} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{typeLabel || location || 'All stays'}</Text>
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
          <ActivityIndicator size="large" color={SRS.teal} />
          <Text style={s.loadingText}>Searching properties...</Text>
        </View>
      ) : filteredHotels.length === 0 ? (
        <View style={s.emptyState}>
          <IconSymbol name="hotel" size={48} color={SLATE[200]} />
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
              <IconSymbol name="checkin" size={12} color={STATUS.activeGreen} />
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
                    <IconSymbol name="hotel" size={32} color={SLATE[300]} />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => isFavorite(hotel.id) ? removeFavorite(hotel.id) : addFavorite(hotel.id, hotel)}
                  style={s.favBtn}
                >
                  <IconSymbol name={isFavorite(hotel.id) ? 'heart.fill' : 'heart'} size={16} color={isFavorite(hotel.id) ? RED[500] : GRAY[500]} />
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

          {/* Pagination — 10 properties per page */}
          {filteredHotels.length > 0 && totalPages != null && totalPages > 0 && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              canGoNext={hasMore && (totalPages == null || page < totalPages - 1)}
              onPrev={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
              loading={isLoadingMore}
            />
          )}
          {!hasMore && filteredHotels.length > 0 && (
            <View style={{ alignItems: 'center', paddingBottom: 16 }}>
              <Text style={{ fontSize: 12, color: SLATE[400] }}>All properties loaded</Text>
            </View>
          )}
          {totalResults === 0 && (
            <View style={{ alignItems: 'center', paddingBottom: 16 }}>
              <Text style={{ fontSize: 12, color: SLATE[400] }}>No properties found</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Filter Bottom Sheet */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
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
      </Modal>

      {/* Filter FAB */}
      {!showFilters && (
        <TouchableOpacity onPress={() => setShowFilters(true)} style={s.filterFAB}>
          <IconSymbol name="filter" size={18} color={BG.white} />
          <Text style={s.filterFABText}>Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight },
  headerSub: { fontSize: 11, color: SLATE[400], marginTop: 1 },
  sortBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  resultCount: { fontSize: 16, fontWeight: '700', color: BRAND.navyLight },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortLabel: { fontSize: 12, color: SLATE[400] },
  sortValue: { fontSize: 13, fontWeight: '600', color: BRAND.navyLight },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: SLATE[400] },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: SLATE[400] },
  emptyDesc: { fontSize: 14, color: SLATE[300], textAlign: 'center', paddingHorizontal: 40 },
  clearBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: SRS.teal },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: BG.white },
  apiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  apiBadgeText: { fontSize: 11, color: STATUS.activeGreen, fontWeight: '600' },

  hotelCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: BG.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: SLATE[100], shadowColor: TEXT.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  hotelImageWrap: { height: 180, position: 'relative' },
  hotelImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hotelImagePlaceholder: { width: '100%', height: '100%', backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  favBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  hotelInfo: { flexDirection: 'row', padding: 14, gap: 12 },
  hotelName: { fontSize: 15, fontWeight: '700', color: BRAND.navyLight, marginBottom: 4 },
  hotelAddress: { fontSize: 11, color: SLATE[500], marginBottom: 8 },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: SLATE[100] },
  amenityText: { fontSize: 10, color: SLATE[500] },
  moreAmenities: { fontSize: 10, color: SLATE[400], alignSelf: 'center' },
  availableText: { fontSize: 11, fontWeight: '600', color: STATUS.activeGreenDark },
  priceBlock: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 90 },
  priceNights: { fontSize: 10, color: SLATE[400], textAlign: 'right' },
  priceAmount: { fontSize: 18, fontWeight: '700', color: BRAND.navyLight, marginTop: 2 },
  priceNote: { fontSize: 9, color: SLATE[400], textAlign: 'right' },
  seeAvailBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: GREEN.tint },
  seeAvailText: { fontSize: 11, fontWeight: '600', color: STATUS.activeGreenDark },

  filterOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  filterBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  filterSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: BG.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingTop: 20, paddingHorizontal: 20 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  filterTitle: { fontSize: 18, fontWeight: '700', color: BRAND.navyLight },
  clearAll: { fontSize: 13, fontWeight: '600', color: SRS.teal },
  filterSectionTitle: { fontSize: 14, fontWeight: '700', color: BRAND.navyLight, marginTop: 20, marginBottom: 8 },
  filterSectionSub: { fontSize: 12, color: SLATE[500], marginBottom: 8 },
  filterOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: GRAY[300], alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: SRS.teal, borderColor: SRS.teal },
  checkmark: { fontSize: 12, color: BG.white, fontWeight: '700' },
  filterOptionText: { fontSize: 13, color: GRAY[700], flex: 1 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: SLATE[200] },
  ratingBtnActive: { backgroundColor: BRAND.navyLight, borderColor: BRAND.navyLight },
  ratingBtnText: { fontSize: 13, fontWeight: '600', color: GRAY[700] },
  ratingBtnTextActive: { color: BG.white },
  applyBtn: { marginTop: 16, marginBottom: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: BRAND.navyLight, alignItems: 'center' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: BG.white },

  filterFAB: { position: 'absolute', bottom: 24, left: '50%', marginLeft: -60, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: BRAND.navyLight, shadowColor: TEXT.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6, zIndex: 50 },
  filterFABText: { fontSize: 14, fontWeight: '700', color: BG.white },
});
