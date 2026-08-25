import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, BG, SLATE } from '@/lib/constants/figma-tokens';

interface PaginationControlsProps {
  /** 0-based current page index */
  page: number;
  /** Total number of pages. Omit to show just "Page X" (unknown totals). */
  totalPages?: number;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  loading?: boolean;
}

/**
 * Prev / "Page X of Y" / Next bar shared by the host and guest property lists.
 */
export function PaginationControls({
  page,
  totalPages,
  canGoNext,
  onPrev,
  onNext,
  loading = false,
}: PaginationControlsProps) {
  const hasPrev = page > 0;
  return (
    <View style={s.row}>
      <TouchableOpacity
        onPress={onPrev}
        disabled={!hasPrev || loading}
        style={[s.btn, !hasPrev && s.btnDisabled]}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={16} color={hasPrev ? BRAND.navyLight : SLATE[300]} />
        <Text style={[s.btnText, !hasPrev && s.btnTextDisabled]}>Prev</Text>
      </TouchableOpacity>

      <View style={s.center}>
        {loading ? (
          <ActivityIndicator size="small" color={BRAND.navyLight} />
        ) : (
          <Text style={s.pageInfo}>
            {totalPages != null ? `Page ${page + 1} of ${totalPages}` : `Page ${page + 1}`}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canGoNext || loading}
        style={[s.btn, !canGoNext && s.btnDisabled]}
        activeOpacity={0.7}
      >
        <Text style={[s.btnText, !canGoNext && s.btnTextDisabled]}>Next</Text>
        <Ionicons name="chevron-forward" size={16} color={canGoNext ? BRAND.navyLight : SLATE[300]} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: BG.white,
    borderWidth: 1.5,
    borderColor: SLATE[200],
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { fontSize: 13, fontWeight: '700', color: BRAND.navyLight },
  btnTextDisabled: { color: SLATE[300] },
  center: { flex: 1, alignItems: 'center' },
  pageInfo: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
});
