import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Property } from '@/types/api';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface Props { property: Property }

const SETTINGS_SECTIONS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { key: 'company', label: 'Company Profile', icon: 'business-outline', desc: 'Cover photo, gallery, identity' },
  { key: 'general', label: 'General Settings', icon: 'settings-outline', desc: 'Currency, timezone, floors' },
  { key: 'booking', label: 'Booking Settings', icon: 'calendar-outline', desc: 'Stays, advance, cancellation' },
  { key: 'room-rate', label: 'Room & Rate', icon: 'bed-outline', desc: 'Pricing rules & premiums' },
  { key: 'amenities', label: 'Amenities', icon: 'sparkles-outline', desc: 'Facilities offered' },
  { key: 'notifications', label: 'Notification Settings', icon: 'notifications-outline', desc: 'Alerts & reminders' },
  { key: 'taxes', label: 'Taxes & Policies', icon: 'receipt-outline', desc: 'Tax config & house rules' },
  { key: 'payments', label: 'Payment Method & Policies', icon: 'card-outline', desc: 'Acceptable payments' },
  { key: 'integrations', label: 'Integrations', icon: 'git-merge-outline', desc: 'Channel, PMS, accounting' },
  { key: 'logs', label: 'Activity Logs', icon: 'document-text-outline', desc: 'Recent changes' },
  { key: 'support', label: 'Support Tickets', icon: 'help-circle-outline', desc: 'Contact & resources' },
];

export function PropertySettings({ property }: Props) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>Property Settings</Text>
      <View style={styles.grid}>
        {SETTINGS_SECTIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/(host)/property/${property.id}/settings/${s.key}` as any)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={22} color={ACCENT} />
            </View>
            <Text style={styles.cardLabel}>{s.label}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 16,
    ...SHADOWS.card,
    gap: 6,
  },
  iconWrap: { width: 40, height: 40, borderRadius: RADIUS.button, backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  cardSub: { ...TYPOGRAPHY.caption, color: GRAY[400], lineHeight: 15 },
});