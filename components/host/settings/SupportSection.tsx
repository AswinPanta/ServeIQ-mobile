import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SettingSectionTitle } from './shared';
import { GRAY, RADIUS, TYPOGRAPHY } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const RESOURCES = [
  { title: 'Contact Support', desc: 'support@serveiq.com · 24/7' },
  { title: 'Help Center', desc: 'Guides & FAQs' },
  { title: 'Booking Disputes', desc: 'Open a dispute ticket' },
  { title: 'Community Forum', desc: 'Discuss with other hosts' },
];

export function SupportSection() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <SettingSectionTitle>Support Tickets</SettingSectionTitle>
      {RESOURCES.map((r, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.cardTitle}>{r.title}</Text>
          <Text style={styles.cardDesc}>{r.desc}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.modal, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: GRAY[100] },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  cardDesc: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 3 },
});