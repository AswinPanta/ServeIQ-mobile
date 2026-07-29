import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";

const ACCENT = '#7C3AED';

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
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Impersonate', style: 'destructive', onPress: () => {
            Alert.alert('Impersonation Active', `You are now viewing as ${admin.adminName}.\n\nAll actions are being logged.`, [{ text: 'Enter Dashboard', onPress: () => safeGoBack() }]);
          },
        },
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
          <IconSymbol name="warning" size={16} color="#EF4444" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Audited Action</Text>
          <Text style={{ fontSize: 13, color: '#64748B' }}>All impersonation sessions are logged with timestamp, reason, and actions taken.</Text>
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>REASON FOR IMPERSONATION *</Text>
          <TextInput value={reason} onChangeText={setReason}
            placeholder="e.g., Investigating payment issue reported by admin"
            placeholderTextColor="#94A3B8" multiline numberOfLines={3} textAlignVertical="top"
            style={s.textarea} />
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color="#94A3B8" />
          <TextInput placeholder="Search by tenant, admin name, or email..." placeholderTextColor="#94A3B8"
            value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        {filtered.map(admin => (
          <TouchableOpacity key={admin.id} onPress={() => handleImpersonate(admin)}
            style={[s.adminCard, { borderLeftColor: admin.status === 'Active' ? '#10B981' : '#EF4444' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.adminTenant}>{admin.tenant}</Text>
              <Text style={s.adminName}>{admin.adminName} · {admin.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <View style={[s.badge, { backgroundColor: ACCENT + '12' }]}>
                  <Text style={[s.badgeText, { color: ACCENT }]}>{admin.plan}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Active {admin.lastActive}</Text>
              </View>
            </View>
            <View style={[s.impersonateBadge, { backgroundColor: ACCENT + '12' }]}>
              <Text style={[s.impersonateText, { color: ACCENT }]}>Impersonate</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center', gap: 8 }}>
            <IconSymbol name="search" size={24} color="#CBD5E1" />
            <Text style={{ fontSize: 14, color: '#64748B' }}>No admins found</Text>
          </View>
        )}

        <View style={s.recentSection}>
          <Text style={s.sectionTitle}>Recent Impersonations</Text>
          {RECENT_IMPERSONATIONS.map((imp, i) => (
            <View key={i} style={s.recentCard}>
              <View style={s.recentHead}>
                <Text style={s.recentAdmin}>{imp.admin}</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>{imp.duration}</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#64748B' }}>{imp.tenant}</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Reason: {imp.reason}</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{imp.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  warningBanner: { padding: 14, borderRadius: 16, backgroundColor: '#EF444408', borderWidth: 1, borderColor: '#EF444418', gap: 4 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  textarea: { fontSize: 14, color: '#0F172A', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', minHeight: 80, textAlignVertical: 'top' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },
  adminCard: { padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' },
  adminTenant: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  adminName: { fontSize: 13, color: '#64748B', marginTop: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  impersonateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  impersonateText: { fontSize: 12, fontWeight: '700' },
  recentSection: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  recentCard: { padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  recentAdmin: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});
