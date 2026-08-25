import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SettingRow, SettingSectionTitle } from './shared';
import { RADIUS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

export function IntegrationsSection() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <SettingSectionTitle>Integrations</SettingSectionTitle>
      <View style={styles.card}>
        <SettingRow label="Channel Manager" value="Not connected" />
        <SettingRow label="PMS Integration" value="ServeIQ PMS" />
        <SettingRow label="Accounting" value="Not connected" />
        <SettingRow label="Revenue Management" value="Not connected" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, overflow: 'hidden' },
});