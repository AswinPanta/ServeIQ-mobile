import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { HeroSection } from '@/components/feature/hero-section';
import { SearchModal } from '@/components/feature/search-modal';
import { PropertyTypeBrowser } from '@/components/guest/PropertyTypeBrowser';
import { NewsletterCTA } from '@/components/guest/NewsletterCTA';
import { Testimonials } from '@/components/guest/Testimonials';
import { TrustBadges } from '@/components/guest/TrustBadges';
import { GuestFooter } from '@/components/guest/GuestFooter';
import { useAuth } from '@/lib/context/auth-context';
import { useNotifications } from '@/lib/context/notification-context';
import { searchHotelsApi } from '@/lib/api';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import type { Hotel } from '@/types/api';
import { POPULAR_DESTINATIONS } from '@/lib/mock/landing-data';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { useTranslation } from 'react-i18next';
import { useNearbyProperties } from '@/hooks/use-nearby-properties';
import { mark, markEnd, markStart } from '@/lib/utils/perf';
import { BRAND, BG, SRS, AMBER, SLATE, RED, TEXT, CORAL } from '@/lib/constants/figma-tokens';


function formatDistance(km?: number): string {
  if (km == null || isNaN(km)) return '';
  if (km < 1) return '<1 km';
  return `${Math.round(km * 10) / 10} km`.replace('.0 km', ' km');
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { unreadCount } = useNotifications();
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const routeKey = '/(tabs)/home';
  const handleScroll = useScrollRestoration(scrollRef, routeKey);
  const { nearbyHotels, loading: nearbyLoading, locationGranted, requestLocation } = useNearbyProperties();

  const [kathmanduHotels, setKathmanduHotels] = useState<Hotel[]>(() =>
    MOCK_PROPERTIES.filter(h => h.city === 'Kathmandu')
  );
  const [pokharaHotels, setPokharaHotels] = useState<Hotel[]>(() =>
    MOCK_PROPERTIES.filter(h => h.city === 'Pokhara')
  );

  useEffect(() => { mark('home first render'); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    let cancelled = false;
    const [ktm, pkr] = await Promise.all([
      searchHotelsApi({ destination: 'Kathmandu' }),
      searchHotelsApi({ destination: 'Pokhara' }),
    ]);
    if (!cancelled) {
      if (ktm.hotels.length > 0) setKathmanduHotels(ktm.hotels);
      if (pkr.hotels.length > 0) setPokharaHotels(pkr.hotels);
      setRefreshing(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    markStart('home city fetches');
    (async () => {
      const [ktm, pkr] = await Promise.all([
        searchHotelsApi({ destination: 'Kathmandu' }),
        searchHotelsApi({ destination: 'Pokhara' }),
      ]);
      markEnd('home city fetches');
      if (cancelled) return;
      if (ktm.hotels.length > 0) setKathmanduHotels(ktm.hotels);
      if (pkr.hotels.length > 0) setPokharaHotels(pkr.hotels);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SRS.teal} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.brandRow}>
            <Image source={require('@/assets/images/serveiq-logo.png')} style={s.logoImage} />
            <Text style={s.brandName}>
              Serve<Text style={s.brandAccent}>IQ</Text>
            </Text>
          </View>
          <View style={s.headerRight}>
            {!isSignedIn && (
              <TouchableOpacity style={s.signInBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.85}>
                <Text style={s.signInBtnText}>Sign in</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.hostBtn} onPress={() => router.push('/(host)/landing')}>
              <Text style={s.hostBtnText}>{t('home.becomeHost')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.notifBtn} onPress={() => router.push('/(tabs)/profile/notifications')} activeOpacity={0.7}>
              <IconSymbol name="notifications" size={18} color={BRAND.navyLight} />
              {unreadCount > 0 && <View style={s.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section — search bar, vibe filters, trust text */}
        <HeroSection onSearchPress={() => setShowSearch(true)} />

        {/* Browse by property type */}
        <View style={s.section}>
          <PropertyTypeBrowser
            selected={selectedPropertyType}
            onSelect={(type) => {
              setSelectedPropertyType(type);
              router.push({ pathname: '/guest-search-results', params: { type } });
            }}
          />
        </View>

        {/* Stays nearby — hidden until the user grants location permission */}
        <View style={s.section}>
          {!locationGranted ? (
            <TouchableOpacity style={s.locationBanner} onPress={requestLocation} activeOpacity={0.8}>
              <IconSymbol name="location" size={18} color={BG.white} />
              <View style={{ flex: 1 }}>
                <Text style={s.locationBannerTitle}>Enable location</Text>
                <Text style={s.locationBannerDesc}>Unlock stays nearby — find properties around you</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : (
            <>
              <View style={s.sectionHeader}>
                <View style={s.sectionTitleRow}>
                  <IconSymbol name="location" size={18} color={SRS.teal} />
                  <Text style={s.sectionTitle}>{t('home.staysNearby')}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSearch(true)}>
                  <View style={s.seeAllBtn}>
                    <Text style={s.seeAll}>{t('components.destinations.viewAll')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={s.sectionHint}>{t('home.staysNearbyHint')}</Text>

              {nearbyLoading && nearbyHotels.length === 0 ? (
                <View style={s.nearbyLoading}>
                  <ActivityIndicator size="small" color={SRS.teal} />
                  <Text style={s.nearbyLoadingText}>Finding nearby properties...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 12 }}>
                  {nearbyHotels.map((hotel) => (
                    <TouchableOpacity
                      key={hotel.id}
                      style={s.nearbyCard}
                      onPress={() => router.push(`/guest-hotel-detail/${hotel.id}`)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: hotel.images?.[0] || PLACEHOLDER_IMAGE }}
                        style={s.nearbyImage}
                        resizeMode="cover"
                      />
                      <View style={s.nearbyInfo}>
                        <Text style={s.nearbyName} numberOfLines={1}>{hotel.name}</Text>
                        <View style={s.nearbyLocRow}>
                          <Text style={s.nearbyLocation} numberOfLines={1}>{hotel.city}, {hotel.country}</Text>
                          {formatDistance(hotel.distance_km) ? (
                            <Text style={s.nearbyDistance}>📍 {formatDistance(hotel.distance_km)}</Text>
                          ) : null}
                        </View>
                        <View style={s.nearbyBottom}>
                          <View style={s.nearbyRating}>
                            <Text style={s.nearbyStar}>⭐</Text>
                            <Text style={s.nearbyRatingText}>{hotel.rating}</Text>
                          </View>
                          <Text style={s.nearbyPrice}>{hotel.currency} {hotel.price}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>

        {/* Explore by City — Kathmandu */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Text style={s.cityEmoji}>🏛️</Text>
              <View>
                <Text style={s.sectionTitle}>Stay in Kathmandu</Text>
                <Text style={s.sectionHint}>Nepal{"'"}s capital — temples, history, vibrant culture</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/guest-search-results', params: { location: 'Kathmandu' } })}>
              <View style={s.seeAllBtn}>
                <Text style={s.seeAll}>View All</Text>
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 8 }}>
            {kathmanduHotels.map((hotel) => (
              <TouchableOpacity
                key={hotel.id}
                style={s.cityPropCard}
                onPress={() => router.push(`/guest-hotel-detail/${hotel.id}`)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: hotel.images?.[0] || PLACEHOLDER_IMAGE }} style={s.cityPropImage} resizeMode="cover" />
                <View style={s.cityPropInfo}>
                  <Text style={s.cityPropName} numberOfLines={1}>{hotel.name}</Text>
                  <Text style={s.cityPropLocation} numberOfLines={1}>{hotel.location}</Text>
                  <View style={s.cityPropBottom}>
                    <View style={s.cityPropRating}>
                      <Text>⭐</Text>
                      <Text style={s.cityPropRatingText}>{hotel.rating}</Text>
                      <Text style={s.cityPropReviews}>({hotel.review_count})</Text>
                    </View>
                    <Text style={s.cityPropPrice}>{hotel.currency} {hotel.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Explore by City — Pokhara */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Text style={s.cityEmoji}>🏔️</Text>
              <View>
                <Text style={s.sectionTitle}>Stay in Pokhara</Text>
                <Text style={s.sectionHint}>Lakeside paradise — Annapurna views, adventure sports</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/guest-search-results', params: { location: 'Pokhara' } })}>
              <View style={s.seeAllBtn}>
                <Text style={s.seeAll}>View All</Text>
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 8 }}>
            {pokharaHotels.map((hotel) => (
              <TouchableOpacity
                key={hotel.id}
                style={s.cityPropCard}
                onPress={() => router.push(`/guest-hotel-detail/${hotel.id}`)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: hotel.images?.[0] || PLACEHOLDER_IMAGE }} style={s.cityPropImage} resizeMode="cover" />
                <View style={s.cityPropInfo}>
                  <Text style={s.cityPropName} numberOfLines={1}>{hotel.name}</Text>
                  <Text style={s.cityPropLocation} numberOfLines={1}>{hotel.location}</Text>
                  <View style={s.cityPropBottom}>
                    <View style={s.cityPropRating}>
                      <Text>⭐</Text>
                      <Text style={s.cityPropRatingText}>{hotel.rating}</Text>
                      <Text style={s.cityPropReviews}>({hotel.review_count})</Text>
                    </View>
                    <Text style={s.cityPropPrice}>{hotel.currency} {hotel.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular destinations */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <IconSymbol name="star" size={18} color={AMBER[500]} />
              <Text style={s.sectionTitle}>{t('components.destinations.popular') || 'Popular destinations'}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSearch(true)}>
              <View style={s.seeAllBtn}>
                <Text style={s.seeAll}>{t('components.destinations.viewAll')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 4 }}>
            {POPULAR_DESTINATIONS.map((dest, i) => (
              <TouchableOpacity
                key={i}
                style={s.popularCard}
                onPress={() => router.push({ pathname: '/guest-search-results', params: { location: dest.city } })}
                activeOpacity={0.85}
              >
                <Image source={{ uri: dest.image }} style={s.popularImage} resizeMode="cover" />
                <View style={s.popularOverlay}>
                  <Text style={s.popularCity}>{dest.city}</Text>
                  <Text style={s.popularCountry}>{dest.country}</Text>
                  <View style={s.popularBottom}>
                    <View style={s.popularRating}>
                      <Text style={s.popularStar}>⭐</Text>
                      <Text style={s.popularRatingText}>{dest.rating}</Text>
                    </View>
                    <Text style={s.popularProps}>{dest.properties} properties</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Newsletter CTA */}
        <View style={{ marginTop: 24 }}>
          <NewsletterCTA />
        </View>

        {/* Testimonials */}
        <View style={{ marginTop: 24 }}>
          <Testimonials />
        </View>

        {/* Trust Badges */}
        <View style={{ marginTop: 24 }}>
          <TrustBadges />
        </View>

        {/* Footer */}
        <GuestFooter />
      </ScrollView>
    </ScreenContainer>
    <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: BG.white,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.navyLight,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: SRS.teal,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SLATE[200],
  },
  hostBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE[600],
  },
  signInBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BRAND.navyLight,
  },
  signInBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: BG.white,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SLATE[100],
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RED[500],
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.navyLight,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: SRS.teal,
  },
  seeAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(46,134,171,0.08)',
  },
  sectionHint: {
    fontSize: 12,
    color: SLATE[400],
    marginTop: 4,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: SRS.teal,
    shadowColor: SRS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  locationBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BG.white,
  },
  locationBannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  nearbyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  nearbyLoadingText: {
    fontSize: 13,
    color: SLATE[400],
  },
  nearbyCard: {
    width: 200,
    borderRadius: 16,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    overflow: 'hidden',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nearbyImage: {
    width: '100%',
    height: 120,
    backgroundColor: SLATE[100],
  },
  nearbyInfo: {
    padding: 12,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.navyLight,
    marginBottom: 2,
  },
  nearbyLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  nearbyLocation: {
    fontSize: 11,
    color: SLATE[400],
    flexShrink: 1,
  },
  nearbyDistance: {
    fontSize: 10,
    fontWeight: '700',
    color: SRS.teal,
    backgroundColor: 'rgba(46,134,171,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  nearbyBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nearbyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nearbyStar: {
    fontSize: 11,
  },
  nearbyRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.navyLight,
  },
  nearbyPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: CORAL[500],
  },
  cityCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    alignItems: 'center',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cityEmoji: {
    fontSize: 20,
  },
  cityPropCard: {
    width: 220,
    borderRadius: 16,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    overflow: 'hidden',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cityPropImage: {
    width: '100%',
    height: 130,
    backgroundColor: SLATE[100],
  },
  cityPropInfo: {
    padding: 12,
  },
  cityPropName: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.navyLight,
    marginBottom: 2,
  },
  cityPropLocation: {
    fontSize: 11,
    color: SLATE[400],
    marginBottom: 8,
  },
  cityPropBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityPropRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cityPropRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.navyLight,
  },
  cityPropReviews: {
    fontSize: 11,
    color: SLATE[400],
  },
  cityPropPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: CORAL[500],
  },
  popularCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: SLATE[100],
  },
  popularImage: {
    width: '100%',
    height: '100%',
  },
  popularOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  popularCity: {
    fontSize: 14,
    fontWeight: '700',
    color: BG.white,
  },
  popularCountry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  popularBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  popularRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  popularStar: {
    fontSize: 10,
  },
  popularRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: BG.white,
  },
  popularProps: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
});
