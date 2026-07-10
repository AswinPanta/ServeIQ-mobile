import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { updateTenant, deleteTenantApi } from '@/lib/api';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const MOCK_TENANTS = [
  { id: '1', company: 'Himalayan Heights Hotels', email: 'info@himalayanheights.com', phone: '+977-1-4XXXXXX',
    address: 'Thamel, Kathmandu', created_at: '2024-01-15', plan: 'Enterprise', renewal_date: '2026-01-15',
    properties: 8, users: 24, bookings: 342, revenue: 980000, status: 'Active', avatar: 'HH',
    recent_activity: [
      { action: 'New booking created', time: '2 hours ago' },
      { action: 'Payment of NPR 45,000 received', time: '5 hours ago' },
      { action: 'Property "Himalayan Deluxe Suite" added', time: '1 day ago' },
      { action: 'User "ram@hh.com" joined', time: '2 days ago' },
      { action: 'Subscription renewed to Enterprise', time: '5 days ago' },
    ] },
  { id: '2', company: 'Pokhara Lake Resort', email: 'hello@pokharalake.com', phone: '+977-61-4XXXXX',
    address: 'Lakeside, Pokhara', created_at: '2024-03-20', plan: 'Pro', renewal_date: '2025-09-20',
    properties: 3, users: 10, bookings: 156, revenue: 450000, status: 'Active', avatar: 'PL',
    recent_activity: [
      { action: 'New review received (5 stars)', time: '30 mins ago' },
      { action: 'Booking #B2024-890 confirmed', time: '3 hours ago' },
      { action: 'Room rate updated for peak season', time: '1 day ago' },
    ] },
  { id: '4', company: 'Chitwan Safari Lodge', email: 'admin@chitwansafari.com', phone: '+977-56-4XXXXX',
    address: 'Sauraha, Chitwan', created_at: '2024-02-01', plan: 'Basic', renewal_date: '2025-08-01',
    properties: 1, users: 3, bookings: 28, revenue: 65000, status: 'Suspended', avatar: 'CS',
    recent_activity: [
      { action: 'Account suspended due to payment failure', time: '3 days ago' },
      { action: 'Support ticket #5678 escalated', time: '4 days ago' },
      { action: 'Payment of NPR 25,000 failed', time: '5 days ago' },
    ] },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoS.row}>
      <Text style={infoS.label}>{label}</Text>
      <Text style={infoS.value}>{value}</Text>
    </View>
  );
}
const infoS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...TYPOGRAPHY.body, color: GRAY[500] },
  value: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
});

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={[statS.card, { backgroundColor: color + '10', borderColor: color + '20' }]}>
      <Text style={statS.value}>{value}</Text>
      <Text style={statS.label}>{label}</Text>
    </View>
  );
}
const statS = StyleSheet.create({
  card: { width: '47%', padding: SPACING.lg, borderRadius: 12, borderWidth: 1 },
  value: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  label: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
});

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenant = MOCK_TENANTS.find(t => t.id === id) || MOCK_TENANTS[0];
  const [isActive, setIsActive] = useState(tenant.status === 'Active');

  const handleSuspendToggle = () => {
    Alert.alert(isActive ? 'Suspend Tenant' : 'Activate Tenant',
      isActive ? `Are you sure you want to suspend ${tenant.company}?` : `Are you sure you want to reactivate ${tenant.company}?`,
      [{ text: 'Cancel', style: 'cancel' },
        { text: isActive ? 'Suspend' : 'Activate', style: isActive ? 'destructive' : 'default', onPress: () => { updateTenant(tenant.id, { is_active: !isActive }); setIsActive(!isActive); } },
      ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Tenant', `This will permanently delete ${tenant.company}.`,
      [{ text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteTenantApi(tenant.id); Alert.alert('Deleted', `${tenant.company} has been deleted.`); router.back(); } },
      ]);
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Tenant Details</Text>
        </View>

        {/* Profile */}
        <View style={s.card}>
          <View style={s.profileSection}>
            <View style={[s.avatar, { backgroundColor: SUPERADMIN + '18' }]}>
              <Text style={[s.avatarText, { color: SUPERADMIN }]}>{tenant.avatar}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.companyName}>{tenant.company}</Text>
              <View style={[s.statusBadge, { backgroundColor: isActive ? '#10B98115' : '#EF444415' }]}>
                <Text style={[s.statusText, { color: isActive ? '#10B981' : '#EF4444' }]}>{isActive ? 'Active' : 'Suspended'}</Text>
              </View>
            </View>
          </View>
          <View style={s.divider} />
          <InfoRow label="Email" value={tenant.email} />
          <View style={s.rowGap} />
          <InfoRow label="Phone" value={tenant.phone} />
          <View style={s.rowGap} />
          <InfoRow label="Address" value={tenant.address} />
          <View style={s.rowGap} />
          <InfoRow label="Created" value={tenant.created_at} />
        </View>

        {/* Plan */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Plan</Text>
          <View style={s.planRow}>
            <Text style={s.planLabel}>Current Plan</Text>
            <View style={[s.planBadge, { backgroundColor: SUPERADMIN + '15' }]}>
              <Text style={[s.planValue, { color: SUPERADMIN }]}>{tenant.plan}</Text>
            </View>
          </View>
          <InfoRow label="Renewal Date" value={tenant.renewal_date} />
          <TouchableOpacity style={s.upgradeBtn} activeOpacity={0.7}>
            <Text style={s.upgradeBtnText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Stats</Text>
          <View style={s.statsRow}>
            <StatCard label="Properties" value={tenant.properties} color="#3B82F6" />
            <StatCard label="Users" value={tenant.users} color="#10B981" />
            <StatCard label="Bookings" value={tenant.bookings} color="#F59E0B" />
            <StatCard label="Revenue" value={`NPR ${(tenant.revenue / 1000).toFixed(0)}K`} color={SUPERADMIN} />
          </View>
        </View>

        {/* Actions */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Actions</Text>
          <TouchableOpacity onPress={handleSuspendToggle}
            style={[s.actionBtn, { backgroundColor: isActive ? '#EF444415' : '#10B98115' }]}>
            <Text style={[s.actionText, { color: isActive ? '#EF4444' : '#10B981' }]}>{isActive ? 'Suspend Tenant' : 'Activate Tenant'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[s.actionBtn, { backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444420', marginTop: 8 }]}>
            <Text style={[s.actionText, { color: '#EF4444' }]}>Delete Tenant</Text>
          </TouchableOpacity>
        </View>

        {/* Activity */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {tenant.recent_activity.map((act, i) => (
            <View key={i} style={[s.activityRow, i < tenant.recent_activity.length - 1 && { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
              <View style={[s.activityDot, { backgroundColor: SUPERADMIN }]} />
              <View style={s.activityInfo}>
                <Text style={s.activityAction}>{act.action}</Text>
                <Text style={s.activityTime}>{act.time}</Text>
              </View>
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
  card: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.lg },
  avatar: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  profileInfo: {},
  companyName: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  divider: { height: 1, backgroundColor: GRAY[100], marginBottom: SPACING.lg },
  rowGap: { height: 12 },
  sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.lg },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planLabel: { ...TYPOGRAPHY.body, color: GRAY[500] },
  planBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  planValue: { ...TYPOGRAPHY.body, fontWeight: '700' },
  upgradeBtn: { marginTop: SPACING.lg, paddingVertical: 14, borderRadius: 12, backgroundColor: SUPERADMIN, alignItems: 'center' },
  upgradeBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { fontSize: 15, fontWeight: '700' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  activityInfo: { flex: 1 },
  activityAction: { ...TYPOGRAPHY.body, color: SRS.navy },
  activityTime: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
});
