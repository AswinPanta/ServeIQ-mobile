import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const MOCK_ADMINS = [
  { id: 'adm-1', tenant: 'Himalayan Heights Hotels', adminName: 'Rajesh Hamal', email: 'rajesh@himalayanhotels.com', plan: 'Enterprise', status: 'Active', lastActive: '2 min ago' },
  { id: 'adm-2', tenant: 'Pokhara Lake Resort', adminName: 'Anita Thapa', email: 'anita@pokharalake.com', plan: 'Pro', status: 'Active', lastActive: '15 min ago' },
  { id: 'adm-3', tenant: 'Everest Base Camp Lodges', adminName: 'Mingma Sherpa', email: 'mingma@ebclodges.com', plan: 'Enterprise', status: 'Active', lastActive: '1 hour ago' },
  { id: 'adm-4', tenant: 'Chitwan Safari Lodge', adminName: 'Kumar Gurung', email: 'kumar@safarilodge.com', plan: 'Basic', status: 'Suspended', lastActive: '3 days ago' },
  { id: 'adm-5', tenant: 'Buddha B&B Chain', adminName: 'Sunita Rai', email: 'sunita@buddhabnb.com', plan: 'Basic', status: 'Active', lastActive: '1 hour ago' },
  { id: 'adm-6', tenant: 'Mountain View Inn', adminName: 'Prakash Adhikari', email: 'prakash@mountainview.com', plan: 'Trial', status: 'Active', lastActive: '2 days ago' },
  { id: 'adm-7', tenant: 'Lumbini Garden Hotel', adminName: 'Deepa Shah', email: 'deepa@lumbinihotel.com', plan: 'Pro', status: 'Active', lastActive: '5 hours ago' },
  { id: 'adm-8', tenant: 'Annapurna Base Camp', adminName: 'Nima Dorje', email: 'nima@annapurnabc.com', plan: 'Basic', status: 'Active', lastActive: '30 min ago' },
];

const RECENT_IMPERSONATIONS = [
  { admin: 'Rajesh Hamal', tenant: 'Himalayan Heights Hotels', duration: '12 min', reason: 'Payment gateway issue', time: '2026-07-08 10:23' },
  { admin: 'Anita Thapa', tenant: 'Pokhara Lake Resort', duration: '5 min', reason: 'Booking setup help', time: '2026-07-07 14:45' },
  { admin: 'Mingma Sherpa', tenant: 'Everest Base Camp Lodges', duration: '8 min', reason: 'Staff permission error', time: '2026-07-06 16:30' },
];

export default function ImpersonateScreen() {
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const filtered = MOCK_ADMINS.filter(a =>
    a.tenant.toLowerCase().includes(search.toLowerCase()) ||
    a.adminName.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = (admin: typeof MOCK_ADMINS[0]) => {
    if (!reason.trim()) { Alert.alert('Reason Required', 'Please enter a reason for impersonation.'); return; }
    Alert.alert('Confirm Impersonation', `You are about to impersonate ${admin.adminName} (${admin.tenant}).\n\nReason: ${reason}\n\nThis action will be logged.`,
      [{ text: 'Cancel', style: 'cancel' },
        { text: 'Impersonate', style: 'destructive', onPress: () => {
          Alert.alert('Impersonation Active', `You are now viewing as ${admin.adminName}.\n\nAll actions are being logged.`, [{ text: 'Enter Dashboard', onPress: () => router.back() }]);
        }},
      ]);
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Impersonate Admin</Text>
        </View>

        <View style={s.warningBanner}>
          <IconSymbol name="warning" size={18} color="#EF4444" />
          <Text style={s.warningText}>Audited Action</Text>
          <Text style={s.warningDesc}>All impersonation sessions are logged with timestamp, reason, and actions taken.</Text>
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>REASON FOR IMPERSONATION *</Text>
          <TextInput value={reason} onChangeText={setReason}
            placeholder="e.g., Investigating payment issue reported by admin"
            placeholderTextColor={GRAY[400]} multiline numberOfLines={3} textAlignVertical="top"
            style={s.textarea} />
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={GRAY[400]} />
          <TextInput placeholder="Search by tenant, admin name, or email..." placeholderTextColor={GRAY[400]}
            value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        {filtered.map(admin => (
          <TouchableOpacity key={admin.id} onPress={() => handleImpersonate(admin)}
            style={[s.adminCard, { borderLeftColor: admin.status === 'Active' ? '#10B981' : '#EF4444' }]}>
            <View style={s.adminInfo}>
              <Text style={s.adminTenant}>{admin.tenant}</Text>
              <Text style={s.adminName}>{admin.adminName} · {admin.email}</Text>
              <View style={s.adminMeta}>
                <View style={[s.planBadge, { backgroundColor: SUPERADMIN + '15' }]}>
                  <Text style={[s.planText, { color: SUPERADMIN }]}>{admin.plan}</Text>
                </View>
                <Text style={s.adminActive}>Active {admin.lastActive}</Text>
              </View>
            </View>
            <View style={[s.impersonateBadge, { backgroundColor: SUPERADMIN + '15' }]}>
              <Text style={[s.impersonateText, { color: SUPERADMIN }]}>Impersonate</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <IconSymbol name="search" size={24} color={GRAY[300]} />
            <Text style={s.emptyText}>No admins found</Text>
          </View>
        )}

        {/* Recent */}
        <View style={s.recentSection}>
          <Text style={s.sectionTitle}>Recent Impersonations</Text>
          {RECENT_IMPERSONATIONS.map((imp, i) => (
            <View key={i} style={s.recentCard}>
              <View style={s.recentHead}>
                <Text style={s.recentAdmin}>{imp.admin}</Text>
                <Text style={s.recentDuration}>{imp.duration}</Text>
              </View>
              <Text style={s.recentTenant}>{imp.tenant}</Text>
              <Text style={s.recentReason}>Reason: {imp.reason}</Text>
              <Text style={s.recentTime}>{imp.time}</Text>
            </View>
          ))}
        </View>
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
  warningBanner: { padding: SPACING.lg, borderRadius: 20, backgroundColor: '#EF444410', borderWidth: 1, borderColor: '#EF444420', gap: 4 },
  warningText: { ...TYPOGRAPHY.body, fontWeight: '700', color: '#EF4444' },
  warningDesc: { ...TYPOGRAPHY.small, color: GRAY[500], lineHeight: 20 },
  field: { gap: 8 },
  fieldLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', color: GRAY[500], letterSpacing: 0.5 },
  textarea: { fontSize: 14, color: SRS.navy, paddingHorizontal: SPACING.lg, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[200], minHeight: 80, textAlignVertical: 'top' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GRAY[100], borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 15, color: SRS.navy, padding: 0 },
  adminCard: { padding: 14, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100], borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
  adminInfo: { flex: 1 },
  adminTenant: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  adminName: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  adminMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  planBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  planText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  adminActive: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  impersonateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  impersonateText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  emptyState: { padding: 40, alignItems: 'center', gap: 8 },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[500] },
  recentSection: { gap: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  recentCard: { padding: 14, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[100] },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recentAdmin: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  recentDuration: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  recentTenant: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  recentReason: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  recentTime: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 4 },
});
