import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { updateTenant, deleteTenantApi } from '@/lib/api';
import { AdminCard } from '@/components/superadmin/AdminCard';
import { StatCard } from '@/components/superadmin/StatCard';
import { StatusBadge } from '@/components/superadmin/StatusBadge';

const ACCENT = '#7C3AED';

const MOCK_TENANTS = [
  { id: '1', company: 'Himalayan Heights Hotels', email: 'info@himalayanheights.com', phone: '+977-1-4XXXXXX',
    address: 'Thamel, Kathmandu', created_at: '2024-01-15', plan: 'Enterprise', renewal_date: '2026-01-15',
    properties: 8, users: 24, bookings: 342, revenue: 980000, status: 'Active', avatar: 'HH',
    recent_activity: [
      { action: 'New booking created', time: '2 hours ago', icon: 'calendar' as const, color: '#3B82F6' },
      { action: 'Payment of NPR 45,000 received', time: '5 hours ago', icon: 'payment' as const, color: '#10B981' },
      { action: 'Property "Deluxe Suite" added', time: '1 day ago', icon: 'home' as const, color: '#8B5CF6' },
      { action: 'User "ram@hh.com" joined', time: '2 days ago', icon: 'guest' as const, color: '#F59E0B' },
      { action: 'Subscription renewed to Enterprise', time: '5 days ago', icon: 'refresh' as const, color: '#EC4899' },
    ] },
  { id: '2', company: 'Pokhara Lake Resort', email: 'hello@pokharalake.com', phone: '+977-61-4XXXXX',
    address: 'Lakeside, Pokhara', created_at: '2024-03-20', plan: 'Pro', renewal_date: '2025-09-20',
    properties: 3, users: 10, bookings: 156, revenue: 450000, status: 'Active', avatar: 'PL',
    recent_activity: [
      { action: 'New review received (5 stars)', time: '30 mins ago', icon: 'star' as const, color: '#F59E0B' },
      { action: 'Booking #B2024-890 confirmed', time: '3 hours ago', icon: 'calendar' as const, color: '#3B82F6' },
    ] },
  { id: '4', company: 'Chitwan Safari Lodge', email: 'admin@chitwansafari.com', phone: '+977-56-4XXXXX',
    address: 'Sauraha, Chitwan', created_at: '2024-02-01', plan: 'Basic', renewal_date: '2025-08-01',
    properties: 1, users: 3, bookings: 28, revenue: 65000, status: 'Suspended', avatar: 'CS',
    recent_activity: [
      { action: 'Account suspended due to payment failure', time: '3 days ago', icon: 'warning.triangle' as const, color: '#EF4444' },
    ] },
];

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenant = MOCK_TENANTS.find(t => t.id === id) || MOCK_TENANTS[0];
  const [isActive, setIsActive] = useState(tenant.status === 'Active');

  const handleSuspendToggle = () => {
    Alert.alert(
      isActive ? 'Suspend Tenant' : 'Activate Tenant',
      isActive ? `Are you sure you want to suspend ${tenant.company}?` : `Reactivate ${tenant.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Suspend' : 'Activate',
          style: isActive ? 'destructive' : 'default',
          onPress: () => { updateTenant(tenant.id, { is_active: !isActive }); setIsActive(!isActive); },
        },
      ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Tenant', `Permanently delete ${tenant.company}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTenantApi(tenant.id); router.back(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tenant Details</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: ACCENT + '15' }]}>
              <Text style={[styles.avatarText, { color: ACCENT }]}>{tenant.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{tenant.company}</Text>
              <StatusBadge status={isActive ? 'Active' : 'Suspended'} size="md" />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <IconSymbol name="chat" size={14} color="#94A3B8" />
              <Text style={styles.infoValue}>{tenant.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="phone" size={14} color="#94A3B8" />
              <Text style={styles.infoValue}>{tenant.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="home" size={14} color="#94A3B8" />
              <Text style={styles.infoValue}>{tenant.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="calendar" size={14} color="#94A3B8" />
              <Text style={styles.infoValue}>Since {tenant.created_at}</Text>
            </View>
          </View>
        </View>

        {/* Plan */}
        <AdminCard title="Subscription">
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <View style={[styles.planBadge, { backgroundColor: ACCENT + '12' }]}>
              <Text style={[styles.planValue, { color: ACCENT }]}>{tenant.plan}</Text>
            </View>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Renewal Date</Text>
            <Text style={styles.planDate}>{tenant.renewal_date}</Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.7}>
            <IconSymbol name="arrow.upward" size={16} color="#FFF" />
            <Text style={styles.upgradeText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </AdminCard>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Properties" value={tenant.properties} color="#3B82F6" icon="home" />
          <StatCard label="Users" value={tenant.users} color="#10B981" icon="person" />
          <StatCard label="Bookings" value={tenant.bookings} color="#F59E0B" icon="calendar" />
          <StatCard label="Revenue" value={`NPR ${(tenant.revenue / 1000).toFixed(0)}K`} color={ACCENT} icon="payment" />
        </View>

        {/* Actions */}
        <AdminCard title="Actions">
          <TouchableOpacity
            onPress={handleSuspendToggle}
            style={[styles.actionBtn, { backgroundColor: isActive ? '#FEF2F2' : '#F0FDF4' }]}
            activeOpacity={0.7}
          >
            <IconSymbol name={isActive ? 'close' : 'check'} size={18} color={isActive ? '#EF4444' : '#10B981'} />
            <Text style={[styles.actionText, { color: isActive ? '#EF4444' : '#10B981' }]}>
              {isActive ? 'Suspend Tenant' : 'Activate Tenant'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, styles.deleteBtn]} activeOpacity={0.7}>
            <IconSymbol name="delete" size={18} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete Tenant</Text>
          </TouchableOpacity>
        </AdminCard>

        {/* Recent Activity */}
        <AdminCard title="Recent Activity">
          {tenant.recent_activity.map((act, i) => (
            <View key={i} style={[styles.activityRow, i < tenant.recent_activity.length - 1 && styles.activityBorder]}>
              <View style={[styles.activityIcon, { backgroundColor: act.color + '12' }]}>
                <IconSymbol name={act.icon} size={14} color={act.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityAction}>{act.action}</Text>
                <Text style={styles.activityTime}>{act.time}</Text>
              </View>
            </View>
          ))}
        </AdminCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  profileCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  companyName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  infoGrid: { gap: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { fontSize: 14, color: '#64748B', flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  planLabel: { fontSize: 14, color: '#64748B' },
  planBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  planValue: { fontSize: 14, fontWeight: '700' },
  planDate: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ACCENT,
  },
  upgradeText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  deleteBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionText: { fontSize: 15, fontWeight: '700' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityAction: { fontSize: 14, color: '#0F172A', lineHeight: 20 },
  activityTime: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
});
