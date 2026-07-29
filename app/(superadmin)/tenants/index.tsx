import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getTenants } from '@/lib/api';
import { FilterChips } from '@/components/superadmin/FilterChips';
import { StatusBadge } from '@/components/superadmin/StatusBadge';
import { EmptyState } from '@/components/superadmin/EmptyState';

const ACCENT = '#7C3AED';
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

const PLAN_COLORS: Record<string, string> = {
  Enterprise: '#7C3AED',
  Pro: '#3B82F6',
  Basic: '#10B981',
  Trial: '#F59E0B',
};

export default function TenantsScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [tenants, setTenants] = useState(TENANTS_DATA);

  useEffect(() => {
    getTenants().then(data => { if (data.length > 0) setTenants(data); });
  }, []);

  const filtered = tenants.filter(t => {
    const matchSearch = t.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || t.status === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tenants</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <IconSymbol name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search tenants..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <IconSymbol name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <FilterChips filters={FILTERS} active={activeFilter} onChange={setActiveFilter} />

        {/* Tenant List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="group"
            title="No tenants found"
            message="Try adjusting your search or filter criteria."
          />
        ) : (
          filtered.map(tenant => (
            <TouchableOpacity
              key={tenant.id}
              onPress={() => router.push(`/(superadmin)/tenants/${tenant.id}`)}
              style={styles.card}
              activeOpacity={0.7}
            >
              {/* Top row: avatar + info + status */}
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: (PLAN_COLORS[tenant.plan] || ACCENT) + '15' }]}>
                  <Text style={[styles.avatarText, { color: PLAN_COLORS[tenant.plan] || ACCENT }]}>{tenant.avatar}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{tenant.company}</Text>
                  <View style={styles.planRow}>
                    <View style={[styles.planDot, { backgroundColor: PLAN_COLORS[tenant.plan] || ACCENT }]} />
                    <Text style={styles.planText}>{tenant.plan}</Text>
                  </View>
                </View>
                <StatusBadge status={tenant.status} />
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <IconSymbol name="home" size={12} color="#94A3B8" />
                  <Text style={styles.statValue}>{tenant.properties}</Text>
                  <Text style={styles.statLabel}>properties</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <IconSymbol name="guest" size={12} color="#94A3B8" />
                  <Text style={styles.statValue}>{tenant.users}</Text>
                  <Text style={styles.statLabel}>users</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: ACCENT }]}>
                    {tenant.mrr > 0 ? `NPR ${(tenant.mrr / 1000).toFixed(0)}K` : 'Free'}
                  </Text>
                </View>
              </View>

              {/* Chevron */}
              <IconSymbol name="arrow.forward" size={14} color="#CBD5E1" style={styles.chevron} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, flex: 1 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: ACCENT + '12' },
  countText: { fontSize: 14, fontWeight: '700', color: ACCENT },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  planDot: { width: 6, height: 6, borderRadius: 3 },
  planText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#94A3B8' },
  statDivider: { width: 1, height: 16, backgroundColor: '#E2E8F0' },
  chevron: { position: 'absolute', right: 16, top: 20 },
});
