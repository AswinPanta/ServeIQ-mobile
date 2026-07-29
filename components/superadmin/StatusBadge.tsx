import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#10B98115', text: '#10B981' },
  Suspended: { bg: '#EF444415', text: '#EF4444' },
  Trial: { bg: '#F59E0B15', text: '#F59E0B' },
  Pending: { bg: '#F59E0B15', text: '#F59E0B' },
  Paid: { bg: '#10B98115', text: '#10B981' },
  Overdue: { bg: '#EF444415', text: '#EF4444' },
  Open: { bg: '#3B82F615', text: '#3B82F6' },
  'In Progress': { bg: '#F59E0B15', text: '#F59E0B' },
  Resolved: { bg: '#10B98115', text: '#10B981' },
  Closed: { bg: '#6B728015', text: '#6B7280' },
  Allowed: { bg: '#10B98115', text: '#10B981' },
  Denied: { bg: '#EF444415', text: '#EF4444' },
  Operational: { bg: '#10B98115', text: '#10B981' },
  Degraded: { bg: '#F59E0B15', text: '#F59E0B' },
  Down: { bg: '#EF444415', text: '#EF4444' },
  Enterprise: { bg: '#7C3AED15', text: '#7C3AED' },
  Pro: { bg: '#3B82F615', text: '#3B82F6' },
  Basic: { bg: '#10B98115', text: '#10B981' },
};

const DEFAULT_STYLE = { bg: '#6B728015', text: '#6B7280' };

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = STATUS_MAP[status] || DEFAULT_STYLE;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }, isSmall ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: style.text }, isSmall ? styles.textSm : styles.textMd]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 6, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: 10, paddingVertical: 4 },
  md: { paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontWeight: '700' },
  textSm: { fontSize: 11 },
  textMd: { fontSize: 13 },
});
