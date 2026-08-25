import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { TEXT } from '@/lib/constants/figma-tokens';

export interface FolioItem {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FolioBreakdownProps {
  items: FolioItem[];
  subtotal: number;
  /** Second-pass total. Pass 0 when there are no taxes, and provide a
   *  `taxLabel` describing what those numbers actually are (e.g. "Service
   *  fees") — leaving the default "Tax & Fees (13%)" prints a misleading
   *  13% even when you're passing a non-tax total. */
  tax: number;
  discount?: number;
  total: number;
  currency?: string;
  taxLabel?: string;
}

function Row({ label, value, bold, color, textColor }: { label: string; value: string; bold?: boolean; color?: string; textColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text
        style={{
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? '700' : '400',
          color: color || textColor || TEXT.black,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? '700' : '500',
          color: color || textColor || TEXT.black,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function FolioBreakdown({
  items,
  subtotal,
  tax,
  discount = 0,
  total,
  currency = 'NPR',
  taxLabel = 'Tax & Fees (13%)',
}: FolioBreakdownProps) {
  const colors = useColors();

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
        Price Breakdown
      </Text>

      {/* Line Items */}
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
          <Text style={{ fontSize: 13, color: colors.muted, flex: 1 }}>
            {item.label}
            {item.quantity > 1 && ` × ${item.quantity}`}
          </Text>
          <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: '500' }}>
            {currency} {item.total.toLocaleString()}
          </Text>
        </View>
      ))}

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

      {/* Summary */}
      <Row label="Subtotal" value={`${currency} ${subtotal.toLocaleString()}`} textColor={colors.foreground} />
      <Row label={taxLabel} value={`${currency} ${tax.toLocaleString()}`} textColor={colors.foreground} />
      {discount > 0 && (
        <Row label="Discount" value={`-${currency} ${discount.toLocaleString()}`} color={colors.success} textColor={colors.foreground} />
      )}

      {/* Total */}
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
      <Row label="Total" value={`${currency} ${total.toLocaleString()}`} bold textColor={colors.foreground} />
    </View>
  );
}
