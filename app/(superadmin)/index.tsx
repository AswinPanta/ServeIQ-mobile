import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const KPI_CARDS = [
  { label: 'Total Tenants', value: '24', change: '+3', icon: 'group' as const, color: SUPERADMIN },
  { label: 'Active Properties', value: '89', change: '+12', icon: 'hotel' as const, color: '#3B82F6' },
  { label: 'Total Users', value: '12.4K', change: '+8%', icon: 'person.fill' as const, color: '#10B981' },
  { label: 'MRR', value: 'NPR 4.8M', change: '+15%', icon: 'payment' as const, color: '#F59E0B' },
];

const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 3.2, mrr: 2.1 },
  { month: 'Feb', revenue: 3.8, mrr: 2.3 },
  { month: 'Mar', revenue: 3.5, mrr: 2.4 },
  { month: 'Apr', revenue: 4.2, mrr: 2.6 },
  { month: 'May', revenue: 4.5, mrr: 2.8 },
  { month: 'Jun', revenue: 4.8, mrr: 3.0 },
];

const TENANTS_PREVIEW = [
  { name: 'Himalayan Heights Hotels', plan: 'Enterprise', status: 'Active', arr: 'NPR 14.4L' },
  { name: 'Pokhara Lake Resort', plan: 'Pro', status: 'Active', arr: 'NPR 9.0L' },
  { name: 'Everest Base Camp Lodges', plan: 'Enterprise', status: 'Active', arr: 'NPR 14.4L' },
  { name: 'Chitwan Safari Lodge', plan: 'Basic', status: 'Suspended', arr: 'NPR 0' },
  { name: 'Buddha B&B Chain', plan: 'Basic', status: 'Active', arr: 'NPR 3.0L' },
];

const OPEN_TICKETS = [
  { subject: 'Payment gateway failing on checkout', tenant: 'Himalayan Heights Hotels', priority: 'Urgent', priorityColor: '#EF4444' },
  { subject: 'Seasonal pricing setup help', tenant: 'Buddha B&B Chain', priority: 'Medium', priorityColor: '#3B82F6' },
  { subject: 'Trial period extension request', tenant: 'Mountain View Inn', priority: 'Low', priorityColor: '#6B7280' },
  { subject: 'Billing address not saving', tenant: 'Chitwan Safari Lodge', priority: 'Urgent', priorityColor: '#EF4444' },
];

const MODULES = [
  { title: 'Tenants', icon: 'group' as const, color: SUPERADMIN, items: ['All Tenants', 'Tenant Detail'] },
  { title: 'Commerce', icon: 'payment' as const, color: '#3B82F6', items: ['Subscriptions', 'Billing', 'Payment Gateways'] },
  { title: 'Platform', icon: 'settings' as const, color: '#10B981', items: ['Feature Flags', 'Analytics', 'Reports', 'Exports'] },
  { title: 'Support', icon: 'chat' as const, color: '#F59E0B', items: ['Tickets', 'Announcements'] },
  { title: 'System', icon: 'kds' as const, color: '#EF4444', items: ['Health', 'Audit Logs', 'Impersonate'] },
  { title: 'Admin', icon: 'manager' as const, color: '#EC4899', items: ['Roles', 'Settings'] },
];

const SYSTEM_METRICS = [
  { label: 'API Response', value: '142ms', ok: true, icon: 'analytics' as const },
  { label: 'DB Queries/s', value: '2,847', ok: true, icon: 'analytics' as const },
  { label: 'Active Sessions', value: '1,293', ok: true, icon: 'person.fill' as const },
  { label: 'Disk Usage', value: '67%', ok: false, icon: 'inventory' as const },
];

const PLANS = [
  { name: 'Enterprise', value: 4, color: SUPERADMIN },
  { name: 'Pro', value: 8, color: '#3B82F6' },
  { name: 'Basic', value: 8, color: '#10B981' },
  { name: 'Trial', value: 4, color: '#F59E0B' },
];

const maxRevenue = Math.max(...MONTHLY_REVENUE.map(d => d.revenue));

