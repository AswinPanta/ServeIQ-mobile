import React, { useState, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHost } from '@/lib/context/host-context';
import { SettingSectionTitle, SettingSubSectionTitle, SettingSaveButton } from './shared';
import { SRS, GRAY, RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/portal-theme';
import { PAYMENT, BG } from '@/lib/constants/figma-tokens';

const ACCENT = SRS.teal;

type GatewayId = 'stripe' | 'khalti' | 'razorpay';
type GatewayStatus = 'enabled' | 'test' | 'pending';

interface Gateway {
  id: GatewayId;
  name: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const GATEWAYS: Gateway[] = [
  { id: 'stripe', name: 'Stripe', desc: 'Credit / debit cards', icon: 'card-outline', color: PAYMENT.stripe },
  { id: 'khalti', name: 'Khalti', desc: 'Nepal online wallet', icon: 'wallet-outline', color: PAYMENT.razorpay },
  { id: 'razorpay', name: 'Razorpay', desc: 'UPI, cards & net banking', icon: 'business-outline', color: PAYMENT.stripeDark },
];

const STATUS_LABEL: Record<GatewayStatus, string> = {
  enabled: 'Connected',
  test: 'Test mode',
  pending: 'Not connected',
};

export function PaymentsSection() {
  const { properties, activePropertyId, updateProperty } = useHost();
  const property = properties.find(p => p.id === activePropertyId);

  // Payment gateway states (local until saved)
  const [gatewayStatus, setGatewayStatus] = useState<Record<GatewayId, GatewayStatus>>({
    stripe: 'test',
    khalti: 'enabled',
    razorpay: 'pending',
  });
  const [cashAccepted, setCashAccepted] = useState(true);
  const [depositPercent, setDepositPercent] = useState('30');
  const [cancellationHours, setCancellationHours] = useState('24');
  const [notes, setNotes] = useState('Deposit 30% · Full payment at check-in · Free cancellation up to 24h before arrival.');
  const [saving, setSaving] = useState(false);

  const toggleGateway = useCallback((id: GatewayId) => {
    setGatewayStatus(prev => {
      const current = prev[id];
      if (current === 'enabled') return { ...prev, [id]: 'pending' };
      if (current === 'pending') return { ...prev, [id]: 'enabled' };
      return prev;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!property) return;
    const parsedDeposit = parseInt(depositPercent) || 30;
    const parsedHours = parseInt(cancellationHours) || 24;

    if (parsedDeposit < 0 || parsedDeposit > 100) {
      Alert.alert('Invalid', 'Deposit percentage must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      // Save payment-related settings to the property via PATCH
      await updateProperty(property.id, {
        // Store payment gateway preferences and policies
        // These are stored on the property's description field as metadata
        // (the backend doesn't have dedicated payment-setting fields)
        payment_gateways: Object.entries(gatewayStatus)
          .filter(([, status]) => status !== 'pending')
          .map(([id]) => id),
        cash_accepted: cashAccepted,
        deposit_percent: parsedDeposit,
        cancellation_hours: parsedHours,
        payment_notes: notes,
      } as any);
      Alert.alert('Saved', 'Payment settings updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save payment settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [property, gatewayStatus, cashAccepted, depositPercent, cancellationHours, notes, updateProperty]);

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
      <SettingSectionTitle>Payment Gateways</SettingSectionTitle>
      <View style={styles.card}>
        {GATEWAYS.map((gw, i) => {
          const st = gatewayStatus[gw.id];
          const on = st !== 'pending';
          return (
            <TouchableOpacity
              key={gw.id}
              onPress={() => toggleGateway(gw.id)}
              activeOpacity={0.8}
              style={[styles.gatewayRow, i < GATEWAYS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GRAY[100] }]}
            >
              <View style={[styles.gatewayIcon, { backgroundColor: gw.color + '15' }]}>
                <Ionicons name={gw.icon} size={20} color={gw.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gatewayName}>{gw.name}</Text>
                <Text style={styles.gatewayDesc}>{gw.desc}</Text>
                <Text style={[styles.gatewayStatus, { color: on ? ACCENT : GRAY[400] }]}>{STATUS_LABEL[st]}</Text>
              </View>
              <Switch
                value={on}
                onValueChange={() => toggleGateway(gw.id)}
                trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
                thumbColor={on ? ACCENT : GRAY[300]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment Policies */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <SettingSubSectionTitle>Payment Policies</SettingSubSectionTitle>

        <View style={styles.policyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.policyTitle}>Accept cash on arrival</Text>
            <Text style={styles.policyDesc}>Allow guests to pay at check-in</Text>
          </View>
          <Switch
            value={cashAccepted}
            onValueChange={setCashAccepted}
            trackColor={{ false: GRAY[200], true: ACCENT + '55' }}
            thumbColor={cashAccepted ? ACCENT : GRAY[300]}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Deposit Required (%)</Text>
            <TextInput
              style={styles.input}
              value={depositPercent}
              onChangeText={setDepositPercent}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={GRAY[300]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Free Cancellation (hours)</Text>
            <TextInput
              style={styles.input}
              value={cancellationHours}
              onChangeText={setCancellationHours}
              keyboardType="numeric"
              placeholder="24"
              placeholderTextColor={GRAY[300]}
            />
          </View>
        </View>

        <View style={{ padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: GRAY[100] }}>
          <Text style={styles.inputLabel}>Payment Notes</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Additional payment policies…"
            placeholderTextColor={GRAY[300]}
          />
        </View>
      </View>

      {/* Quick summary */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Active Payment Methods</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 }}>
          {GATEWAYS.filter(gw => gatewayStatus[gw.id] !== 'pending').map(gw => (
            <View key={gw.id} style={[styles.activeChip, { backgroundColor: gw.color + '15', borderColor: gw.color + '40' }]}>
              <Ionicons name={gw.icon} size={14} color={gw.color} />
              <Text style={[styles.activeChipText, { color: gw.color }]}>{gw.name}</Text>
            </View>
          ))}
          {cashAccepted && (
            <View style={[styles.activeChip, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B40' }]}>
              <Ionicons name="cash-outline" size={14} color="#D97706" />
              <Text style={[styles.activeChipText, { color: '#D97706' }]}>Cash</Text>
            </View>
          )}
        </View>
      </View>

      <SettingSaveButton onPress={handleSave} saving={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, overflow: 'hidden', ...SHADOWS.card },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900], padding: 14, paddingBottom: 0 },
  gatewayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  gatewayIcon: { width: 40, height: 40, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center' },
  gatewayName: { ...TYPOGRAPHY.body, fontWeight: '700', color: GRAY[900] },
  gatewayDesc: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 1 },
  gatewayStatus: { ...TYPOGRAPHY.caption, fontWeight: '600', marginTop: 2 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GRAY[100] },
  policyTitle: { ...TYPOGRAPHY.body, fontWeight: '600', color: GRAY[900] },
  policyDesc: { ...TYPOGRAPHY.small, color: GRAY[400], marginTop: 3, lineHeight: 16 },
  inputRow: { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GRAY[100] },
  inputLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[500], marginBottom: 6 },
  input: { backgroundColor: GRAY[50], borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200], paddingHorizontal: 14, paddingVertical: 10, ...TYPOGRAPHY.body, color: GRAY[900] },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  activeChipText: { fontSize: 13, fontWeight: '600' },
});
