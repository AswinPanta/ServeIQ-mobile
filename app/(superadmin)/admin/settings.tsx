import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuperAdmin } from '@/lib/context/superadmin-context';
import { AdminCard } from '@/components/superadmin/AdminCard';
import { PURPLE, BLUE, SLATE, RED, BG, STATUS, AMBER, NEUTRAL, EMERALD } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = PURPLE[700];

export default function SettingsScreen() {
  const { settings, updateSettings } = useSuperAdmin();
  const [local, setLocal] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    security: false,
    notifications: false,
    maintenance: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (key: keyof typeof local, value: string | boolean) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Real persistence path: write to superadmin context *and* mirror to
  // AsyncStorage so refresh / cold-restart keeps the values.
  const handleSave = async () => {
    try {
      updateSettings(local);
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('serveiq_superadmin_settings', JSON.stringify(local));
      setHasChanges(false);
      Alert.alert('Settings Saved', 'Platform settings have been updated successfully.');
    } catch (e) {
      Alert.alert('Save Failed', 'Could not persist settings to local storage.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Settings</Text>
      </View>

      {/* General Section */}
      <TouchableOpacity onPress={() => toggleSection('general')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: BLUE[500] + '12' }]}>
              <IconSymbol name="settings" size={18} color={BLUE[500]} />
            </View>
            <Text style={styles.sectionTitle}>General</Text>
          </View>
          <IconSymbol name={expandedSections.general ? 'chevron.up' : 'chevron.down'} size={16} color={SLATE[400]} />
        </View>
      </TouchableOpacity>
      {expandedSections.general && (
        <AdminCard style={styles.card}>
          <Text style={styles.inputLabel}>Platform Name</Text>
          <TextInput
            value={local.platformName}
            onChangeText={v => update('platformName', v)}
            style={styles.input}
            placeholder="Platform name"
            placeholderTextColor={SLATE[400]}
          />
          <Text style={styles.inputLabel}>Support Email</Text>
          <TextInput
            value={local.supportEmail}
            onChangeText={v => update('supportEmail', v)}
            style={styles.input}
            placeholder="Support email"
            placeholderTextColor={SLATE[400]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.inputLabel}>Default Currency</Text>
          <TextInput
            value={local.defaultCurrency}
            onChangeText={v => update('defaultCurrency', v)}
            style={[styles.input, { width: 100 }]}
            placeholder="NPR"
            placeholderTextColor={SLATE[400]}
          />

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <View style={styles.dangerHeader}>
              <IconSymbol name="warning" size={16} color={RED[500]} />
              <Text style={styles.dangerTitle}>Danger Zone</Text>
            </View>
            <Text style={styles.dangerDesc}>Permanently delete your account and all associated data. This action cannot be undone.</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'WARNING: This will permanently delete your account, all properties, bookings, reviews, and personal data from the database.\n\nThis action is IRREVERSIBLE. Are you absolutely sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete Permanently',
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert(
                          'Final Confirmation',
                          'Type "DELETE" to confirm permanent deletion of all data.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Confirm Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                                  await AsyncStorage.clear();
                                  Alert.alert('Account Deleted', 'All data has been permanently removed.', [
                                    { text: 'OK', onPress: () => router.replace('/') },
                                  ]);
                                } catch {
                                  Alert.alert('Error', 'Failed to delete account data.');
                                }
                              },
                            },
                          ]
                        );
                      },
                    },
                  ]
                );
              }}
            >
              <IconSymbol name="cancel" size={16} color={BG.white} />
              <Text style={styles.deleteBtnText}>Delete Account Permanently</Text>
            </TouchableOpacity>
          </View>
        </AdminCard>
      )}

      {/* Security Section */}
      <TouchableOpacity onPress={() => toggleSection('security')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: EMERALD[500] + '12' }]}>
              <IconSymbol name="lock" size={18} color={STATUS.activeGreen} />
            </View>
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <IconSymbol name={expandedSections.security ? 'chevron.up' : 'chevron.down'} size={16} color={SLATE[400]} />
        </View>
      </TouchableOpacity>
      {expandedSections.security && (
        <AdminCard style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Multi-Factor Authentication</Text>
              <Text style={styles.switchDesc}>Require MFA for all admin accounts</Text>
            </View>
            <Switch
              value={local.mfaEnabled}
              onValueChange={v => update('mfaEnabled', v)}
              trackColor={{ false: SLATE[200], true: ACCENT + '50' }}
              thumbColor={local.mfaEnabled ? ACCENT : SLATE[400]}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Session Timeout</Text>
              <Text style={styles.switchDesc}>Auto-logout after inactivity</Text>
            </View>
            <View style={styles.timeoutRow}>
              <TextInput
                value={local.sessionTimeout}
                onChangeText={v => update('sessionTimeout', v)}
                style={styles.timeoutInput}
                keyboardType="number-pad"
              />
              <Text style={styles.timeoutUnit}>min</Text>
            </View>
          </View>
        </AdminCard>
      )}

      {/* Notifications Section */}
      <TouchableOpacity onPress={() => toggleSection('notifications')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: AMBER[500] + '12' }]}>
              <IconSymbol name="notifications" size={18} color={AMBER[500]} />
            </View>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <IconSymbol name={expandedSections.notifications ? 'chevron.up' : 'chevron.down'} size={16} color={SLATE[400]} />
        </View>
      </TouchableOpacity>
      {expandedSections.notifications && (
        <AdminCard style={styles.card}>
          <Text style={styles.inputLabel}>Webhook URL</Text>
          <TextInput
            value={local.webhookUrl}
            onChangeText={v => update('webhookUrl', v)}
            style={styles.input}
            placeholder="https://hooks.example.com/events"
            placeholderTextColor={SLATE[400]}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.configBtn} activeOpacity={0.7}>
            <IconSymbol name="file" size={16} color={ACCENT} />
            <Text style={styles.configText}>Edit Email Template</Text>
          </TouchableOpacity>
        </AdminCard>
      )}

      {/* Maintenance Section */}
      <TouchableOpacity onPress={() => toggleSection('maintenance')} activeOpacity={0.8}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: RED[500] + '12' }]}>
              <IconSymbol name="warning" size={18} color={RED[500]} />
            </View>
            <Text style={styles.sectionTitle}>Maintenance</Text>
          </View>
          <IconSymbol name={expandedSections.maintenance ? 'chevron.up' : 'chevron.down'} size={16} color={SLATE[400]} />
        </View>
      </TouchableOpacity>
      {expandedSections.maintenance && (
        <AdminCard style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Maintenance Mode</Text>
              <Text style={styles.switchDesc}>Temporarily disable platform access</Text>
            </View>
            <Switch
              value={local.maintenanceMode}
              onValueChange={v => update('maintenanceMode', v)}
              trackColor={{ false: SLATE[200], true: RED[500] + '50' }}
              thumbColor={local.maintenanceMode ? RED[500] : SLATE[400]}
            />
          </View>
          {local.maintenanceMode && (
            <>
              <Text style={styles.inputLabel}>Status Message</Text>
              <TextInput
                value={local.maintenanceMessage}
                onChangeText={v => update('maintenanceMessage', v)}
                style={styles.input}
                placeholder="Maintenance message"
                placeholderTextColor={SLATE[400]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </>
          )}
        </AdminCard>
      )}

      {/* Save Button */}
      {hasChanges && (
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.7}>
          <IconSymbol name="check" size={18} color={BG.white} />
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 6, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: SLATE[900] },
  card: { marginBottom: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: SLATE[500], marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: SLATE[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: SLATE[900],
    marginBottom: 12,
    backgroundColor: NEUTRAL[50],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  switchDesc: { fontSize: 12, color: SLATE[400], marginTop: 2 },
  timeoutRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeoutInput: {
    borderWidth: 1,
    borderColor: SLATE[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    color: SLATE[900],
    width: 50,
    textAlign: 'center',
    backgroundColor: NEUTRAL[50],
  },
  timeoutUnit: { fontSize: 13, color: SLATE[500] },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: ACCENT + '08',
    borderWidth: 1,
    borderColor: ACCENT + '18',
    marginTop: 4,
  },
  configText: { fontSize: 14, fontWeight: '600', color: ACCENT },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: { fontSize: 16, fontWeight: '700', color: BG.white },
  dangerZone: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: RED[50],
    borderWidth: 1,
    borderColor: RED[200],
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: RED[500],
  },
  dangerDesc: {
    fontSize: 13,
    color: SLATE[400],
    lineHeight: 18,
    marginBottom: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: RED[500],
    shadowColor: RED[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: BG.white,
  },
});