import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';
const ACTION_TYPES = ['Create', 'Update', 'Delete', 'Login'];

const LOG_ENTRIES = [
  { id: '1', user: 'superadmin@stayeasy.com', action: 'Create', resource: 'Tenant', resourceId: 'TNT-008', ip: '192.168.1.100', timestamp: '2025-06-30 14:23:10', color: '#10B981' },
  { id: '2', user: 'superadmin@stayeasy.com', action: 'Update', resource: 'Subscription', resourceId: 'SUB-045', ip: '192.168.1.100', timestamp: '2025-06-30 13:45:33', color: '#3B82F6' },
  { id: '3', user: 'admin@himalayanheights.com', action: 'Login', resource: 'Session', resourceId: '—', ip: '203.45.67.89', timestamp: '2025-06-30 12:10:05', color: SUPERADMIN },
  { id: '4', user: 'superadmin@stayeasy.com', action: 'Delete', resource: 'User', resourceId: 'USR-023', ip: '192.168.1.100', timestamp: '2025-06-30 11:30:22', color: '#EF4444' },
  { id: '5', user: 'manager@pokharalake.com', action: 'Update', resource: 'Property', resourceId: 'PRP-012', ip: '103.56.78.90', timestamp: '2025-06-30 10:15:44', color: '#3B82F6' },
  { id: '6', user: 'superadmin@stayeasy.com', action: 'Create', resource: 'FeatureFlag', resourceId: 'FF-006', ip: '192.168.1.100', timestamp: '2025-06-29 16:50:12', color: '#10B981' },
  { id: '7', user: 'admin@everestlodges.com', action: 'Login', resource: 'Session', resourceId: '—', ip: '45.67.89.12', timestamp: '2025-06-29 15:20:38', color: SUPERADMIN },
  { id: '8', user: 'superadmin@stayeasy.com', action: 'Update', resource: 'Plan', resourceId: 'PLN-003', ip: '192.168.1.100', timestamp: '2025-06-29 14:05:17', color: '#3B82F6' },
  { id: '9', user: 'support@stayeasy.com', action: 'Update', resource: 'Ticket', resourceId: 'TKT-1234', ip: '192.168.1.101', timestamp: '2025-06-29 11:30:00', color: '#3B82F6' },
  { id: '10', user: 'admin@lumbinigarden.com', action: 'Create', resource: 'Booking', resourceId: 'BKG-567', ip: '78.90.12.34', timestamp: '2025-06-29 10:00:00', color: '#10B981' },
];

const ACTION_COLORS: Record<string, string> = { Create: '#10B981', Update: '#3B82F6', Delete: '#EF4444', Login: SUPERADMIN };

export default function AuditLogsScreen() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = LOG_ENTRIES.filter(log => {
    const matchUser = log.user.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchUser && matchAction;
  });
  const paged = filtered.slice(0, page * perPage);
  const hasMore = paged.length < filtered.length;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Audit Logs</Text>
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={GRAY[400]} />
          <TextInput placeholder="Search by user email..." placeholderTextColor={GRAY[400]} value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            <TouchableOpacity onPress={() => setActionFilter(null)} style={[s.filterChip, { backgroundColor: !actionFilter ? SUPERADMIN : GRAY[100] }]}>
              <Text style={[s.filterText, { color: !actionFilter ? '#FFF' : GRAY[500] }]}>All</Text>
            </TouchableOpacity>
            {ACTION_TYPES.map(a => (
              <TouchableOpacity key={a} onPress={() => setActionFilter(actionFilter === a ? null : a)}
                style={[s.filterChip, { backgroundColor: actionFilter === a ? ACTION_COLORS[a] : GRAY[100] }]}>
                <Text style={[s.filterText, { color: actionFilter === a ? '#FFF' : GRAY[500] }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {paged.map(log => (
          <View key={log.id} style={[s.logCard, { borderLeftColor: log.color }]}>
            <View style={s.logTop}>
              <View style={s.logMeta}>
                <View style={[s.actionBadge, { backgroundColor: log.color + '15' }]}>
                  <Text style={[s.actionText, { color: log.color }]}>{log.action}</Text>
                </View>
                <Text style={s.logResource}>{log.resource}</Text>
              </View>
              <Text style={s.logTimestamp}>{log.timestamp}</Text>
            </View>
            <View style={s.logBottom}>
              <Text style={s.logUser}>{log.user}</Text>
              <Text style={s.logId}>ID: {log.resourceId}</Text>
            </View>
            <Text style={s.logIp}>IP: {log.ip}</Text>
          </View>
        ))}

        {hasMore && (
          <TouchableOpacity onPress={() => setPage(p => p + 1)} style={s.loadMore} activeOpacity={0.7}>
            <Text style={[s.loadMoreText, { color: SUPERADMIN }]}>Load More ({filtered.length - paged.length} remaining)</Text>
          </TouchableOpacity>
        )}
        {!hasMore && filtered.length > 0 && (
          <Text style={s.allShown}>Showing all {filtered.length} entries</Text>
        )}
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
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GRAY[100], borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 15, color: SRS.navy, padding: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20 },
  filterText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  logCard: { padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', borderLeftWidth: 4 },
  logTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  actionText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  logResource: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  logTimestamp: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  logBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logUser: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  logId: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  logIp: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  loadMore: { marginTop: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: SUPERADMIN + '10', alignItems: 'center', borderWidth: 1, borderColor: SUPERADMIN + '20' },
  loadMoreText: { ...TYPOGRAPHY.body, fontWeight: '700' },
  allShown: { ...TYPOGRAPHY.body, color: GRAY[500], textAlign: 'center', marginTop: SPACING.lg },
});
