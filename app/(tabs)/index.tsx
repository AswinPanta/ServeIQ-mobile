import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { ScreenContainer } from '@/components/screen-container';
import { HeroSection } from '@/components/feature/hero-section';
import { SearchModal } from '@/components/feature/search-modal';
import { DestinationCard } from '@/components/feature/destination-card';
import { HotelCard } from '@/components/feature/hotel-card';
import { NearbyHotels } from '@/components/feature/nearby-hotels';
import { CategoryFilter } from '@/components/feature/category-filter';
import { Testimonials } from '@/components/guest/Testimonials';
import { WhyStayEasy } from '@/components/guest/WhyStayEasy';
import { OtherHotels } from '@/components/guest/OtherHotels';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { useAuth } from '@/lib/context/auth-context';
import { useFavorites } from '@/lib/context/favorites-context';
import { useLocation } from '@/hooks/use-location';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { destinations as allDestinations } from '@/lib/mock/destinations';

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { location: userLocation, loading: locationLoading } = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const mockHotels = MOCK_PROPERTIES.map(h => ({
      id: h.id, name: h.name,
      description: h.shortDescription || h.description,
      property_type: 'Hotel' as const, address: h.address,
      city: h.city, country: h.country,
      latitude: h.coordinates?.lat || 0, longitude: h.coordinates?.lng || 0,
      phone: h.phone, email: h.email,
      rating: h.rating, review_count: h.review_count,
      price: h.price, currency: h.currency,
      check_in_time: h.checkInTime, check_out_time: h.checkOutTime,
      cancellation_policy: h.cancellationPolicy,
      photos: h.images.map((img, idx) => ({ url: img, caption: '', id: String(idx), order: idx })),
      amenities: h.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' as const })),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), website: h.website,
    }));
    const timer = setTimeout(() => {
      setDestinations(allDestinations);
      setHotels(mockHotels);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isSignedIn) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <View style={s.signedOutContainer}>
          <View style={s.signedOutIcon}>
            <IconSymbol name="hotel" size={48} color={SRS.teal} />
          </View>
          <Text style={s.signedOutTitle}>Welcome to StayEasy</Text>
          <Text style={s.signedOutDesc}>Sign in to start booking amazing stays</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={s.guestHeader}>
          <View>
            <Text style={s.greeting}>Explore</Text>
            <Text style={s.greetingSub}>Find your perfect stay</Text>
          </View>
          <TouchableOpacity style={s.notifBtn}>
            <IconSymbol name="notifications" size={22} color={SRS.navy} />
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <HeroSection
          title="Find Your Perfect Stay"
          subtitle="Explore amazing hotels and restaurants"
          onSearchPress={() => setShowSearch(true)}
          onExplorePress={() => setShowSearch(true)}
        />

        {/* Category Filter */}
        <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

        {/* Featured Destinations */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Featured Destinations</Text>
            <TouchableOpacity onPress={() => router.push('/destinations')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={s.skeletonBox} />
          ) : (
            <FlatList
              data={destinations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DestinationCard {...item} onPress={() => router.push({ pathname: '/guest-search-results', params: { location: item.name } })} />
              )}
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            />
          )}
        </View>

        {/* Nearby Hotels */}
        {!isLoading && (
          <NearbyHotels
            hotels={MOCK_PROPERTIES.map(h => ({
              id: h.id, name: h.name, city: h.city, price: h.price,
              currency: h.currency, rating: h.rating, review_count: h.review_count,
              image: h.images[0], latitude: h.coordinates?.lat || 0, longitude: h.coordinates?.lng || 0,
            }))}
            userLocation={userLocation} loading={locationLoading}
          />
        )}

        {/* Popular Hotels */}
        <View style={s.sectionContainer}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Popular Hotels</Text>
            <TouchableOpacity onPress={() => setShowSearch(true)}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <SkeletonList count={4} showImage />
          ) : (
            <FlatList
              data={hotels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HotelCard
                  hotel={item} onPress={() => router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: item.id } })}
                  isFavorite={isFavorite(item.id)} onFavoritePress={() => isFavorite(item.id) ? removeFavorite(item.id) : addFavorite(item.id)}
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 16 }}
            />
          )}
        </View>

        {/* Why StayEasy + Testimonials */}
        <WhyStayEasy />
        <Testimonials />
        <OtherHotels title="You May Also Like" />
        <View style={{ height: 32 }} />
      </ScrollView>
      <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  guestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  greeting: { ...TYPOGRAPHY.h2, color: SRS.navy },
  greetingSub: { ...TYPOGRAPHY.small, color: GRAY[500] },
  notifBtn: { width: 40, height: 40, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GRAY[100] },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: SRS.red },
  sectionContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md, gap: SPACING.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...TYPOGRAPHY.h3, color: SRS.navy },
  seeAll: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.teal },
  skeletonBox: { height: 200, borderRadius: RADIUS.card, backgroundColor: GRAY[100] },
  signedOutContainer: { alignItems: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.md },
  signedOutIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: SRS.teal + '12', alignItems: 'center', justifyContent: 'center' },
  signedOutTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, textAlign: 'center' },
  signedOutDesc: { ...TYPOGRAPHY.body, color: GRAY[500], textAlign: 'center' },
});
