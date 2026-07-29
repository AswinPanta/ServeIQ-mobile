import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
          <IconSymbol name="search" size={18} color="#94A3B8" />
          <Text style={s.searchPlaceholder}>Where are you going?</Text>
        </TouchableOpacity>

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
    backgroundColor: '#F8F9FB',
    overflow: 'hidden',
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: '#2E86AB',
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A3C5E',
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtext: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    maxWidth: 340,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  trustIcon: {
    fontSize: 14,
    color: '#2E86AB',
  },
  trustText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
