import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS } from '@/constants/portal-theme';
import { GRAY, BG, TEXT, ORANGE } from '@/lib/constants/figma-tokens';
import { ACCENT } from './types';

export function CounterInput({ value, onChange, min = 0, max = 99, small = false }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; small?: boolean;
}) {
  return (
    <View style={[cs.counter, small && cs.counterSmall]}>
      <TouchableOpacity onPress={() => onChange(Math.max(min, value - 1))} style={cs.counterBtn}>
        <Text style={[cs.counterBtnText, small && cs.counterBtnTextSmall]}>−</Text>
      </TouchableOpacity>
      <Text style={[cs.counterValue, small && cs.counterValueSmall]}>{value}</Text>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + 1))} style={cs.counterBtn}>
        <Text style={[cs.counterBtnText, small && cs.counterBtnTextSmall]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ToggleSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} style={[cs.toggle, active && cs.toggleActive]} activeOpacity={0.8}>
      <View style={[cs.toggleKnob, active && cs.toggleKnobActive]} />
    </TouchableOpacity>
  );
}

export function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange(rating === s ? 0 : s)}>
          <IconSymbol name="star" size={28} color={s <= rating ? ORANGE[400] : GRAY[300]} />
        </TouchableOpacity>
      ))}
      <Text style={{ fontSize: 13, color: GRAY[500], marginLeft: 8 }}>
        {rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'Select rating'}
      </Text>
    </View>
  );
}


// ─── Review Sub-components ──────────────────────────

export function ReviewCard({ title, icon, onEdit, children }: {
  title: string; icon?: string; onEdit?: () => void; children: React.ReactNode;
}) {
  return (
    <View style={reviewCs.card}>
      <View style={reviewCs.cardHeader}>
        <Text style={reviewCs.cardTitle}>{icon && <Text>{icon} </Text>}{title}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={reviewCs.editBtn}>
            <IconSymbol name="edit" size={12} color={ACCENT} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: ACCENT, marginLeft: 4 }}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

export function ReviewField({ label, value, style }: { label: string; value: string; style?: any }) {
  return (
    <View style={[{ marginBottom: 8 }, style]}>
      <Text style={reviewCs.fieldLabel}>{label}</Text>
      <Text style={reviewCs.fieldValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

// ─── Sub-component Styles ──────────────────────────
export const reviewCs = StyleSheet.create({
  card: {
    backgroundColor: BG.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY[200],
    padding: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: SRS.navy,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    color: GRAY[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: SRS.navy,
  },
});

// ─── Counter Styles ────────────────────────────────
const cs = StyleSheet.create({
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GRAY[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  counterSmall: { borderRadius: 6 },
  counterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: GRAY[100],
  },
  counterBtnText: { fontSize: 16, color: SRS.navy, fontWeight: '500' },
  counterBtnTextSmall: { fontSize: 14 },
  counterValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: SRS.navy,
    minWidth: 40,
  },
  counterValueSmall: { minWidth: 30 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: GRAY[300],
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: { backgroundColor: ACCENT },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BG.white,
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleKnobActive: { alignSelf: 'flex-end' },
});
