import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TRUST_BADGES } from '@/lib/mock/landing-data';
import { BRAND, SLATE } from '@/lib/constants/figma-tokens';

const BADGE_ICONS = ['💰', '🛡️', '🔄', '🎧'];

export function TrustBadges() {
  return (
    <View style={s.container}>
      {TRUST_BADGES.map((badge, index) => (
        <View key={index} style={s.badge}>
          <View style={s.iconWrap}>
            <Text style={s.icon}>{BADGE_ICONS[index]}</Text>
          </View>
          <Text style={s.title}>{badge.title}</Text>
          <Text style={s.desc}>{badge.description}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  badge: {
    width: '47%',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46,134,171,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.navyLight,
    textAlign: 'center',
  },
  desc: {
    fontSize: 11,
    color: SLATE[500],
    textAlign: 'center',
    lineHeight: 16,
  },
});
