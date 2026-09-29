import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { useSuperAdmin } from '@/lib/context/superadmin-context';
import { superadminApi, type AdminAccount } from '@/lib/api/superadmin-api';
import { PURPLE, RED, SLATE, STATUS, BG } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ImpersonateScreen() {
  const { admins, auditLogs } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  );

  const recent = auditLogs
    .filter(l => String(l.action || '').toLowerCase().includes('impersonat'))
    .slice(0, 5);

  const runImpersonation = async (admin: AdminAccount) => {
    setBusy(true);
    try {
      const res = await superadminApi.impersonate(admin.id, reason.trim());
      const session = res.data;
      const minutes = Math.max(1, Math.round((session.expires_in || 0) / 60));
      setReason('');
      Alert.alert(
        'Impersonation Active',
        `You are now viewing as ${session.impersonated_admin_email}.\n\nSession valid for ${minutes} min. All actions are being logged.`,
        [{ text: 'Enter Dashboard', onPress: () => safeGoBack() }]
      );
    } catch (e: any) {
      Alert.alert('Impersonation failed', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleImpersonate = (admin: AdminAccount) => {
    if (!admin.is_active) {
      Alert.alert('Admin Inactive', `${admin.name} cannot be impersonated while deactivated.`);
      return;
    }
    if (!reason.trim()) { Alert.alert('Reason Required', 'Please enter a reason for impersonation.'); return; }
    Alert.alert('Confirm Impersonation', `You are about to impersonate ${admin.name} (${admin.email}).\n\nReason: ${reason}\n\nThis action will be logged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Impersonate', style: 'destructive', onPress: () => void runImpersonation(admin) },
      ]);
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Impersonate Admin</Text>
        </View>

        <View style={s.warningBanner}>
          <IconSymbol name="warning" size={16} color={RED[500]} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: RED[500] }}>Audited Action</Text>
          <Text style={{ fontSize: 13, color: SLATE[500] }}>All impersonation sessions are logged with timestamp, reason, and actions taken.</Text>
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>REASON FOR IMPERSONATION *</Text>
          <TextInput value={reason} onChangeText={setReason}
            placeholder="e.g., Investigating payment issue reported by admin"
            placeholderTextColor={SLATE[400]} multiline numberOfLines={3} textAlignVertical="top"
            style={s.textarea} />
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={SLATE[400]} />
          <TextInput placeholder="Search by name, email, or role..." placeholderTextColor={SLATE[400]}
            value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        {filtered.map(admin => (
          <TouchableOpacity key={admin.id} disabled={busy} onPress={() => handleImpersonate(admin)}
            style={[s.adminCard, { borderLeftColor: admin.is_active ? STATUS.activeGreen : RED[500] }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.adminTenant}>{admin.name}</Text>
              <Text style={s.adminName}>{admin.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <View style={[s.badge, { backgroundColor: ACCENT + '12' }]}>
                  <Text style={[s.badgeText, { color: ACCENT }]}>{admin.role}</Text>
                </View>
                <Text style={{ fontSize: 12, color: SLATE[500] }}>
                  {admin.is_active ? 'Active' : 'Inactive'} · since {formatDate(admin.created_at)}
                </Text>
              </View>
            </View>
            <View style={[s.impersonateBadge, { backgroundColor: (admin.is_active ? ACCENT : SLATE[300]) + '12' }]}>
              <Text style={[s.impersonateText, { color: admin.is_active ? ACCENT : SLATE[400] }]}>Impersonate</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center', gap: 8 }}>
            <IconSymbol name="search" size={24} color={SLATE[300]} />
            <Text style={{ fontSize: 14, color: SLATE[500] }}>No admins found</Text>
          </View>
        )}

        {recent.length > 0 && (
          <View style={s.recentSection}>
            <Text style={s.sectionTitle}>Recent Impersonations</Text>
            {recent.map(log => (
              <View key={log.id} style={s.recentCard}>
                <View style={s.recentHead}>
                  <Text style={s.recentAdmin}>{log.actor_email}</Text>
                  <Text style={{ fontSize: 12, color: SLATE[500] }}>{formatDate(log.created_at)}</Text>
                </View>
                <Text style={{ fontSize: 13, color: SLATE[500], marginTop: 3 }}>{log.action}</Text>
              </View>
            ))}
          </View>
        )}
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
  warningBanner: { padding: 14, borderRadius: 16, backgroundColor: RED[500] + '08', borderWidth: 1, borderColor: RED[500] + '18', gap: 4 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: SLATE[500], letterSpacing: 0.5 },
  textarea: { fontSize: 14, color: SLATE[900], paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200], minHeight: 80, textAlignVertical: 'top' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BG.white, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: SLATE[200] },
  searchInput: { flex: 1, fontSize: 15, color: SLATE[900], padding: 0 },
  adminCard: { padding: 14, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100], borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
  adminTenant: { fontSize: 15, fontWeight: '700', color: SLATE[900] },
  adminName: { fontSize: 13, color: SLATE[500], marginTop: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  impersonateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  impersonateText: { fontSize: 12, fontWeight: '700' },
  recentSection: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: SLATE[900] },
  recentCard: { padding: 14, borderRadius: 14, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  recentAdmin: { fontSize: 14, fontWeight: '700', color: SLATE[900] },
});