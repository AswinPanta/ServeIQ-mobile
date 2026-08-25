import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Switch } from 'react-native';
import type { Property } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { SettingRow, SettingInput, SettingSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

export function BookingSection() {
  const { updateProperty, properties, activePropertyId } = useHost();
  const property = properties.find(p => p.id === activePropertyId);

  const [minStay, setMinStay] = useState('1');
  const [maxStay, setMaxStay] = useState('30');
  const [advanceBooking, setAdvanceBooking] = useState('90');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [cancellationPolicy, setCancellationPolicy] = useState('Free 24h before');
  const [saving, setSaving] = useState(false);

  const hasChanges = minStay !== '1' || maxStay !== '30' || advanceBooking !== '90';

  const handleSave = useCallback(async () => {
    if (!property) return;
    const parsedMin = parseInt(minStay) || 1;
    const parsedMax = parseInt(maxStay) || 30;
    const parsedAdvance = parseInt(advanceBooking) || 90;

    if (parsedMin < 1) {
      Alert.alert('Invalid', 'Minimum stay must be at least 1 night');
      return;
    }
    if (parsedMax < parsedMin) {
      Alert.alert('Invalid', 'Maximum stay must be greater than minimum stay');
      return;
    }

    setSaving(true);
    try {
      await updateProperty(property.id, {
        min_stay: parsedMin,
        max_stay: parsedMax,
        advance_booking_days: parsedAdvance,
      } as any);
      Alert.alert('Saved', 'Booking settings updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [property, minStay, maxStay, advanceBooking, updateProperty]);

  if (!property) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', marginTop: 40 }}>
          Select a property first
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SettingSectionTitle>Booking Settings</SettingSectionTitle>

      <View style={styles.card}>
        <SettingInput label="Minimum Stay (nights)" value={minStay} onChange={setMinStay} keyboard="numeric" hint="Minimum number of nights a guest must book" />
        <SettingInput label="Maximum Stay (nights)" value={maxStay} onChange={setMaxStay} keyboard="numeric" hint="Maximum number of nights per booking" />
        <SettingInput label="Advance Booking (days)" value={advanceBooking} onChange={setAdvanceBooking} keyboard="numeric" hint="How far in advance guests can book" />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Auto-confirm Bookings</Text>
            <Text style={styles.toggleHint}>Automatically confirm new bookings without manual review</Text>
          </View>
          <Switch
            value={autoConfirm}
            onValueChange={setAutoConfirm}
            trackColor={{ false: GRAY[300], true: ACCENT + '50' }}
            thumbColor={autoConfirm ? ACCENT : GRAY[400]}
          />
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.toggleLabel}>Cancellation Policy</Text>
          <Text style={{ ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 4 }}>{cancellationPolicy}</Text>
        </View>
      </View>

      {hasChanges && <SettingSaveButton onPress={handleSave} saving={saving} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG.white, borderRadius: RADIUS.card + 6, padding: 14,
    ...SHADOWS.card,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: GRAY[100], marginTop: 8,
  },
  toggleLabel: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  toggleHint: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
});
