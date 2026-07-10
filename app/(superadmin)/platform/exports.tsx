import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const EXPORT_TYPES = [
  { icon: 'group' as const, title: 'Tenants', description: 'Export all tenant data with subscription details', formats: ['CSV', 'Excel'], color: '#3B82F6' },
  { icon: 'booking' as const, title: 'Bookings', description: 'Export booking records with guest and payment info', formats: ['CSV', 'Excel'], color: '#10B981' },
  { icon: 'payment' as const, title: 'Revenue', description: 'Export financial data, invoices, and transactions', formats: ['CSV', 'PDF'], color: '#F59E0B' },
  { icon: 'analytics' as const, title: 'Analytics', description: 'Export platform analytics and performance metrics', formats: ['PDF'], color: SUPERADMIN },
];

const EXPORT_HISTORY = [
  { filename: 'tenants_export_jun2025.csv', date: '2025-06-28', status: 'Completed', size: '1.2 MB' },
  { filename: 'bookings_q2_2025.xlsx', date: '2025-06-25', status: 'Completed', size: '4.5 MB' },
  { filename: 'revenue_report_jun2025.pdf', date: '2025-06-22', status: 'Processing', size: '—' },
  { filename: 'analytics_dashboard_may.pdf', date: '2025-06-01', status: 'Completed', size: '3.1 MB' },
  { filename: 'large_tenants_export.csv', date: '2025-05-28', status: 'Failed', size: '—' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Completed: { bg: '#10B98115', text: '#10B981' }, Processing: { bg: '#F59E0B15', text: '#F59E0B' }, Failed: { bg: '#EF444415', text: '#EF4444' },
};

export default function ExportsScreen() {
  const handleExport = (title: string) => Alert.alert('Export Started', `${title} export is being processed.`);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Data Exports</Text>
        </View>

        {EXPORT_TYPES.map(exp => (
          <View key={exp.title} style={[s.exportCard, { borderLeftColor: exp.color }]}>
            <View style={s.exportHead}>
              <View style={[s.exportIcon, { backgroundColor: exp.color + '15' }]}>
                <IconSymbol name={exp.icon} size={20} color={exp.color} />
              </View>
              <View style={s.exportInfo}>
                <Text style={s.exportTitle}>{exp.title}</Text>
                <Text style={s.exportDesc}>{exp.description}</Text>
              </View>
            </View>
            <View style={s.exportBottom}>
              <View style={s.formatRow}>
                {exp.formats.map(fmt => (
                  <View key={fmt} style={[s.formatBadge, { backgroundColor: SUPERADMIN + '10' }]}>
                    <Text style={[s.formatText, { color: SUPERADMIN }]}>{fmt}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity onPress={() => handleExport(exp.title)} style={s.exportBtn} activeOpacity={0.7}>
                <Text style={s.exportBtnText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={s.historyCard}>
          <Text style={s.sectionTitle}>Export History</Text>
          {EXPORT_HISTORY.map((h, i) => {
            const st = STATUS_STYLES[h.status];
            return (
              <View key={h.filename} style={[s.historyRow, i < EXPORT_HISTORY.length - 1 && { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
                <View style={s.historyIcon}>
                  <IconSymbol name="file" size={14} color={SUPERADMIN} />
                </View>
                <View style={s.historyInfo}>
                  <Text style={s.historyName}>{h.filename}</Text>
                  <Text style={s.historyMeta}>{h.date} • {h.size}</Text>
                </View>
                <View style={[s.historyStatus, { backgroundColor: st.bg }]}>
                  <Text style={[s.historyStatusText, { color: st.text }]}>{h.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
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
  exportCard: { padding: SPACING.lg, borderRadius: 20, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  exportHead: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  exportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exportInfo: { flex: 1 },
  exportTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  exportDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  exportBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formatRow: { flexDirection: 'row', gap: 8 },
  formatBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  formatText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  exportBtn: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, backgroundColor: SUPERADMIN },
  exportBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: '#FFF' },
  historyCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card, marginTop: 4 },
  sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.lg },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  historyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: SUPERADMIN + '10', alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyName: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  historyMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  historyStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyStatusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
});
