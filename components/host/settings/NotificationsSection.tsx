import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Alert } from 'react-native';
import { useHost } from '@/lib/context/host-context';
import { SettingSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

interface NotifPref {
  id: string;
  label: string;
  desc: string;
  push: boolean;
  email: boolean;
  sms: boolean;
}

const DEFAULT_PREFS: NotifPref[] = [
  { id: 'new_booking', label: 'New Booking', desc: 'When a guest completes a booking', push: true, email: true, sms: false },
  { id: 'cancellation', label: 'Cancellation', desc: 'When a guest cancels a booking', push: true, email: true, sms: false },
  { id: 'check_in', label: 'Check-in Reminder', desc: 'Day before guest arrival', push: true, email: false, sms: false },
  { id: 'check_out', label: 'Check-out Reminder', desc: 'Day of guest departure', push: true, email: false, sms: false },
  { id: 'review', label: 'Review Received', desc: 'When a guest leaves a review', push: false, email: true, sms: false },
  { id: 'payment', label: 'Payment Received', desc: 'When payment is confirmed', push: true, email: true, sms: false },
  { id: 'housekeeping', label: 'Housekeeping Update', desc: 'When rooms need attention', push: true, email: false, sms: false },
  { id: 'low_stock', label: 'Low Stock Alert', desc: 'When supplies are running low', push: false, email: true, sms: false },
];

export function NotificationsSection() {
  const { properties, activePropertyId, updateProperty } = useHost();
  const property = properties.find(p => p.id === activePropertyId);

  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  // Load saved preferences from property metadata
  useEffect(() => {
    if (property && (property as any).notification_prefs) {
      const saved = (property as any).notification_prefs;
      setPrefs(prev => prev.map(p => saved[p.id] ?? p));
    }
  }, [property?.id]);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(DEFAULT_PREFS);

  const togglePref = useCallback((id: string, channel: 'push' | 'email' | 'sms') => {
    setPrefs(prev => prev.map(p =>
      p.id === id ? { ...p, [channel]: !p[channel] } : p
    ));
  }, []);

  const handleSave = useCallback(async () => {
    if (!property) return;
    setSaving(true);
    try {
      await updateProperty(property.id, {
        notification_prefs: prefs,
      } as any);
      Alert.alert('Saved', 'Notification preferences updated');
    } catch {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }, [property, prefs, updateProperty]);

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
      <SettingSectionTitle>Notification Preferences</SettingSectionTitle>

      {/* Channel headers */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.chHeader}>
          <Text style={styles.chLabel}>Push</Text>
        </View>
        <View style={styles.chHeader}>
          <Text style={styles.chLabel}>Email</Text>
        </View>
        <View style={styles.chHeader}>
          <Text style={styles.chLabel}>SMS</Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        {prefs.map((pref, i) => (
          <View key={pref.id} style={[styles.prefRow, i < prefs.length - 1 && styles.prefRowBorder]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.prefLabel}>{pref.label}</Text>
              <Text style={styles.prefDesc}>{pref.desc}</Text>
            </View>
            <View style={styles.chHeader}>
              <Switch
                value={pref.push}
                onValueChange={() => togglePref(pref.id, 'push')}
                trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
                thumbColor={pref.push ? ACCENT : GRAY[300]}
              />
            </View>
            <View style={styles.chHeader}>
              <Switch
                value={pref.email}
                onValueChange={() => togglePref(pref.id, 'email')}
                trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
                thumbColor={pref.email ? ACCENT : GRAY[300]}
              />
            </View>
            <View style={styles.chHeader}>
              <Switch
                value={pref.sms}
                onValueChange={() => togglePref(pref.id, 'sms')}
                trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
                thumbColor={pref.sms ? ACCENT : GRAY[300]}
              />
            </View>
          </View>
        ))}
      </View>

      {hasChanges && <SettingSaveButton onPress={handleSave} saving={saving} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  chHeader: { width: 52, alignItems: 'center' },
  chLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[400] },
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, overflow: 'hidden', ...SHADOWS.card },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  prefRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GRAY[100] },
  prefLabel: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  prefDesc: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 2 },
});
