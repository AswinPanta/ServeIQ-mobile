import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { PURPLE, STATUS, BLUE, RED, SLATE, BG } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];
const ACTION_TYPES = ['Create', 'Update', 'Delete', 'Login'];

const LOG_ENTRIES = [
  { id: '1', user: 'superadmin@serveiq.com', action: 'Create', resource: 'Tenant', resourceId: 'TNT-008', ip: '192.168.1.100', timestamp: '2025-06-30 14:23:10', color: STATUS.activeGreen },
  { id: '2', user: 'superadmin@serveiq.com', action: 'Update', resource: 'Subscription', resourceId: 'SUB-045', ip: '192.168.1.100', timestamp: '2025-06-30 13:45:33', color: BLUE[500] },
  { id: '3', user: 'admin@himalayanheights.com', action: 'Login', resource: 'Session', resourceId: '—', ip: '203.45.67.89', timestamp: '2025-06-30 12:10:05', color: ACCENT },
  { id: '4', user: 'superadmin@serveiq.com', action: 'Delete', resource: 'User', resourceId: 'USR-023', ip: '192.168.1.100', timestamp: '2025-06-30 11:30:22', color: RED[500] },
  { id: '5', user: 'manager@pokharalake.com', action: 'Update', resource: 'Property', resourceId: 'PRP-012', ip: '103.56.78.90', timestamp: '2025-06-30 10:15:44', color: BLUE[500] },
  { id: '6', user: 'superadmin@serveiq.com', action: 'Create', resource: 'FeatureFlag', resourceId: 'FF-006', ip: '192.168.1.100', timestamp: '2025-06-29 16:50:12', color: STATUS.activeGreen },
  { id: '7', user: 'admin@everestlodges.com', action: 'Login', resource: 'Session', resourceId: '—', ip: '45.67.89.12', timestamp: '2025-06-29 15:20:38', color: ACCENT },
  { id: '8', user: 'superadmin@serveiq.com', action: 'Update', resource: 'Plan', resourceId: 'PLN-003', ip: '192.168.1.100', timestamp: '2025-06-29 14:05:17', color: BLUE[500] },
  { id: '9', user: 'support@serveiq.com', action: 'Update', resource: 'Ticket', resourceId: 'TKT-1234', ip: '192.168.1.101', timestamp: '2025-06-29 11:30:00', color: BLUE[500] },
  { id: '10', user: 'admin@lumbinigarden.com', action: 'Create', resource: 'Booking', resourceId: 'BKG-567', ip: '78.90.12.34', timestamp: '2025-06-29 10:00:00', color: STATUS.activeGreen },
];

const ACTION_COLORS: Record<string, string> = { Create: STATUS.activeGreen, Update: BLUE[500], Delete: RED[500], Login: ACCENT };

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Audit Logs</Text>
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={SLATE[400]} />
          <TextInput placeholder="Search by user email..." placeholderTextColor={SLATE[400]} value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            <TouchableOpacity onPress={() => setActionFilter(null)}
              style={[s.filterChip, !actionFilter && s.filterActive]}>
              <Text style={[s.filterText, !actionFilter && s.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {ACTION_TYPES.map(a => (
              <TouchableOpacity key={a} onPress={() => setActionFilter(actionFilter === a ? null : a)}
                style={[s.filterChip, actionFilter === a && { backgroundColor: ACTION_COLORS[a] }]}>
                <Text style={[s.filterText, actionFilter === a && { color: BG.white }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {paged.map(log => (
          <View key={log.id} style={[s.card, { borderLeftColor: log.color }]}>
            <View style={s.cardTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.actionBadge, { backgroundColor: log.color + '12' }]}>
                  <Text style={[s.actionText, { color: log.color }]}>{log.action}</Text>
                </View>
                <Text style={s.logMeta}>{log.resource}</Text>
              </View>
              <Text style={s.logMeta}>{log.timestamp}</Text>
            </View>
            <View style={s.logBottom}>
              <Text style={s.logUser}>{log.user}</Text>
              <Text style={s.logMeta}>ID: {log.resourceId}</Text>
            </View>
            <Text style={s.logMeta}>IP: {log.ip}</Text>
          </View>
        ))}

        {hasMore && (
          <TouchableOpacity onPress={() => setPage(p => p + 1)} style={s.loadMore} activeOpacity={0.7}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>Load More ({filtered.length - paged.length} remaining)</Text>
          </TouchableOpacity>
        )}
        {!hasMore && filtered.length > 0 && (
          <Text style={{ fontSize: 13, color: SLATE[500], textAlign: 'center', marginTop: 12 }}>Showing all {filtered.length} entries</Text>
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
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BG.white, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: SLATE[200] },
  searchInput: { flex: 1, fontSize: 15, color: SLATE[900], padding: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: SLATE[100] },
  filterActive: { backgroundColor: ACCENT },
  filterText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  filterTextActive: { color: BG.white },
  card: { padding: 14, borderRadius: 14, backgroundColor: BG.white, borderLeftWidth: 4, borderWidth: 1, borderColor: SLATE[100] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  actionText: { fontSize: 11, fontWeight: '700' },
  logMeta: { fontSize: 12, color: SLATE[500] },
  logBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  logUser: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  loadMore: { paddingVertical: 14, borderRadius: 14, backgroundColor: ACCENT + '08', alignItems: 'center', borderWidth: 1, borderColor: ACCENT + '18' },
});
