import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

export default function SettingsScreen() {
  const [platformName, setPlatformName] = useState('StayEasy');
  const [supportEmail, setSupportEmail] = useState('support@stayeasy.com');
  const [defaultCurrency, setDefaultCurrency] = useState('NPR');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Platform is under scheduled maintenance.');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.stayeasy.com/events');
  const handleSave = () => Alert.alert('Settings Saved', 'Platform settings have been updated successfully.');

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Platform Settings</Text>
        </View>

        {/* General */}
        <View style={s.card}>
          <Text style={s.cardTitle}>General</Text>
          <SettingRow label="Platform Name" last={false}>
            <TextInput value={platformName} onChangeText={setPlatformName} style={s.inputInline} />
          </SettingRow>
          <SettingRow label="Support Email" last={false}>
            <TextInput value={supportEmail} onChangeText={setSupportEmail} style={s.inputInline} keyboardType="email-address" />
          </SettingRow>
          <SettingRow label="Default Currency" last={true}>
            <TextInput value={defaultCurrency} onChangeText={setDefaultCurrency} style={s.inputInline} />
          </SettingRow>
        </View>

        {/* Security */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Security</Text>
          <SettingRow label="Multi-Factor Auth" last={false}>
            <Switch value={mfaEnabled} onValueChange={setMfaEnabled} trackColor={{ false: GRAY[200], true: SUPERADMIN + '60' }} thumbColor={mfaEnabled ? SUPERADMIN : '#9CA3AF'} />
          </SettingRow>
          <SettingRow label="Session Timeout (min)" last={false}>
            <TextInput value={sessionTimeout} onChangeText={setSessionTimeout} style={[s.inputInline, { width: 50 }]} keyboardType="number-pad" />
          </SettingRow>
          <SettingRow label="Password Policy" last={true}>
            <TouchableOpacity style={s.configBtn} activeOpacity={0.7}>
              <Text style={[s.configBtnText, { color: SUPERADMIN }]}>Configure</Text>
            </TouchableOpacity>
          </SettingRow>
        </View>

        {/* Notifications */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Notifications</Text>
          <SettingRow label="Default Email Template" last={false}>
            <TouchableOpacity style={s.configBtn} activeOpacity={0.7}>
              <Text style={[s.configBtnText, { color: SUPERADMIN }]}>Edit</Text>
            </TouchableOpacity>
          </SettingRow>
          <SettingRow label="Webhook URL" last={true}>
            <TextInput value={webhookUrl} onChangeText={setWebhookUrl} style={[s.inputInline, { fontSize: 12 }]} autoCapitalize="none" />
          </SettingRow>
        </View>

        {/* Maintenance */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Maintenance</Text>
          <SettingRow label="Maintenance Mode" last={false}>
            <Switch value={maintenanceMode} onValueChange={setMaintenanceMode} trackColor={{ false: GRAY[200], true: '#EF444460' }} thumbColor={maintenanceMode ? '#EF4444' : '#9CA3AF'} />
          </SettingRow>
          <SettingRow label="Status Message" last={true}>
            <TextInput value={maintenanceMessage} onChangeText={setMaintenanceMessage} style={[s.inputInline, { fontSize: 12, flex: 1 }]} />
          </SettingRow>
        </View>

        <TouchableOpacity onPress={handleSave} style={s.saveBtn} activeOpacity={0.7}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[rowS.row, !last && rowS.bordered]}>
      <Text style={rowS.label}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>{children}</View>
    </View>
  );
}

const rowS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  bordered: { borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  label: { ...TYPOGRAPHY.body, color: SRS.navy },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  card: { padding: 18, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.lg },
  inputInline: { textAlign: 'right', color: SRS.navy, fontSize: 14, fontWeight: '600', padding: 0 },
  configBtn: { paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8, backgroundColor: SUPERADMIN + '12' },
  configBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  saveBtn: { marginTop: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: SUPERADMIN, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
