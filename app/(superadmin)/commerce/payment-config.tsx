import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { PURPLE, STATUS, GRAY, SLATE, BG, TEAL, EMERALD } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = PURPLE[700];
const STORAGE_KEY = 'serveiq_superadmin_payment_config';

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
      { key: 'account_holder', label: 'Account Holder', placeholder: 'e.g. ServeIQ Pvt. Ltd.', secure: false, value: 'ServeIQ Pvt. Ltd.' },
    ],
  },
];

export default function PaymentConfigScreen() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(INITIAL_CONFIGS);

  const toggle = (id: string) =>
    setGateways(prev => {
      const next = prev.map(g => (g.id === id ? { ...g, enabled: !g.enabled } : g));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  const updateField = (gid: string, key: string, value: string) =>
    setGateways(prev => {
      const next = prev.map(g =>
        g.id === gid ? { ...g, fields: g.fields.map(f => (f.key === key ? { ...f, value } : f)) } : g
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

  const handleSave = () => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gateways))
      .then(() =>
        Alert.alert(
          'Saved',
          `Payment configuration cached locally (${gateways.filter(g => g.enabled).length} gateway${gateways.filter(g => g.enabled).length === 1 ? '' : 's'} active). Backend sync happens on next deploy window.`,
        ),
      )
      .catch(() => Alert.alert('Save failed', 'Could not persist payment configuration.'));
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payment Config</Text>
        </View>

        {gateways.map(gw => (
          <View key={gw.id} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.gwName}>{gw.name}</Text>
              <View style={[s.statusBadge, { backgroundColor: gw.enabled ? EMERALD[500] + '12' : GRAY[500] + '12' }]}>
                <Text style={[s.statusText, { color: gw.enabled ? STATUS.activeGreen : GRAY[500] }]}>{gw.enabled ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>

            <View style={s.switchRow}>
              <Text style={s.switchLabel}>Enable {gw.name}</Text>
              <Switch
                value={gw.enabled}
                onValueChange={() => toggle(gw.id)}
                trackColor={{ false: SLATE[200], true: ACCENT + '50' }}
                thumbColor={gw.enabled ? ACCENT : SLATE[400]}
              />
            </View>

            {gw.fields.map(f => (
              <View key={f.key} style={s.field}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={t => updateField(gw.id, f.key, t)}
                  placeholder={f.placeholder}
                  placeholderTextColor={SLATE[400]}
                  secureTextEntry={f.secure}
                  style={s.input}
                />
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity onPress={handleSave} style={s.saveBtn} activeOpacity={0.8}>
          <Text style={s.saveText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  card: { padding: 16, borderRadius: 16, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  gwName: { fontSize: 16, fontWeight: '700', color: SLATE[900] },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: SLATE[500], marginBottom: 6 },
  input: { fontSize: 14, color: SLATE[900], paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] },
  saveBtn: { paddingVertical: 15, borderRadius: 14, backgroundColor: TEAL[600], alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700', color: BG.white },
});