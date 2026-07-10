import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getTenants } from '@/lib/api';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';
const FILTERS = ['All', 'Active', 'Suspended', 'Trial'] as const;

const TENANTS_DATA = [
  { id: '1', company: 'Himalayan Heights Hotels', plan: 'Enterprise', status: 'Active', properties: 8, users: 24, mrr: 120000, avatar: 'HH' },
  { id: '2', company: 'Pokhara Lake Resort', plan: 'Pro', status: 'Active', properties: 3, users: 10, mrr: 75000, avatar: 'PL' },
  { id: '3', company: 'Buddha B&B Chain', plan: 'Basic', status: 'Active', properties: 2, users: 5, mrr: 25000, avatar: 'BB' },
  { id: '4', company: 'Chitwan Safari Lodge', plan: 'Basic', status: 'Suspended', properties: 1, users: 3, mrr: 0, avatar: 'CS' },
  { id: '5', company: 'Mountain View Inn', plan: 'Trial', status: 'Trial', properties: 1, users: 2, mrr: 0, avatar: 'MV' },
  { id: '6', company: 'Lumbini Garden Hotel', plan: 'Pro', status: 'Active', properties: 4, users: 14, mrr: 75000, avatar: 'LG' },
  { id: '7', company: 'Everest Base Camp Lodges', plan: 'Enterprise', status: 'Active', properties: 6, users: 18, mrr: 120000, avatar: 'EB' },
  { id: '8', company: 'Garden Retreat', plan: 'Trial', status: 'Trial', properties: 1, users: 1, mrr: 0, avatar: 'GR' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#10B98115', text: '#10B981' }, Suspended: { bg: '#EF444415', text: '#EF4444' }, Trial: { bg: '#F59E0B15', text: '#F59E0B' },
};

export default function TenantsScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [tenants, setTenants] = useState(TENANTS_DATA);

  useEffect(() => { getTenants().then(data => { if (data.length > 0) setTenants(data); }); }, []);

  const filtered = tenants.filter(t => {
    const matchSearch = t.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || t.status === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Tenants</Text>
            <Text style={s.headerCount}>{filtered.length} total</Text>
          </View>
        </View>

        <View style={s.searchBox}>
          <IconSymbol name="search" size={16} color={GRAY[400]} />
          <TextInput placeholder="Search tenants..." placeholderTextColor={GRAY[400]} value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} onPress={() => setActiveFilter(f)}
                style={[s.filterChip, { backgroundColor: activeFilter === f ? SUPERADMIN : GRAY[100] }]}>
                <Text style={[s.filterText, { color: activeFilter === f ? '#FFF' : GRAY[500] }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filtered.map(tenant => {
          const statusStyle = STATUS_STYLES[tenant.status];
          return (
            <TouchableOpacity key={tenant.id} onPress={() => router.push(`/(superadmin)/tenants/${tenant.id}`)}
              style={s.tenantCard} activeOpacity={0.7}>
              <View style={s.tenantHead}>
                <View style={[s.tenantAvatar, { backgroundColor: SUPERADMIN + '18' }]}>
                  <Text style={[s.avatarText, { color: SUPERADMIN }]}>{tenant.avatar}</Text>
                </View>
                <View style={s.tenantInfo}>
                  <Text style={s.tenantName}>{tenant.company}</Text>
                  <Text style={s.tenantPlan}>{tenant.plan}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[s.statusText, { color: statusStyle.text }]}>{tenant.status}</Text>
                </View>
              </View>
              <View style={s.statsRow}>
                <IconSymbol name="hotel" size={12} color={GRAY[400]} />
                <Text style={s.statValue}>{tenant.properties}</Text>
                <IconSymbol name="person.fill" size={12} color={GRAY[400]} />
                <Text style={s.statValue}>{tenant.users}</Text>
                <IconSymbol name="payment" size={12} color={SUPERADMIN} />
                <Text style={[s.statValue, { color: SUPERADMIN }]}>NPR {tenant.mrr.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  headerCount: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GRAY[100], borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 15, color: SRS.navy, padding: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20 },
  filterText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  tenantCard: { padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', ...SHADOWS.card },
  tenantHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tenantAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...TYPOGRAPHY.body, fontWeight: '700' },
  tenantInfo: { flex: 1 },
  tenantName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  tenantPlan: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statValue: { ...TYPOGRAPHY.caption, color: GRAY[500], marginRight: 12 },
});
