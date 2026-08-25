import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getTenantById, updateTenant, deleteTenantApi } from '@/lib/api';
import { AdminCard } from '@/components/superadmin/AdminCard';
import { StatCard } from '@/components/superadmin/StatCard';
import { StatusBadge } from '@/components/superadmin/StatusBadge';
import { PURPLE, BLUE, STATUS, AMBER, PINK, RED, SLATE, BG, GREEN, TEXT } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

const MOCK_TENANTS = [
  { id: '1', company: 'Himalayan Heights Hotels', email: 'info@himalayanheights.com', phone: '+977-1-4XXXXXX',
    address: 'Thamel, Kathmandu', created_at: '2024-01-15', plan: 'Enterprise', renewal_date: '2026-01-15',
    properties: 8, users: 24, bookings: 342, revenue: 980000, status: 'Active', avatar: 'HH',
    recent_activity: [
      { action: 'New booking created', time: '2 hours ago', icon: 'calendar' as const, color: BLUE[500] },
      { action: 'Payment of NPR 45,000 received', time: '5 hours ago', icon: 'payment' as const, color: STATUS.activeGreen },
      { action: 'Property "Deluxe Suite" added', time: '1 day ago', icon: 'home' as const, color: PURPLE[500] },
      { action: 'User "ram@hh.com" joined', time: '2 days ago', icon: 'guest' as const, color: AMBER[500] },
      { action: 'Subscription renewed to Enterprise', time: '5 days ago', icon: 'refresh' as const, color: PINK[500] },
    ] },
  { id: '2', company: 'Pokhara Lake Resort', email: 'hello@pokharalake.com', phone: '+977-61-4XXXXX',
    address: 'Lakeside, Pokhara', created_at: '2024-03-20', plan: 'Pro', renewal_date: '2025-09-20',
    properties: 3, users: 10, bookings: 156, revenue: 450000, status: 'Active', avatar: 'PL',
    recent_activity: [
      { action: 'New review received (5 stars)', time: '30 mins ago', icon: 'star' as const, color: AMBER[500] },
      { action: 'Booking #B2024-890 confirmed', time: '3 hours ago', icon: 'calendar' as const, color: BLUE[500] },
    ] },
  { id: '4', company: 'Chitwan Safari Lodge', email: 'admin@chitwansafari.com', phone: '+977-56-4XXXXX',
    address: 'Sauraha, Chitwan', created_at: '2024-02-01', plan: 'Basic', renewal_date: '2025-08-01',
    properties: 1, users: 3, bookings: 28, revenue: 65000, status: 'Suspended', avatar: 'CS',
    recent_activity: [
      { action: 'Account suspended due to payment failure', time: '3 days ago', icon: 'warning.triangle' as const, color: RED[500] },
    ] },
];

