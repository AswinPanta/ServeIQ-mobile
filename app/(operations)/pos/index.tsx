import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTableStore } from '@/stores/useTableStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuth } from '@/lib/context/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { SystemFlowBar } from '@/components/operations/SystemFlowBar';
import { useMemo, useEffect } from 'react';

const TBL_COLORS: Record<string, string> = {
  available: SRS.green,
  occupied: SRS.red,
  reserved: SRS.orange,
  cleaning: '#16A085',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Free',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
};

export default function POSScreen() {
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const setTablePropertyId = useTableStore((s) => s.setPropertyId);
  const setOrderPropertyId = useOrderStore((s) => s.setPropertyId);

  const tables = useTableStore((s) => s.tables);
  const sections = useTableStore((s) => s.sections);
  const tickets = useOrderStore((s) => s.tickets);
  const completedOrders = useOrderStore((s) => s.completedOrders);

  useEffect(() => {
    const pid = operator?.property_id || 'prop-1';
    setTablePropertyId(pid);
    setOrderPropertyId(pid);
  }, [operator?.property_id, setTablePropertyId, setOrderPropertyId]);

  const stats = useMemo(() => ({
    total: tables.length,
    free: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  }), [tables]);

  const pendingOrders = tickets.filter((t) => t.status !== 'ready').length;
  const readyOrders = tickets.filter((t) => t.status === 'ready').length;
  const todayRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const flowItems = [
    { label: 'Order', active: true, count: pendingOrders },
    { label: 'Kitchen', count: tickets.filter((t) => t.status === 'in_progress').length },
    { label: 'Ready', count: readyOrders },
    { label: 'Folio' },
    { label: 'Charge to Room' },
    { label: 'Room Service' },
  ];

  return (
    <View style={styles.container}>
      <SystemFlowBar items={flowItems} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Floor Plan</Text>
          <Text style={styles.headerSub}>Restaurant table overview</Text>
        </View>

        {/* Ready Orders Banner */}
        {readyOrders > 0 && (
          <TouchableOpacity
            onPress={() => {
              const firstReadyTicket = tickets.find((t) => t.status === 'ready');
              if (firstReadyTicket) {
                const readyTable = tables.find((t) => t.number === firstReadyTicket.table_number);
                if (readyTable) router.push(`/(operations)/pos/table/${readyTable.id}`);
              }
            }}
            style={styles.readyBanner}
          >
            <IconSymbol name="bell" size={18} color={SRS.orange} />
            <Text style={styles.readyBannerText}>{readyOrders} order(s) ready for pickup</Text>
            <Text style={styles.readyBannerAction}>View →</Text>
          </TouchableOpacity>
        )}

        {/* KPI Row */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, SHADOWS.card]}>
            <Text style={[styles.kpiValue, { color: GRAY[500] }]}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>Tables</Text>
          </View>
          <View style={[styles.kpiCard, SHADOWS.card]}>
            <Text style={[styles.kpiValue, { color: SRS.green }]}>{stats.free}</Text>
            <Text style={styles.kpiLabel}>Free</Text>
          </View>
          <View style={[styles.kpiCard, SHADOWS.card]}>
            <Text style={[styles.kpiValue, { color: SRS.red }]}>{stats.occupied}</Text>
            <Text style={styles.kpiLabel}>Occupied</Text>
          </View>
          <View style={[styles.kpiCard, SHADOWS.card]}>
            <View style={styles.kpiRevenueIcon}>
              <IconSymbol name="payment" size={14} color={SRS.teal} />
            </View>
            <Text style={[styles.kpiValue, { color: SRS.teal, fontSize: 14 }]}>₹{todayRevenue.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Revenue</Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section) => {
          const sectionTables = tables.filter((t) => t.section_id === section.id);
          const occupiedCount = sectionTables.filter((t) => t.status === 'occupied').length;
          return (
            <View key={section.id} style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.name}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{occupiedCount}/{sectionTables.length}</Text>
                </View>
              </View>
              <View style={styles.tableGrid}>
                {sectionTables.map((table) => {
                  const color = TBL_COLORS[table.status] || GRAY[400];
                  const elapsed = table.status === 'occupied' ? (table.elapsed_minutes || 0) : 0;
                  const is90plus = elapsed > 90;
                  const is120plus = elapsed > 120;
                  return (
                    <TouchableOpacity
                      key={table.id}
                      onPress={() => router.push(`/(operations)/pos/table/${table.id}`)}
                      style={[
                        styles.tableCard,
                        {
                          borderColor: is120plus ? SRS.red : is90plus ? SRS.orange : color + '35',
                          borderWidth: is120plus ? 2 : 1.5,
                        },
                        SHADOWS.card,
                      ]}
                      activeOpacity={0.7}
                    >
                      {is90plus && (
                        <View style={[styles.tableAlertDot, { backgroundColor: is120plus ? SRS.red : SRS.orange }]} />
                      )}
                      <Text style={styles.tableNumber}>{table.number}</Text>
                      <View style={styles.tableCapacity}>
                        <IconSymbol name="person.fill" size={10} color={GRAY[400]} />
                        <Text style={styles.tableCapacityText}> {table.capacity}</Text>
                      </View>
                      <View style={[styles.tableStatusDot, { backgroundColor: color }]} />
                      <Text style={[styles.tableStatusLabel, { color }]}>{STATUS_LABELS[table.status]}</Text>
                      {table.status === 'occupied' && table.elapsed_minutes !== undefined && (
                        <Text style={[
                          styles.tableTimer,
                          { color: is120plus ? SRS.red : is90plus ? SRS.orange : GRAY[400], fontWeight: is90plus ? '700' : '400' },
                        ]}>
                          {table.elapsed_minutes}m
                        </Text>
                      )}
                      {is120plus && (
                        <View style={[styles.tableTimeBadge, { backgroundColor: SRS.red + '15' }]}>
                          <Text style={[styles.tableTimeBadgeText, { color: SRS.red }]}>🔴 2h+</Text>
                        </View>
                      )}
                      {is90plus && !is120plus && (
                        <View style={[styles.tableTimeBadge, { backgroundColor: SRS.orange + '15' }]}>
                          <Text style={[styles.tableTimeBadgeText, { color: SRS.orange }]}>⚠️ 90+ min</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Summary Footer */}
        <View style={[styles.footer, { backgroundColor: SRS.teal + '08', borderColor: SRS.teal + '18' }]}>
          <Text style={styles.footerLabel}>ACTIVE ORDERS</Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{stats.occupied} tables · {pendingOrders} pending</Text>
            <Text style={[styles.footerRevenue, { color: SRS.teal }]}>₹{todayRevenue.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY[50],
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: SRS.navy,
  },
  headerSub: {
    ...TYPOGRAPHY.small,
    color: GRAY[500],
    marginTop: 2,
  },
  readyBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.card,
    backgroundColor: SRS.orange + '15',
    borderWidth: 1,
    borderColor: SRS.orange + '30',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  readyBannerText: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    color: SRS.navy,
    flex: 1,
  },
  readyBannerAction: {
    ...TYPOGRAPHY.caption,
    color: SRS.orange,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums' as any],
  },
  kpiLabel: {
    ...TYPOGRAPHY.caption,
    color: GRAY[500],
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  kpiRevenueIcon: {
    marginTop: 2,
    marginBottom: -2,
  },
  sectionBlock: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: SRS.navy,
    fontWeight: '700',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: SRS.teal + '12',
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADIUS.card,
  },
  sectionBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: SRS.teal,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  tableCard: {
    width: '30%',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  tableAlertDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: SRS.navy,
  },
  tableCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tableCapacityText: {
    ...TYPOGRAPHY.caption,
    color: GRAY[400],
  },
  tableStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: SPACING.sm,
  },
  tableStatusLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  tableTimer: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  tableTimeBadge: {
    marginTop: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.badge,
  },
  tableTimeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  footer: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    borderWidth: 1,
  },
  footerLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: GRAY[500],
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: SRS.navy,
  },
  footerRevenue: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '700',
  },
});
