import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import { SRS, SLATE, BRAND, STATUS_COLORS } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface PriceSummaryProps {
  currency: string;
  roomPrice: number;
  nights: number;
  rating: number;
  checkInSelected: boolean;
  checkOutSelected: boolean;
  selectedRoomName?: string;
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: SLATE[500] },
  value: { fontSize: 13, fontWeight: '600', color: BRAND.navyLight },
});

export function PriceSummary({
  currency,
  roomPrice,
  nights,
  rating,
  checkInSelected,
  checkOutSelected,
  selectedRoomName,
}: PriceSummaryProps) {
  const datesSelected = checkInSelected && checkOutSelected;
  const roomSelected = !!selectedRoomName && roomPrice > 0;
  const showBreakdown = datesSelected && roomSelected;
  const subtotal = roomPrice * nights;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.price}>
          {roomSelected
            ? `${currency} ${roomPrice.toLocaleString()}`
            : 'Select a room to see pricing'}
          {roomSelected ? <Text style={s.perNight}> /night</Text> : null}
        </Text>
        <View style={s.ratingBadge}>
          <IconSymbol name="star" size={12} color={STATUS_COLORS.gold} />
          <Text style={s.ratingText}>{rating}</Text>
        </View>
      </View>

      {showBreakdown ? (
        <View style={s.breakdown}>
          <PriceRow
            label={`${currency} ${roomPrice.toLocaleString()} × ${nights} night${nights > 1 ? 's' : ''}`}
            value={`${currency} ${subtotal.toLocaleString()}`}
          />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{currency} {subtotal.toLocaleString()}</Text>
          </View>
        </View>
      ) : (
        <Text style={s.placeholder}>Select dates and room to see pricing</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 16, backgroundColor: 'rgba(46, 134, 171, 0.04)',
    borderWidth: 1, borderColor: 'rgba(46,134,171,0.12)', borderRadius: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  price: { fontSize: 14, fontWeight: '700', color: BRAND.navyLight, fontFamily: FONTS.inter.bold },
  perNight: { fontSize: 12, color: SLATE[400] },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: BRAND.navyLight },
  breakdown: { gap: 4 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1,
    borderTopColor: 'rgba(46,134,171,0.2)', paddingTop: 8, marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: BRAND.navyLight, fontFamily: FONTS.inter.bold },
  totalValue: { fontSize: 16, fontWeight: '700', color: ACCENT, fontFamily: FONTS.inter.bold },
  placeholder: { fontSize: 12, color: SLATE[400], textAlign: 'center', paddingVertical: 8 },
});