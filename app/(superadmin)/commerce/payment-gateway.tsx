import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { PURPLE, STATUS, GRAY, AMBER, SLATE, BG, EMERALD } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = PURPLE[700];
const STORAGE_KEY = 'serveiq_superadmin_payment_gateways';

interface GatewayConfig {
  id: string; name: string; icon: string; enabled: boolean;
  globalCredentials: boolean; allowOwnCredentials: boolean;
  publicKey: string; secretKey: string; webhookSecret: string; testMode: boolean;
}

const INITIAL_GATEWAYS: GatewayConfig[] = [
  { id: 'stripe', name: 'Stripe', icon: '💳', enabled: true, globalCredentials: true, allowOwnCredentials: true, publicKey: 'pk_test_************', secretKey: 'sk_test_************', webhookSecret: 'whsec_************', testMode: true },
  { id: 'razorpay', name: 'Razorpay', icon: '🏦', enabled: true, globalCredentials: true, allowOwnCredentials: true, publicKey: 'rzp_test_************', secretKey: 'rzp_test_secret_************', webhookSecret: 'whsec_rzp_************', testMode: true },
];

const CONNECTED_TENANTS = [
  { name: 'Himalayan Heights Hotels', gateway: 'Stripe', status: 'Connected', live: false },
  { name: 'Pokhara Lake Resort', gateway: 'Razorpay', status: 'Connected', live: false },
  { name: 'Everest Base Camp Lodges', gateway: 'Stripe', status: 'Connected', live: true },
  { name: 'Buddha B&B Chain', gateway: 'Stripe', status: 'Pending Setup', live: false },
];

export default function PaymentGatewayScreen() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(INITIAL_GATEWAYS);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Lightweight local persistence — gates call requires backend
  // auth, this is the runoff for offline edits.
  const persist = async (next: GatewayConfig[]) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) { console.warn('Failed to persist gateway config:', e); }
  };

  const update = (id: string, updates: Partial<GatewayConfig>) => {
    setGateways(prev => {
      const next = prev.map(g => (g.id === id ? { ...g, ...updates } : g));
      persist(next);
      return next;
    });
  };

  const handleSave = async (gw: GatewayConfig) => {
    const snapshot = gateways.map(g => (g.id === gw.id ? gw : g));
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      Alert.alert('Saved', `${gw.name} configuration saved locally. Backend sync requires admin OAuth handshake.`);
    } catch {
      Alert.alert('Save failed', 'Could not persist the gateway configuration to local storage.');
    }
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Payment Gateways</Text>
        </View>

        {/* Info */}
        <View style={s.infoBanner}>
          <Text style={{ fontSize: 14 }}>ℹ️</Text>
          <Text style={s.infoText}>Configure global gateway credentials. Admins can override per property.</Text>
        </View>

        {gateways.map(gw => (
          <View key={gw.id} style={s.card}>
            <TouchableOpacity onPress={() => setExpanded(expanded === gw.id ? null : gw.id)} style={s.cardHead}>
              <View style={s.gwIconWrap}>
                <Text style={{ fontSize: 22 }}>{gw.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.gwName}>{gw.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <View style={[s.dot, { backgroundColor: gw.enabled ? STATUS.activeGreen : GRAY[500] }]} />
                  <Text style={s.gwStatus}>{gw.enabled ? 'Enabled' : 'Disabled'}</Text>
                  {gw.testMode && (
                    <View style={[s.badgeSm, { backgroundColor: AMBER[500] + '12' }]}>
                      <Text style={[s.badgeSmText, { color: AMBER[500] }]}>Test Mode</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 14, color: SLATE[400] }}>{expanded === gw.id ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expanded === gw.id && (
              <View style={s.expandedContent}>
                <View style={s.switchRow}>
                  <Text style={s.switchLabel}>Enable Gateway</Text>
                  <Switch value={gw.enabled} onValueChange={v => update(gw.id, { enabled: v })} trackColor={{ false: SLATE[200], true: ACCENT + '50' }} thumbColor={gw.enabled ? ACCENT : SLATE[400]} />
                </View>
                <View style={s.switchRow}>
                  <Text style={s.switchLabel}>Allow Own Credentials</Text>
                  <Switch value={gw.allowOwnCredentials} onValueChange={v => update(gw.id, { allowOwnCredentials: v })} trackColor={{ false: SLATE[200], true: ACCENT + '50' }} thumbColor={gw.allowOwnCredentials ? ACCENT : SLATE[400]} />
                </View>
                <View style={s.switchRow}>
                  <Text style={s.switchLabel}>Test Mode</Text>
                  <Switch value={gw.testMode} onValueChange={v => update(gw.id, { testMode: v })} trackColor={{ false: SLATE[200], true: AMBER[500] + '50' }} thumbColor={gw.testMode ? AMBER[500] : SLATE[400]} />
                </View>

                <Text style={s.sectionLabel}>API Credentials</Text>
                {[
                  { key: 'publicKey', label: 'Publishable Key', placeholder: 'pk_...' },
                  { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_...', secure: true },
                  { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...', secure: true },
                ].map(f => (
                  <View key={f.key} style={s.field}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <TextInput
                      value={(gw as any)[f.key]}
                      onChangeText={t => update(gw.id, { [f.key]: t } as any)}
                      placeholder={f.placeholder}
                      placeholderTextColor={SLATE[400]}
                      secureTextEntry={f.secure}
                      style={s.input}
                    />
                  </View>
                ))}

                <TouchableOpacity onPress={() => handleSave(gw)} style={s.saveBtn} activeOpacity={0.8}>
                  <Text style={s.saveText}>Save {gw.name} Configuration</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Connected Tenants */}
        <View style={s.tenantSection}>
          <Text style={s.sectionTitle}>Connected Tenants</Text>
          {CONNECTED_TENANTS.map(t => (
            <View key={t.name} style={s.tenantCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.tenantName}>{t.name}</Text>
                <Text style={s.tenantMeta}>{t.gateway}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {t.live && <View style={[s.badgeSm, { backgroundColor: EMERALD[500] + '12' }]}><Text style={[s.badgeSmText, { color: STATUS.activeGreen }]}>Live</Text></View>}
                <View style={[s.badgeSm, { backgroundColor: t.status === 'Connected' ? EMERALD[500] + '12' : AMBER[500] + '12' }]}>
                  <Text style={[s.badgeSmText, { color: t.status === 'Connected' ? STATUS.activeGreen : AMBER[500] }]}>{t.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
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
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: AMBER[500] + '08', borderWidth: 1, borderColor: AMBER[500] + '18' },
  infoText: { fontSize: 13, color: SLATE[600], flex: 1, lineHeight: 18 },
  card: { padding: 16, borderRadius: 16, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gwIconWrap: { width: 46, height: 46, borderRadius: 12, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  gwName: { fontSize: 16, fontWeight: '700', color: SLATE[900] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  gwStatus: { fontSize: 13, color: SLATE[500] },
  badgeSm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeSmText: { fontSize: 10, fontWeight: '700' },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: SLATE[100] },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: SLATE[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: SLATE[500], marginBottom: 6 },
  input: { fontSize: 14, color: SLATE[900], paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: SLATE[50], borderWidth: 1, borderColor: SLATE[200] },
  saveBtn: { marginTop: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: BG.white },
  tenantSection: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: SLATE[900] },
  tenantCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  tenantName: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  tenantMeta: { fontSize: 12, color: SLATE[500], marginTop: 2 },
});