import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import { BRAND, SLATE } from '@/lib/constants/figma-tokens';

interface ThingsToKnowProps {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  amenities?: Array<{ name: string }>;
}

export function ThingsToKnow({ checkInTime, checkOutTime, cancellationPolicy, amenities }: ThingsToKnowProps) {
  const rules = amenities
    ? amenities
        .filter((a) => ['Quiet hours', 'No smoking', 'No pets'].includes(a.name))
        .map((a) => a.name)
    : ['Quiet hours', 'No smoking', 'No pets'];

  return (
    <View>
      <View style={s.cardsRow}>
        <View style={s.card}>
          <IconSymbol name="clock" size={16} color={BRAND.navyLight} />
          <Text style={s.cardLabel}>Check-in</Text>
          <Text style={s.cardValue}>{checkInTime}</Text>
        </View>
        <View style={s.card}>
          <IconSymbol name="clock" size={16} color={BRAND.navyLight} />
          <Text style={s.cardLabel}>Check-out</Text>
          <Text style={s.cardValue}>{checkOutTime}</Text>
        </View>
        <View style={s.card}>
          <IconSymbol name="verified" size={16} color={BRAND.navyLight} />
          <Text style={s.cardLabel}>Cancellation</Text>
          <Text style={s.cardValue} numberOfLines={2}>{cancellationPolicy}</Text>
        </View>
      </View>

      <View style={s.rulesSection}>
        <Text style={s.rulesTitle}>House Rules</Text>
        <View style={s.rulesList}>
          {rules.map((rule) => (
            <View key={rule} style={s.ruleRow}>
              <View style={s.ruleDot} />
              <Text style={s.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  cardsRow: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1, padding: 12, borderRadius: 10, backgroundColor: SLATE[50],
    borderWidth: 1, borderColor: SLATE[100], gap: 4, alignItems: 'center',
  },
  cardLabel: { fontSize: 10, color: SLATE[400], fontWeight: '500' },
  cardValue: { fontSize: 12, fontWeight: '700', color: BRAND.navyLight, textAlign: 'center' },
  rulesSection: { marginTop: 16 },
  rulesTitle: {
    fontSize: 14, fontWeight: '700', color: BRAND.navyLight, marginBottom: 8,
    letterSpacing: -0.2, fontFamily: FONTS.sora,
  },
  rulesList: { gap: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: SLATE[300] },
  ruleText: { fontSize: 12, color: SLATE[500] },
});
