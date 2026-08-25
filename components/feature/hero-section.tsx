import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SLATE, NEUTRAL, SRS, BRAND, BG, TEXT } from '@/lib/constants/figma-tokens';
import { router } from 'expo-router';

const VIBE_OPTIONS = [
  { emoji: '🏖️', label: 'Beach', value: 'Beach' },
  { emoji: '🏔️', label: 'Mountain', value: 'Mountain' },
  { emoji: '🏙️', label: 'City', value: 'City' },
  { emoji: '🌿', label: 'Countryside', value: 'Countryside' },
  { emoji: '🏜️', label: 'Desert', value: 'Desert' },
  { emoji: '🏞️', label: 'Lake', value: 'Lake' },
  { emoji: '🎉', label: 'Nightlife', value: 'Nightlife' },
  { emoji: '🧘', label: 'Wellness', value: 'Wellness' },
];

interface HeroSectionProps {
  onSearchPress?: () => void;
}

export function HeroSection({ onSearchPress }: HeroSectionProps) {
  return (
    <View style={s.container}>
      {/* Decorative dots */}
      <View style={[s.dot, { top: '18%', right: '32%', width: 10, height: 10 }]} />
      <View style={[s.dot, { top: '25%', right: '28%', width: 8, height: 8, opacity: 0.4 }]} />
      <View style={[s.dot, { top: '15%', right: '38%', width: 6, height: 6, opacity: 0.5 }]} />
      <View style={[s.dot, { top: '40%', right: '25%', width: 8, height: 8, opacity: 0.35 }]} />
      <View style={[s.dot, { bottom: '35%', left: '48%', width: 10, height: 10, opacity: 0.5 }]} />
      <View style={[s.dot, { top: '12%', left: '15%', width: 12, height: 12, opacity: 0.3 }]} />
      <View style={[s.dot, { top: '55%', left: '10%', width: 8, height: 8, opacity: 0.45 }]} />

      <View style={s.content}>
        {/* Heading */}
        <Text style={s.heading}>
          Stay Beautiful.{'\n'}Live the journey.
        </Text>

        {/* Subtext */}
        <Text style={s.subtext}>
          Find exclusive hotel deals for every kind of traveler.
        </Text>

        {/* Search Bar */}
        <TouchableOpacity onPress={onSearchPress} activeOpacity={0.9} style={s.searchBar}>
          <IconSymbol name="search" size={18} color={SLATE[400]} />
          <Text style={s.searchPlaceholder}>Where are you going?</Text>
        </TouchableOpacity>

        {/* Explore by Vibe */}
        <View style={s.vibeSection}>
          <Text style={s.vibeLabel}>Explore by vibe</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.vibeScroll}>
            {VIBE_OPTIONS.map((vibe) => (
              <TouchableOpacity
                key={vibe.value}
                style={s.vibeChip}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/guest-search-results', params: { vibe: vibe.value } })}
              >
                <Text style={s.vibeEmoji}>{vibe.emoji}</Text>
                <Text style={s.vibeText}>{vibe.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trust Text */}
        <View style={s.trustRow}>
          <Text style={s.trustIcon}>✦</Text>
          <Text style={s.trustText}>Trusted by 10,000+ travelers worldwide</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: NEUTRAL[100],
    overflow: 'hidden',
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: SRS.teal,
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND.navyLight,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtext: {
    fontSize: 14,
    color: SLATE[500],
    lineHeight: 20,
    maxWidth: 340,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG.white,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: SLATE[200],
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: SLATE[400],
    flex: 1,
  },
  vibeSection: {
    marginTop: 4,
  },
  vibeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE[500],
    marginBottom: 8,
  },
  vibeScroll: {
    gap: 8,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[200],
  },
  vibeEmoji: {
    fontSize: 14,
  },
  vibeText: {
    fontSize: 13,
    fontWeight: '500',
    color: SLATE[600],
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  trustIcon: {
    fontSize: 14,
    color: SRS.teal,
  },
  trustText: {
    fontSize: 12,
    color: SLATE[400],
  },
});
