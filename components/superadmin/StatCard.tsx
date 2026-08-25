import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { KpiCounter } from '@/components/ui/motion';
import { STATUS, RED, BG, TEXT, SLATE } from '@/lib/constants/figma-tokens';

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  change?: string;
  positive?: boolean;
  icon?: string;
}

/**
 * Parses a numeric-display string like "$24,500" / "1.4k" / "−3" into
 * (prefix, number, suffix) so KpiCounter can animate just the digits.
 * Returns null when the string has non-trivial formatting we cannot animate
 * safely — the caller then falls back to a plain <Text> render.
 */
function parseDisplayValue(input: string | number):
  | { prefix: string; num: number; suffix: string; decimals: number }
  | null {
  if (typeof input === 'number') {
    return { prefix: '', num: input, suffix: '', decimals: Number.isInteger(input) ? 0 : 1 };
  }
  const trimmed = input.trim();
  if (!trimmed) return null;
  // accepts optional % or letters but only when the digits are standalone
  const m = trimmed.match(/^([^0-9.\-]*)(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return null;
  const num = parseFloat(m[2].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  const decimals = m[2].includes('.') ? Math.min(2, m[2].split('.')[1]?.length || 0) : 0;
  return { prefix: m[1] || '', num, suffix: m[3] || '', decimals };
}

export function StatCard({ label, value, color, change, positive, icon }: StatCardProps) {
  const parsed = useMemo(() => parseDisplayValue(value), [value]);
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.topRow}>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: color + '12' }]}>
            <IconSymbol name={icon as any} size={16} color={color} />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      {parsed ? (
        <KpiCounter
          value={parsed.num}
          prefix={parsed.prefix}
          suffix={parsed.suffix}
          decimals={parsed.decimals}
          duration={900}
          style={styles.value}
        />
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
      {change && (
        <View style={[styles.changeBadge, { backgroundColor: (positive ? STATUS.activeGreen : RED[500]) + '12' }]}>
          <Text style={[styles.changeText, { color: positive ? STATUS.activeGreen : RED[500] }]}>
            {positive ? '+' : ''}{change}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    backgroundColor: BG.white,
    borderLeftWidth: 3,
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, color: SLATE[400], fontWeight: '500' },
  value: { fontSize: 22, fontWeight: '800', color: SLATE[900], letterSpacing: -0.5 },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  changeText: { fontSize: 11, fontWeight: '700' },
});
