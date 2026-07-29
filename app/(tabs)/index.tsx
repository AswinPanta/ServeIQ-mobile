import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Animated } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { HeroSection } from '@/components/feature/hero-section';
import { SearchModal } from '@/components/feature/search-modal';
import { PropertyTypeBrowser } from '@/components/guest/PropertyTypeBrowser';
import { TrendingDestinations } from '@/components/guest/TrendingDestinations';
import { PopularDestinations } from '@/components/guest/PopularDestinations';
import { TrustBadges } from '@/components/guest/TrustBadges';
import { Testimonials } from '@/components/guest/Testimonials';
import { NewsletterCTA } from '@/components/guest/NewsletterCTA';
import { GuestFooter } from '@/components/guest/GuestFooter';
import { useAuth } from '@/lib/context/auth-context';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { FONTS } from '@/constants/portal-theme';


export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const routeKey = '/(tabs)/home';
  const handleScroll = useScrollRestoration(scrollRef, routeKey);

  if (!isSignedIn) {
    return (
      <ScreenContainer className="flex-1" containerClassName="bg-background">
        <View style={s.signedOutContainer}>
          <View style={s.signedOutIcon}>
            <IconSymbol name="hotel" size={40} color="#FFF" />
          </View>
          <Text style={s.signedOutTitle}>Welcome to StayEasy</Text>
          <Text style={s.signedOutDesc}>Discover amazing hotels and restaurants curated for you</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={s.signedOutBtn}
            activeOpacity={0.85}
          >
            <Text style={s.signedOutBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.brandRow}>
            <View style={s.logoDot} />
            <Text style={s.brandName}>
              Stay<Text style={s.brandAccent}>Easy</Text>
            </Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.hostBtn} onPress={() => router.push('/(host)/landing')}>
              <Text style={s.hostBtnText}>Become a Host</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.notifBtn}>
              <IconSymbol name="notifications" size={18} color="#1A3C5E" />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section — search bar, vibe filters, trust text */}
        <HeroSection onSearchPress={() => setShowSearch(true)} />

        {/* Browse by property type */}
        <View style={s.section}>
          <PropertyTypeBrowser
            selected={selectedPropertyType}
            onSelect={setSelectedPropertyType}
          />
        </View>

        {/* Stays nearby */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <IconSymbol name="location" size={18} color="#2E86AB" />
              <Text style={s.sectionTitle}>Stays nearby</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSearch(true)}>
              <View style={s.seeAllBtn}>
                <Text style={s.seeAll}>View all →</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={s.sectionHint}>Enable location to discover properties close to you.</Text>
        </View>

        {/* Trending destinations */}
        <View style={s.section}>
          <TrendingDestinations
            onSelect={(dest) => router.push({ pathname: '/guest-search-results', params: { location: dest } })}
          />
        </View>

        {/* Popular destinations */}
        <View style={s.section}>
          <PopularDestinations
            onSelect={(dest) => router.push({ pathname: '/guest-search-results', params: { location: dest } })}
          />
        </View>

        {/* Trust badges */}
        <View style={s.section}>
          <TrustBadges />
        </View>

        {/* What travelers say */}
        <Testimonials />

        {/* Newsletter CTA */}
        <View style={{ marginTop: 24 }}>
          <NewsletterCTA />
        </View>

        {/* Footer */}
        <GuestFooter />
      </ScrollView>
      <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} />
    </ScreenContainer>
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E86AB',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3C5E',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#2E86AB',
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
    borderColor: '#E2E8F0',
  },
  hostBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
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
    color: '#1A3C5E',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E86AB',
  },
  seeAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(46,134,171,0.08)',
  },
  sectionHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  signedOutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0F172A',
  },
  signedOutIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  signedOutTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.sora,
    color: '#FFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  signedOutDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  signedOutBtn: {
    marginTop: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
  },
  signedOutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3C5E',
  },
});
