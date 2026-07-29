import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface PermissionToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  accentColor?: string;
}

export function PermissionToggle({ label, description, value, onValueChange, accentColor = '#7C3AED' }: PermissionToggleProps) {
  return (
    <View style={[styles.row, !description && styles.rowCompact]}>
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: accentColor + '50' }}
        thumbColor={value ? accentColor : '#94A3B8'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowCompact: { paddingVertical: 10, borderBottomWidth: 0 },
  info: { flex: 1, marginRight: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  description: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
