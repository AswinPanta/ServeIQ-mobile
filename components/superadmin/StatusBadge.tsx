import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS, RED, AMBER, BLUE, GRAY, PURPLE, EMERALD } from '@/lib/constants/figma-tokens';
;
;

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  Active: { bg: EMERALD[500] + '15', text: STATUS.activeGreen },
  Suspended: { bg: RED[500] + '15', text: RED[500] },
  Trial: { bg: AMBER[500] + '15', text: AMBER[500] },
  Pending: { bg: AMBER[500] + '15', text: AMBER[500] },
  Paid: { bg: EMERALD[500] + '15', text: STATUS.activeGreen },
  Overdue: { bg: RED[500] + '15', text: RED[500] },
  Open: { bg: BLUE[500] + '15', text: BLUE[500] },
  'In Progress': { bg: AMBER[500] + '15', text: AMBER[500] },
  Resolved: { bg: EMERALD[500] + '15', text: STATUS.activeGreen },
  Closed: { bg: GRAY[500] + '15', text: GRAY[500] },
  Allowed: { bg: EMERALD[500] + '15', text: STATUS.activeGreen },
  Denied: { bg: RED[500] + '15', text: RED[500] },
  Operational: { bg: EMERALD[500] + '15', text: STATUS.activeGreen },
  Degraded: { bg: AMBER[500] + '15', text: AMBER[500] },
  Down: { bg: RED[500] + '15', text: RED[500] },
  Enterprise: { bg: PURPLE[700] + '15', text: PURPLE[700] },
  Pro: { bg: BLUE[500] + '15', text: BLUE[500] },
  Basic: { bg: EMERALD[500] + '15', text: STATUS.activeGreen },
};

const DEFAULT_STYLE = { bg: GRAY[500] + '15', text: GRAY[500] };

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