const moduleRoutes: Record<string, string> = {
  'All Tenants': '/(superadmin)/tenants',
  'Tenant Detail': '/(superadmin)/tenants/1',
  'Subscriptions': '/(superadmin)/commerce/subscriptions',
  'Billing': '/(superadmin)/commerce/billing',
  'Payment Gateways': '/(superadmin)/commerce/payment-gateway',
  'Feature Flags': '/(superadmin)/platform/feature-flags',
  'Analytics': '/(superadmin)/platform/analytics',
  'Reports': '/(superadmin)/platform/reports',
  'Exports': '/(superadmin)/platform/exports',
  'Tickets': '/(superadmin)/support/tickets',
  'Announcements': '/(superadmin)/support/announcements',
  'Health': '/(superadmin)/system/health',
  'Audit Logs': '/(superadmin)/system/audit-logs',
  'Impersonate': '/(superadmin)/system/impersonate',
  'Roles': '/(superadmin)/admin/roles',
  'Settings': '/(superadmin)/admin/settings',
};

function $item(route: string) {
  return router.push(moduleRoutes[route] as any);
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.brandBadge}>
              <IconSymbol name="manager" size={22} color={SUPERADMIN} />
            </View>
            <View>
              <Text style={s.headerTitle}>Platform Overview</Text>
              <Text style={s.headerSub}>Welcome back, {user?.name || 'Admin'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.replace('/')} style={s.switchBtn}>
            <Text style={s.switchBtnText}>Switch</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Cards */}
        <View style={s.kpiRow}>
          {KPI_CARDS.map((kpi) => (
            <View key={kpi.label} style={[s.kpiCard, { borderLeftColor: kpi.color }]}>
              <View style={s.kpiTop}>
                <IconSymbol name={kpi.icon} size={22} color={kpi.color} />
                <View style={[s.kpiChange, { backgroundColor: '#10B981' + '15' }]}>
                  <Text style={s.kpiChangeText}>{kpi.change}</Text>
                </View>
              </View>
              <Text style={s.kpiValue}>{kpi.value}</Text>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Revenue Trend</Text>
            <Text style={s.sectionSub}>Total Revenue vs MRR</Text>
          </View>
          <View style={s.card}>
            <View style={s.chartRow}>
              {MONTHLY_REVENUE.map((d) => (
                <View key={d.month} style={s.chartCol}>
                  <Text style={s.chartVal}>{d.revenue.toFixed(1)}</Text>
                  <View style={[s.chartBar, { height: (d.revenue / maxRevenue) * 120, backgroundColor: SUPERADMIN }]} />
                  <View style={[s.chartBar, { height: (d.mrr / maxRevenue) * 120, backgroundColor: '#2E86AB', opacity: 0.6 }]} />
                  <Text style={s.chartLabel}>{d.month}</Text>
                </View>
              ))}
            </View>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: SUPERADMIN }]} />
                <Text style={s.legendText}>Revenue</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#2E86AB', opacity: 0.6 }]} />
                <Text style={s.legendText}>MRR</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tenants by Plan */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tenants by Plan</Text>
          <View style={s.card}>
            {PLANS.map((plan) => (
              <View key={plan.name} style={s.planRow}>
                <View style={[s.planDot, { backgroundColor: plan.color }]} />
                <Text style={s.planName}>{plan.name}</Text>
                <View style={s.planBarBg}>
                  <View style={[s.planBar, { width: `${(plan.value / 24) * 100}%`, backgroundColor: plan.color }]} />
                </View>
                <Text style={s.planValue}>{plan.value}</Text>
              </View>
            ))}
            <Text style={s.planTotal}>24 total tenants</Text>
          </View>
        </View>

        {/* Recent Tenants */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Tenants</Text>
            <TouchableOpacity onPress={() => router.push('/(superadmin)/tenants')}>
              <Text style={[s.linkText, { color: SUPERADMIN }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {TENANTS_PREVIEW.map((t) => (
            <View key={t.name} style={s.tenantCard}>
              <View style={[s.tenantAvatar, { backgroundColor: SUPERADMIN + '15' }]}>
                <Text style={[s.tenantAvatarText, { color: SUPERADMIN }]}>{t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
              </View>
              <View style={s.tenantInfo}>
                <Text style={s.tenantName}>{t.name}</Text>
                <Text style={s.tenantMeta}>{t.plan} · {t.arr}</Text>
              </View>
              <View style={[s.tenantStatus, { backgroundColor: (t.status === 'Active' ? '#10B981' : '#EF4444') + '15' }]}>
                <Text style={[s.tenantStatusText, { color: t.status === 'Active' ? '#10B981' : '#EF4444' }]}>{t.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Open Tickets */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Open Tickets</Text>
            <TouchableOpacity onPress={() => router.push('/(superadmin)/support/tickets')}>
              <Text style={[s.linkText, { color: SUPERADMIN }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {OPEN_TICKETS.map((t) => (
            <View key={t.subject} style={[s.ticketCard, { borderLeftColor: t.priorityColor }]}>
              <View style={s.ticketInfo}>
                <View style={s.ticketTop}>
                  <Text style={s.ticketSubject} numberOfLines={1}>{t.subject}</Text>
                  <View style={[s.ticketPriority, { backgroundColor: t.priorityColor + '15' }]}>
                    <Text style={[s.ticketPriorityText, { color: t.priorityColor }]}>{t.priority}</Text>
                  </View>
                </View>
                <Text style={s.ticketTenant}>{t.tenant}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* System Health */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>System Health</Text>
          <View style={s.metricsRow}>
            {SYSTEM_METRICS.map((m) => (
              <View key={m.label} style={s.metricCard}>
                <View style={s.metricTop}>
                  <IconSymbol name={m.icon} size={18} color={m.ok ? '#10B981' : '#F59E0B'} />
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
                <View style={s.metricBottom}>
                  <Text style={s.metricValue}>{m.value}</Text>
                  <View style={[s.metricDot, { backgroundColor: m.ok ? '#10B981' : '#F59E0B' }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Module Navigation */}
        <View style={s.modulesSection}>
          {MODULES.map((mod) => (
            <View key={mod.title} style={s.moduleGroup}>
              <View style={s.moduleTitleRow}>
                <IconSymbol name={mod.icon} size={18} color={mod.color} />
                <Text style={s.moduleTitle}>{mod.title}</Text>
              </View>
              <View style={s.moduleItems}>
                {mod.items.map((item) => (
                  <TouchableOpacity key={item} onPress={() => $item(item)}
                    style={[s.moduleBtn, { backgroundColor: mod.color + '10', borderColor: mod.color + '20' }]}
                    activeOpacity={0.7}>
                    <Text style={[s.moduleBtnText, { color: mod.color }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
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
  scroll: { paddingBottom: 32 },

  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: SUPERADMIN + '18', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  headerSub: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 2 },
  switchBtn: { paddingHorizontal: 12, paddingVertical: 14, borderRadius: 10, backgroundColor: GRAY[100] },
  switchBtnText: { ...TYPOGRAPHY.small, fontWeight: '600', color: GRAY[500] },

  kpiRow: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: '47%', padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  kpiChange: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kpiChangeText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: '#10B981' },
  kpiValue: { ...TYPOGRAPHY.h2, color: SRS.navy },
  kpiLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 2 },

  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  sectionSub: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  linkText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  card: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartVal: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 4 },
  chartBar: { width: '35%', borderRadius: 4, marginTop: 2 },
  chartLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: GRAY[100] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  planDot: { width: 12, height: 12, borderRadius: 4 },
  planName: { ...TYPOGRAPHY.body, color: SRS.navy, flex: 1 },
  planBarBg: { flex: 2, height: 8, borderRadius: 4, backgroundColor: GRAY[100] },
  planBar: { height: 8, borderRadius: 4 },
  planValue: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, width: 24, textAlign: 'right' },
  planTotal: { ...TYPOGRAPHY.caption, color: GRAY[500], textAlign: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: GRAY[100] },

  tenantCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', marginBottom: 8, ...SHADOWS.card },
  tenantAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tenantAvatarText: { ...TYPOGRAPHY.body, fontWeight: '700' },
  tenantInfo: { flex: 1, marginLeft: 12 },
  tenantName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  tenantMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  tenantStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tenantStatusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },

  ticketCard: { padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', marginBottom: 8, borderLeftWidth: 4, ...SHADOWS.card },
  ticketInfo: { flex: 1 },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ticketSubject: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy, flex: 1 },
  ticketPriority: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  ticketPriorityText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  ticketTenant: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 16, backgroundColor: '#FFF', ...SHADOWS.card },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metricLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  metricBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricValue: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  metricDot: { width: 12, height: 12, borderRadius: 6 },

  modulesSection: { paddingHorizontal: SPACING.xl },
  moduleGroup: { marginBottom: 20 },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  moduleTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  moduleItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moduleBtn: { paddingHorizontal: SPACING.lg, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  moduleBtnText: { ...TYPOGRAPHY.body, fontWeight: '700' },
});
