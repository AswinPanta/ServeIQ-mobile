import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';
const SAVE_COLOR = '#0D9488';

interface GatewayConfig {
  id: string; name: string; enabled: boolean;
  fields: { key: string; label: string; placeholder: string; secure: boolean; value: string }[];
}

const INITIAL_CONFIGS: GatewayConfig[] = [
  {
    id: 'stripe', name: 'Stripe', enabled: true,
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', secure: false, value: 'pk_live_************' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', secure: true, value: 'sk_live_************' },
      { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...', secure: true, value: 'whsec_************' },
    ],
  },
  {
    id: 'paypal', name: 'PayPal', enabled: false,
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'Ae...', secure: false, value: 'Ae************' },
      { key: 'secret', label: 'Secret', placeholder: 'EP...', secure: true, value: 'EP************' },
    ],
  },
  {
    id: 'bank_transfer', name: 'Bank Transfer', enabled: true,
    fields: [
      { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. Nepal Bank Ltd.', secure: false, value: 'Nepal Bank Ltd.' },
      { key: 'account_number', label: 'Account Number', placeholder: 'e.g. 1234567890', secure: false, value: '1234567890' },
      { key: 'routing_number', label: 'Routing Number', placeholder: 'e.g. 987654321', secure: false, value: '987654321' },
      { key: 'account_holder', label: 'Account Holder', placeholder: 'e.g. StayEasy Pvt. Ltd.', secure: false, value: 'StayEasy Pvt. Ltd.' },
    ],
  },
];

export default function PaymentConfigScreen() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(INITIAL_CONFIGS);

  const toggleGateway = (id: string) => setGateways(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  const updateField = (gatewayId: string, key: string, value: string) =>
    setGateways(prev => prev.map(g => g.id === gatewayId ? { ...g, fields: g.fields.map(f => f.key === key ? { ...f, value } : f) } : g));
  const handleSave = () => Alert.alert('Saved', 'Payment configuration updated successfully.');

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payment Configuration</Text>
        </View>

        {gateways.map(gateway => (
          <View key={gateway.id} style={s.gatewayCard}>
            <View style={s.gatewayHead}>
              <Text style={s.gatewayName}>{gateway.name}</Text>
              <StatusBadge label={gateway.enabled ? 'Active' : 'Inactive'} color={gateway.enabled ? '#10B981' : '#6B7280'} />
            </View>
            <View style={s.switchRow}>
              <Text style={s.switchLabel}>Enable {gateway.name}</Text>
              <Switch value={gateway.enabled} onValueChange={() => toggleGateway(gateway.id)}
                trackColor={{ false: GRAY[200], true: SUPERADMIN + '60' }} thumbColor={gateway.enabled ? SUPERADMIN : '#9CA3AF'} />
            </View>
            {gateway.fields.map(field => (
              <View key={field.key} style={s.field}>
                <Text style={s.fieldLabel}>{field.label}</Text>
                <TextInput value={field.value} onChangeText={t => updateField(gateway.id, field.key, t)}
                  placeholder={field.placeholder} placeholderTextColor={GRAY[400]} secureTextEntry={field.secure}
                  style={s.input} />
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity onPress={handleSave} style={s.saveBtn} activeOpacity={0.8}>
          <Text style={s.saveBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  gatewayCard: { padding: 18, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], ...SHADOWS.card },
  gatewayName: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  switchLabel: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  field: { marginBottom: 12 },
  fieldLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 6 },
  input: { fontSize: 14, color: SRS.navy, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderRadius: 12, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200] },
  gatewayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  saveBtn: { paddingVertical: 16, borderRadius: 14, backgroundColor: SAVE_COLOR, alignItems: 'center', ...SHADOWS.card },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
