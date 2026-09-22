import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Property, StaffMember } from '@/types/api';
import { useHost } from '@/lib/context/host-context';
import { GRAY, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '@/constants/portal-theme';
import { STATUS, BG, BLUE, PURPLE, AMBER, ORANGE, RED } from '@/lib/constants/figma-tokens';

interface Props { property: Property }

const DEPARTMENTS = ['All', 'Front Desk', 'Housekeeping', 'Kitchen', 'Maintenance'];
const SHIFT_TYPES = ['All', 'Morning', 'Afternoon', 'Night'];

const SHIFT_TIMES: Record<string, string> = {
  Morning: '6:00 AM – 2:00 PM',
  Afternoon: '2:00 PM – 10:00 PM',
  Night: '10:00 PM – 6:00 AM',
};

type CoverageStatus = 'Fully Staffed' | 'Slightly Low' | 'Critically Low';

function getStatusColor(status: CoverageStatus): string {
  if (status === 'Fully Staffed') return '#16A34A';
  if (status === 'Slightly Low') return '#F59E0B';
  return '#DC2626';
}

function getStatusBg(status: CoverageStatus): string {
  if (status === 'Fully Staffed') return '#DCFCE7';
  if (status === 'Slightly Low') return '#FEF3C7';
  return '#FEE2E2';
}

function computeCoverage(required: number, assigned: number): { coverage: number; status: CoverageStatus; missing: number | null } {
  if (required === 0) return { coverage: 100, status: 'Fully Staffed', missing: null };
  const coverage = Math.round((assigned / required) * 100);
  const missing = required - assigned;
  let status: CoverageStatus = 'Fully Staffed';
  if (coverage < 80) status = 'Critically Low';
  else if (coverage < 100) status = 'Slightly Low';
  return { coverage, status, missing: missing > 0 ? missing : null };
}

interface DayShift {
  id: string;
  department: string;
  shift: string;
  required: number;
  assigned: number;
}

function generateMockShifts(staff: StaffMember[]): DayShift[] {
  const roles = ['Front Desk', 'Housekeeping', 'Kitchen', 'Maintenance', 'Manager'];
  const shifts = ['Morning', 'Afternoon', 'Night'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const result: DayShift[] = [];
  let id = 0;
  for (const day of days) {
    for (const dept of roles) {
      for (const shift of shifts) {
        const assigned = Math.min(staff.length, Math.floor(Math.random() * 4) + 1);
        result.push({ id: `sc-${++id}`, department: dept, shift, required: assigned + Math.floor(Math.random() * 3) - 1, assigned });
      }
    }
  }
  return result;
}

export function ShiftCoverageView({ property }: Props) {
  const { getFilteredStaff } = useHost();
  const staff = getFilteredStaff(property.id);

  const [department, setDepartment] = useState('All');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedShift, setSelectedShift] = useState<{ shift: DayShift; day: string } | null>(null);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showShiftPicker, setShowShiftPicker] = useState(false);

  const allShifts = useMemo(() => generateMockShifts(staff), [staff.length]);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const filteredShifts = useMemo(() => {
    let filtered = allShifts;
    if (department !== 'All') filtered = filtered.filter(s => s.department === department);
    if (shiftFilter !== 'All') filtered = filtered.filter(s => s.shift === shiftFilter);
    return filtered;
  }, [allShifts, department, shiftFilter]);

  const groupedByDay = useMemo(() => {
    const groups: Record<string, DayShift[]> = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      groups[day] = filteredShifts.filter((_, i) => {
        const dayIndex = Math.floor(i / (DEPARTMENTS.length * SHIFT_TYPES.length));
        return days[dayIndex % 7] === day;
      });
    }
    return groups;
  }, [filteredShifts]);

  const stats = useMemo(() => {
    const total = staff.length;
    const scheduledToday = Math.min(total, Math.floor(Math.random() * total) + Math.ceil(total * 0.6));
    const understaffed = filteredShifts.filter(s => s.assigned < s.required).length;
    const avgCoverage = filteredShifts.length > 0
      ? Math.round(filteredShifts.reduce((acc, s) => acc + (s.required > 0 ? (s.assigned / s.required) * 100 : 100), 0) / filteredShifts.length)
      : 100;
    return { total, scheduledToday, understaffed, avgCoverage };
  }, [staff.length, filteredShifts]);

  const toggleDay = (day: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const formatDateRange = () => `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Staff', value: stats.total.toString(), sub: 'All depts', color: PURPLE[500], bg: PURPLE[500] + '15' },
          { label: 'Scheduled Today', value: stats.scheduledToday.toString(), sub: 'Employees', color: '#10B981', bg: '#D1FAE5' },
          { label: 'Understaffed', value: stats.understaffed.toString(), sub: 'Needs attention', color: '#F97316', bg: '#FFEDD5' },
          { label: 'Avg Coverage', value: `${stats.avgCoverage}%`, sub: 'This week', color: '#3B82F6', bg: '#DBEAFE' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, SHADOWS.card]}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <Ionicons name={i === 0 ? 'people' : i === 1 ? 'calendar' : i === 2 ? 'warning' : 'bar-chart'} size={18} color={stat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* Department Picker */}
        <View>
          <Text style={styles.filterLabel}>DEPARTMENT</Text>
          <TouchableOpacity
            onPress={() => { setShowDeptPicker(!showDeptPicker); setShowShiftPicker(false); }}
            style={styles.filterBtn}
          >
            <Text style={styles.filterBtnText}>{department === 'All' ? 'All Departments' : department}</Text>
            <Ionicons name="chevron-down" size={14} color={GRAY[400]} />
          </TouchableOpacity>
          {showDeptPicker && (
            <View style={styles.dropdown}>
              {DEPARTMENTS.map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => { setDepartment(d); setShowDeptPicker(false); }}
                  style={[styles.dropdownItem, department === d && styles.dropdownItemActive]}
                >
                  <Text style={[styles.dropdownText, department === d && styles.dropdownTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Week Navigation */}
        <View style={{ flex: 1 }}>
          <Text style={styles.filterLabel}>WEEK</Text>
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} hitSlop={6}>
              <Ionicons name="chevron-back" size={16} color={GRAY[500]} />
            </TouchableOpacity>
            <Ionicons name="calendar-outline" size={14} color={GRAY[400]} />
            <Text style={styles.weekText}>{formatDateRange()}</Text>
            <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)} hitSlop={6}>
              <Ionicons name="chevron-forward" size={16} color={GRAY[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Shift Picker */}
        <View>
          <Text style={styles.filterLabel}>SHIFT</Text>
          <TouchableOpacity
            onPress={() => { setShowShiftPicker(!showShiftPicker); setShowDeptPicker(false); }}
            style={styles.filterBtn}
          >
            <Text style={styles.filterBtnText}>{shiftFilter === 'All' ? 'All Shifts' : shiftFilter}</Text>
            <Ionicons name="chevron-down" size={14} color={GRAY[400]} />
          </TouchableOpacity>
          {showShiftPicker && (
            <View style={styles.dropdown}>
              {SHIFT_TYPES.map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => { setShiftFilter(s); setShowShiftPicker(false); }}
                  style={[styles.dropdownItem, shiftFilter === s && styles.dropdownItemActive]}
                >
                  <Text style={[styles.dropdownText, shiftFilter === s && styles.dropdownTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Shift Table */}
      <View style={[styles.tableCard, SHADOWS.card]}>
        <View style={styles.tableHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableTitle}>Shift Coverage List</Text>
            <Text style={styles.tableSubtitle}>{formatDateRange()}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} /><Text style={styles.legendText}>Fully Staffed</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>Slightly Low</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} /><Text style={styles.legendText}>Critically Low</Text></View>
          </View>
        </View>

        {Object.entries(groupedByDay).map(([day, shifts]) => {
          if (shifts.length === 0) return null;
          const isExpanded = expandedDays.has(day);
          return (
            <View key={day}>
              <TouchableOpacity onPress={() => toggleDay(day)} style={styles.dayRow}>
                <Text style={styles.dayText}>{day}</Text>
                <Ionicons name="chevron-down" size={16} color={GRAY[400]} style={{ transform: [{ rotate: isExpanded ? '0deg' : '-90deg' }] }} />
              </TouchableOpacity>
              {isExpanded && shifts.map((shift, idx) => {
                const { coverage, status, missing } = computeCoverage(shift.required, shift.assigned);
                return (
                  <View key={shift.id} style={[styles.shiftRow, idx % 2 === 0 && { backgroundColor: '#FAFBFC' }]}>
                    <View style={styles.shiftCell}><Text style={styles.shiftDept}>{shift.department}</Text></View>
                    <View style={styles.shiftCell}><Text style={styles.shiftText}>{shift.shift}</Text></View>
                    <View style={styles.shiftCellSmall}><Text style={styles.shiftText}>{SHIFT_TIMES[shift.shift]}</Text></View>
                    <View style={styles.shiftCellNum}><Text style={styles.shiftText}>{shift.required}</Text></View>
                    <View style={styles.shiftCellNum}><Text style={styles.shiftTextBold}>{shift.assigned}</Text></View>
                    <View style={styles.shiftCellNum}>
                      <View style={[styles.coverageBadge, { backgroundColor: getStatusBg(status) }]}>
                        <Text style={[styles.coverageText, { color: getStatusColor(status) }]}>{coverage}%</Text>
                      </View>
                    </View>
                    <View style={styles.shiftCellNum}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBg(status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
                      </View>
                    </View>
                    <View style={styles.shiftCellNum}>
                      <Text style={missing !== null ? styles.missingText : styles.shiftText}>{missing ?? '–'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedShift({ shift, day })}
                      style={styles.shiftCellNum}
                    >
                      <Text style={styles.viewDetailsBtn}>View</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Shift Detail Modal */}
      <Modal visible={!!selectedShift} transparent animationType="fade" onRequestClose={() => setSelectedShift(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, SHADOWS.card]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Shift Details</Text>
                <Text style={styles.modalSubtitle}>{selectedShift?.day}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedShift(null)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color={GRAY[500]} />
              </TouchableOpacity>
            </View>
            {selectedShift && (
              <View style={styles.modalBody}>
                <View style={styles.detailGrid}>
                  <DetailRow label="Department" value={selectedShift.shift.department} />
                  <DetailRow label="Shift" value={selectedShift.shift.shift} />
                  <DetailRow label="Time" value={SHIFT_TIMES[selectedShift.shift.shift]} />
                  <DetailRow label="Required" value={selectedShift.shift.required.toString()} />
                  <DetailRow label="Assigned" value={selectedShift.shift.assigned.toString()} />
                  <DetailRow label="Coverage" value={`${computeCoverage(selectedShift.shift.required, selectedShift.shift.assigned).coverage}%`} />
                </View>
                <View style={styles.detailGrid}>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Status</Text>
                    {(() => {
                      const { status } = computeCoverage(selectedShift.shift.required, selectedShift.shift.assigned);
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(status), alignSelf: 'flex-start' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Missing / Extra</Text>
                    <Text style={styles.detailValue}>
                      {computeCoverage(selectedShift.shift.required, selectedShift.shift.assigned).missing ?? '–'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            <TouchableOpacity onPress={() => setSelectedShift(null)} style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: BG.white, borderRadius: RADIUS.card + 6,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: GRAY[900] },
  statLabel: { fontSize: 12, fontWeight: '500', color: GRAY[500], marginTop: 2 },
  statSub: { fontSize: 11, color: GRAY[400], marginTop: 1 },

  filterRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  filterLabel: { fontSize: 10, fontWeight: '700', color: GRAY[400], letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: BG.white,
    borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200], minWidth: 140,
  },
  filterBtnText: { fontSize: 13, fontWeight: '500', color: GRAY[700] },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
    backgroundColor: BG.white, borderRadius: RADIUS.card, borderWidth: 1, borderColor: GRAY[200],
    minWidth: 160, ...SHADOWS.card,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
  dropdownItemActive: { backgroundColor: BLUE.tint },
  dropdownText: { fontSize: 13, color: GRAY[700] },
  dropdownTextActive: { fontWeight: '700', color: BLUE[600] },

  weekNav: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: BG.white, borderRadius: RADIUS.input, borderWidth: 1, borderColor: GRAY[200],
  },
  weekText: { fontSize: 13, fontWeight: '500', color: GRAY[700] },

  tableCard: { backgroundColor: BG.white, borderRadius: RADIUS.card + 6, borderWidth: 1, borderColor: GRAY[200], overflow: 'hidden' },
  tableHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: GRAY[100] },
  tableTitle: { fontSize: 16, fontWeight: '700', color: GRAY[900] },
  tableSubtitle: { fontSize: 12, color: GRAY[400], marginTop: 2 },
  legendRow: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: GRAY[400] },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: GRAY[50],
    borderBottomWidth: 1, borderBottomColor: GRAY[100],
  },
  dayText: { fontSize: 13, fontWeight: '700', color: GRAY[800] },

  shiftRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: GRAY[50],
  },
  shiftCell: { flex: 1.5 },
  shiftCellSmall: { flex: 2 },
  shiftCellNum: { flex: 1, alignItems: 'center' },
  shiftDept: { fontSize: 13, fontWeight: '500', color: GRAY[700] },
  shiftText: { fontSize: 12, color: GRAY[500] },
  shiftTextBold: { fontSize: 13, fontWeight: '600', color: GRAY[800] },

  coverageBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  coverageText: { fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  missingText: { fontSize: 13, fontWeight: '600', color: RED[500] },
  viewDetailsBtn: { fontSize: 13, fontWeight: '600', color: BLUE[600] },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: BG.white, borderRadius: RADIUS.card + 8, width: '100%', maxWidth: 400, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, borderBottomWidth: 1, borderBottomColor: GRAY[100],
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: GRAY[900] },
  modalSubtitle: { fontSize: 13, color: GRAY[400], marginTop: 2 },
  modalClose: { width: 32, height: 32, borderRadius: 8, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailBlock: { minWidth: '40%', marginBottom: 12 },
  detailLabel: { fontSize: 12, color: GRAY[400], marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: GRAY[900] },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: GRAY[100], alignItems: 'center' },
  modalFooterText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
});
