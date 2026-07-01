import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/hooks/use-colors';

export interface FolioItem {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FolioBreakdownProps {
  items: FolioItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  currency?: string;
}

export function FolioBreakdown({
  items,
  subtotal,
  tax,
  discount = 0,
  total,
  currency = 'NPR',
}: FolioBreakdownProps) {
  const colors = useColors();

  const Row = ({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text
        style={{
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? '700' : '400',
          color: color || colors.foreground,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: bold ? 15 : 13,
          fontWeight: bold ? '700' : '500',
          color: color || colors.foreground,
        }}
      >
        {value}
      </Text>
    </View>
  );

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
      <Row label="Subtotal" value={`${currency} ${subtotal.toLocaleString()}`} />
      <Row label="Tax & Fees (13%)" value={`${currency} ${tax.toLocaleString()}`} />
      {discount > 0 && (
        <Row label="Discount" value={`-${currency} ${discount.toLocaleString()}`} color={colors.success} />
      )}

      {/* Total */}
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
      <Row label="Total" value={`${currency} ${total.toLocaleString()}`} bold />
    </View>
  );
}
