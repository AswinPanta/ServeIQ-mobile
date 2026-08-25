import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { PURPLE, SLATE } from '@/lib/constants/figma-tokens';

interface PermissionToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  accentColor?: string;
}

export function PermissionToggle({ label, description, value, onValueChange, accentColor = PURPLE[700] }: PermissionToggleProps) {
  return (
    <View style={[styles.row, !description && styles.rowCompact]}>
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: SLATE[200], true: accentColor + '50' }}
        thumbColor={value ? accentColor : SLATE[400]}
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
    borderBottomColor: SLATE[100],
  },
  rowCompact: { paddingVertical: 10, borderBottomWidth: 0 },
  info: { flex: 1, marginRight: 12 },
  label: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  description: { fontSize: 12, color: SLATE[400], marginTop: 2 },
});