/** Map backend tenant response to the display shape the screen expects. */
function mapBackendTenant(raw: any) {
  return {
    id: raw.id,
    company: raw.name || raw.company || 'Unnamed tenant',
    email: raw.email || raw.owner_email || '—',
    phone: raw.phone || raw.phone_number || '—',
    address: raw.address || [raw.city, raw.country].filter(Boolean).join(', ') || '—',
    created_at: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '—',
    plan: raw.plan || raw.subscription_plan || 'Trial',
    renewal_date: raw.renewal_date || '—',
    properties: raw.properties_count ?? raw.properties ?? 0,
    users: raw.users_count ?? raw.users ?? 0,
    bookings: raw.bookings_count ?? raw.bookings ?? 0,
    revenue: raw.revenue ?? 0,
    status: raw.is_active === false ? 'Suspended' : (raw.status || 'Active'),
    avatar: raw.avatar || (raw.name || '?').slice(0, 2).toUpperCase(),
    recent_activity: raw.recent_activity ?? [
      { action: `Tenant "${raw.name || 'Property'}" created`, time: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : 'N/A', icon: 'home' as const, color: STATUS.activeGreen },
    ],
  };
}

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getTenantById(id || '');
      if (raw) {
        const mapped = mapBackendTenant(raw);
        setTenant(mapped);
        setIsActive(mapped.status === 'Active');
      } else {
        // Fallback to mock
        const mock = MOCK_TENANTS.find(t => t.id === id) || MOCK_TENANTS[0];
        setTenant(mock);
        setIsActive(mock.status === 'Active');
      }
    } catch {
      const mock = MOCK_TENANTS.find(t => t.id === id) || MOCK_TENANTS[0];
      setTenant(mock);
      setIsActive(mock.status === 'Active');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTenant(); }, [fetchTenant]);

  const handleSuspendToggle = () => {
    if (!tenant) return;
    Alert.alert(
      isActive ? 'Suspend Tenant' : 'Activate Tenant',
      isActive ? `Are you sure you want to suspend ${tenant.company}?` : `Reactivate ${tenant.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Suspend' : 'Activate',
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            const ok = await updateTenant(tenant.id, { is_active: !isActive });
            if (ok) {
              setIsActive(!isActive);
              setTenant((prev: any) => ({ ...prev, status: isActive ? 'Suspended' : 'Active' }));
            } else {
              Alert.alert('Error', 'Failed to update tenant status. The backend may not support this action yet.');
            }
          },
        },
      ]);
  };

  const handleDelete = () => {
    if (!tenant) return;
    Alert.alert('Delete Tenant', `Permanently delete ${tenant.company}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const ok = await deleteTenantApi(tenant.id);
          if (ok) {
            router.back();
          } else {
            Alert.alert('Error', 'Failed to delete tenant. The backend may not support this action yet.');
          }
        }
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading tenant…</Text>
        </View>
      </View>
    );
  }

  if (!tenant) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Tenant not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.upgradeBtn, { marginTop: 16 }]}>
            <Text style={styles.upgradeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
              <IconSymbol name="chat" size={14} color={SLATE[400]} />
              <Text style={styles.infoValue}>{tenant.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="phone" size={14} color={SLATE[400]} />
              <Text style={styles.infoValue}>{tenant.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="home" size={14} color={SLATE[400]} />
              <Text style={styles.infoValue}>{tenant.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol name="calendar" size={14} color={SLATE[400]} />
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
            <IconSymbol name="arrow.upward" size={16} color={BG.white} />
            <Text style={styles.upgradeText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </AdminCard>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Properties" value={tenant.properties} color={BLUE[500]} icon="home" />
          <StatCard label="Users" value={tenant.users} color={STATUS.activeGreen} icon="person" />
          <StatCard label="Bookings" value={tenant.bookings} color={AMBER[500]} icon="calendar" />
          <StatCard label="Revenue" value={`NPR ${(tenant.revenue / 1000).toFixed(0)}K`} color={ACCENT} icon="payment" />
        </View>

        {/* Actions */}
        <AdminCard title="Actions">
          <TouchableOpacity
            onPress={handleSuspendToggle}
            style={[styles.actionBtn, { backgroundColor: isActive ? RED[50] : GREEN[50] }]}
            activeOpacity={0.7}
          >
            <IconSymbol name={isActive ? 'close' : 'check'} size={18} color={isActive ? RED[500] : STATUS.activeGreen} />
            <Text style={[styles.actionText, { color: isActive ? RED[500] : STATUS.activeGreen }]}>
              {isActive ? 'Suspend Tenant' : 'Activate Tenant'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, styles.deleteBtn]} activeOpacity={0.7}>
            <IconSymbol name="delete" size={18} color={RED[500]} />
            <Text style={[styles.actionText, { color: RED[500] }]}>Delete Tenant</Text>
          </TouchableOpacity>
        </AdminCard>

        {/* Recent Activity */}
        <AdminCard title="Recent Activity">
          {tenant.recent_activity.map((act: any, i: number) => (
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
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 100 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: SLATE[500], fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  profileCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  companyName: { fontSize: 20, fontWeight: '800', color: SLATE[900], marginBottom: 6 },
  divider: { height: 1, backgroundColor: SLATE[100], marginVertical: 16 },
  infoGrid: { gap: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { fontSize: 14, color: SLATE[500], flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  planLabel: { fontSize: 14, color: SLATE[500] },
  planBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  planValue: { fontSize: 14, fontWeight: '700' },
  planDate: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
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
  upgradeText: { fontSize: 15, fontWeight: '700', color: BG.white },
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
  deleteBtn: { backgroundColor: RED[50], borderWidth: 1, borderColor: RED[200] },
  actionText: { fontSize: 15, fontWeight: '700' },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  activityIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityAction: { fontSize: 14, color: SLATE[900], lineHeight: 20 },
  activityTime: { fontSize: 12, color: SLATE[400], marginTop: 3 },
});
