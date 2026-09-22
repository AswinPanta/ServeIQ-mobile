import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property, StaffMember } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { GRAY, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '@/constants/portal-theme';
import { STATUS, BG, BLUE, PURPLE, AMBER, ORANGE, RED } from '@/lib/constants/figma-tokens';

interface Props { property: Property }

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager', front_desk: 'Front Desk', housekeeping: 'Housekeeping',
  waiter: 'Waiter', kitchen: 'Kitchen', maintenance: 'Maintenance',
};

function getPerformanceColor(score: number): string {
  if (score >= 90) return '#10B981';
  if (score >= 80) return '#3B82F6';
  if (score >= 70) return '#F59E0B';
  return '#EF4444';
}

function getPerformanceStatus(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Average';
  return 'Needs Improvement';
}

export function StaffPerformanceView({ property }: Props) {
  const { getFilteredStaff } = useHost();
  const staff = getFilteredStaff(property.id);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);

  const performanceData = useMemo(() => {
    return staff.map(s => {
      const score = 70 + Math.floor(Math.random() * 28);
      const attendance = 75 + Math.floor(Math.random() * 25);
      const tasksCompleted = Math.floor(Math.random() * 50) + 20;
      return {
        ...s,
        score,
        attendance: `${attendance}%`,
        tasksCompleted,
        status: getPerformanceStatus(score),
        statusColor: getPerformanceColor(score),
      };
    });
  }, [staff.length]);

  const filteredData = useMemo(() => {
    let data = performanceData;
    if (search) data = data.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter) data = data.filter(s => s.role === roleFilter);
    return data;
  }, [performanceData, search, roleFilter]);

  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(s => s.is_active).length;
    const avgScore = performanceData.length > 0
      ? Math.round(performanceData.reduce((a, b) => a + b.score, 0) / performanceData.length)
      : 0;
    const totalTasks = performanceData.reduce((a, b) => a + b.tasksCompleted, 0);
    const lateArrivals = Math.floor(Math.random() * 8);
    return { total, active, avgScore, totalTasks, lateArrivals };
  }, [staff.length, performanceData]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {[
          { icon: 'people', label: 'Total Staff', value: stats.total.toString(), sub: 'All departments', color: BLUE[500], bg: BLUE[500] + '15' },
          { icon: 'checkmark-circle', label: 'Active Staff', value: stats.active.toString(), sub: `${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% of total`, color: '#10B981', bg: '#D1FAE5' },
          { icon: 'trending-up', label: 'Avg Performance', value: `${stats.avgScore}%`, sub: 'This period', color: PURPLE[500], bg: PURPLE[500] + '15' },
          { icon: 'clipboard-check', label: 'Tasks Done', value: stats.totalTasks.toString(), sub: 'This month', color: AMBER[500], bg: AMBER[500] + '15' },
          { icon: 'time', label: 'Late Arrivals', value: stats.lateArrivals.toString(), sub: 'This week', color: RED[500], bg: RED[500] + '15' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, SHADOWS.card]}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Staff Performance Table */}
      <View style={[styles.tableCard, SHADOWS.card]}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Staff Performance</Text>
          <View style={styles.tableFilters}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={14} color={GRAY[400]} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name..."
                placeholderTextColor={GRAY[400]}
                style={styles.searchInput}
              />
            </View>
            <View>
              <TouchableOpacity
                onPress={() => setShowRolePicker(!showRolePicker)}
                style={styles.roleFilterBtn}
              >
                <Text style={styles.roleFilterText}>{roleFilter ? ROLE_LABELS[roleFilter] || roleFilter : 'Role'}</Text>
                <Ionicons name="chevron-down" size={12} color={GRAY[400]} />
              </TouchableOpacity>
              {showRolePicker && (
                <View style={styles.roleDropdown}>
                  <TouchableOpacity onPress={() => { setRoleFilter(''); setShowRolePicker(false); }} style={styles.roleDropdownItem}>
                    <Text style={styles.roleDropdownText}>All Roles</Text>
                  </TouchableOpacity>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => { setRoleFilter(key); setShowRolePicker(false); }}
                      style={[styles.roleDropdownItem, roleFilter === key && styles.roleDropdownActive]}
                    >
                      <Text style={[styles.roleDropdownText, roleFilter === key && styles.roleDropdownTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableRowHeader]}>
          <Text style={[styles.tableCell, styles.tableCellName]}>STAFF MEMBER</Text>
          <Text style={[styles.tableCell, styles.tableCellSmall]}>DEPT</Text>
          <Text style={[styles.tableCell, styles.tableCellSmall]}>ATTENDANCE</Text>
          <Text style={[styles.tableCell, styles.tableCellNum]}>TASKS</Text>
          <Text style={[styles.tableCell, styles.tableCellNum]}>SCORE</Text>
          <Text style={[styles.tableCell, styles.tableCellSmall]}>STATUS</Text>
        </View>

        {filteredData.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={40} color={GRAY[300]} />
            <Text style={{ marginTop: 10, fontSize: 14, color: GRAY[400] }}>No staff found</Text>
          </View>
        ) : (
          filteredData.map((s, idx) => (
            <View key={s.id} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor: '#FAFBFC' }]}>
              <View style={[styles.tableCellLayout, styles.tableCellName]}>
                <View style={styles.staffInfo}>
                  <View style={[styles.miniAvatar, { backgroundColor: getPerformanceColor(s.score) + '20' }]}>
                    <Text style={[styles.miniAvatarText, { color: getPerformanceColor(s.score) }]}>{s.first_name?.[0] || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.staffName}>{s.first_name} {s.last_name}</Text>
                    <Text style={styles.staffRole}>{ROLE_LABELS[s.role] || s.role}</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.tableCell, styles.tableCellSmall]}>{ROLE_LABELS[s.role] || s.role}</Text>
              <Text style={[styles.tableCell, styles.tableCellSmall]}>{s.attendance}</Text>
              <Text style={[styles.tableCell, styles.tableCellNum, { textAlign: 'center' }]}>{s.tasksCompleted}</Text>
              <View style={[styles.tableCellLayout, styles.tableCellNum]}>
                <Text style={[styles.scoreText, { color: getPerformanceColor(s.score) }]}>{s.score}%</Text>
              </View>
              <View style={[styles.tableCellLayout, styles.tableCellSmall]}>
                <View style={[styles.perfBadge, { backgroundColor: s.statusColor + '18' }]}>
                  <Text style={[styles.perfBadgeText, { color: s.statusColor }]}>{s.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '30%', backgroundColor: BG.white, borderRadius: RADIUS.card + 6,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: GRAY[900] },
  statLabel: { fontSize: 12, fontWeight: '500', color: GRAY[500], marginTop: 2 },
  statSub: { fontSize: 11, color: GRAY[400], marginTop: 1 },

  tableCard: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, borderWidth: 1, borderColor: GRAY[200], overflow: 'hidden' },
  tableHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  tableTitle: { fontSize: 16, fontWeight: '700', color: GRAY[900], marginBottom: 12 },
  tableFilters: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: GRAY[200],
    borderRadius: RADIUS.input, paddingHorizontal: 10, paddingVertical: 8, flex: 1, minWidth: 150,
  },
  searchInput: { flex: 1, fontSize: 13, color: GRAY[800], padding: 0 },
  roleFilterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: GRAY[200],
    borderRadius: RADIUS.input, paddingHorizontal: 10, paddingVertical: 8, minWidth: 100,
  },
  roleFilterText: { fontSize: 13, color: GRAY[600], fontWeight: '500' },
  roleDropdown: {
    position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
    backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200],
    minWidth: 140, ...SHADOWS.card,
  },
  roleDropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
  roleDropdownActive: { backgroundColor: BLUE.tint },
  roleDropdownText: { fontSize: 13, color: GRAY[700] },
  roleDropdownTextActive: { fontWeight: '700', color: BLUE[600] },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: GRAY[50] },
  tableRowHeader: { backgroundColor: GRAY[50] },
  tableCell: { fontSize: 12, color: GRAY[500] },
  tableCellLayout: { flex: 1 },
  tableCellName: { flex: 2.5 },
  tableCellSmall: { flex: 1 },
  tableCellNum: { flex: 0.8, alignItems: 'center' },

  staffInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 13, fontWeight: '700' },
  staffName: { fontSize: 13, fontWeight: '600', color: GRAY[800] },
  staffRole: { fontSize: 11, color: GRAY[400] },

  scoreText: { fontSize: 14, fontWeight: '700' },
  perfBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  perfBadgeText: { fontSize: 11, fontWeight: '600' },
});
