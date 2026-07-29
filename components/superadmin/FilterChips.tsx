import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface FilterChipsProps {
  filters: readonly string[];
  active: string;
  onChange: (filter: string) => void;
  accentColor?: string;
}

export function FilterChips({ filters, active, onChange, accentColor = '#7C3AED' }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {filters.map(f => {
        const isActive = f === active;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => onChange(f)}
            style={[styles.chip, isActive && { backgroundColor: accentColor }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>{f}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  text: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  textActive: { color: '#FFF' },
});
