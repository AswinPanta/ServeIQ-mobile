import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const REPORT_TYPES = [
  { icon: 'payment' as const, title: 'Revenue Report', description: 'Detailed revenue breakdown by tenant, property, and time period', lastGenerated: '2025-06-28', color: '#10B981' },
  { icon: 'hotel' as const, title: 'Occupancy Report', description: 'Occupancy rates across all properties with trend analysis', lastGenerated: '2025-06-27', color: '#3B82F6' },
  { icon: 'analytics' as const, title: 'Booking Trends', description: 'Booking patterns, seasonal trends, and forecast data', lastGenerated: '2025-06-25', color: '#F59E0B' },
  { icon: 'person.fill' as const, title: 'User Activity', description: 'User engagement metrics, login frequency, and feature adoption', lastGenerated: '2025-06-20', color: SUPERADMIN },
  { icon: 'star' as const, title: 'Property Performance', description: 'Property ratings, reviews, and comparative performance analysis', lastGenerated: '2025-06-15', color: '#EC4899' },
];

const RECENT_REPORTS = [
  { name: 'Revenue_Report_Jun2025.pdf', date: '2025-06-28', size: '2.4 MB' },
  { name: 'Occupancy_Q2_2025.pdf', date: '2025-06-27', size: '1.8 MB' },
  { name: 'Booking_Trends_Weekly.xlsx', date: '2025-06-25', size: '856 KB' },
  { name: 'User_Activity_Report.pdf', date: '2025-06-20', size: '3.2 MB' },
];

export default function ReportsScreen() {
  const [selectedRange, setSelectedRange] = useState('This Month');
  const ranges = ['Today', 'This Week', 'This Month', 'Last Quarter', 'Custom'];
  const handleGenerate = (title: string) => Alert.alert('Report Generated', `${title} has been generated and is ready for download.`);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Reports</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {ranges.map(r => (
              <TouchableOpacity key={r} onPress={() => setSelectedRange(r)}
                style={[s.filterChip, { backgroundColor: selectedRange === r ? SUPERADMIN : GRAY[100] }]}>
                <Text style={[s.filterText, { color: selectedRange === r ? '#FFF' : GRAY[500] }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {REPORT_TYPES.map(report => (
          <View key={report.title} style={[s.reportCard, { borderLeftColor: report.color }]}>
            <View style={s.reportHead}>
              <View style={[s.reportIcon, { backgroundColor: report.color + '15' }]}>
                <IconSymbol name={report.icon} size={20} color={report.color} />
              </View>
              <View style={s.reportInfo}>
                <Text style={s.reportTitle}>{report.title}</Text>
                <Text style={s.reportDesc}>{report.description}</Text>
                <Text style={s.reportDate}>Last generated: {report.lastGenerated}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleGenerate(report.title)} style={s.generateBtn} activeOpacity={0.7}>
              <Text style={s.generateBtnText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={s.recentCard}>
          <Text style={s.sectionTitle}>Recent Reports</Text>
          {RECENT_REPORTS.map((r, i) => (
            <View key={r.name} style={[s.recentRow, i < RECENT_REPORTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
              <View style={s.recentIcon}>
                <IconSymbol name="file" size={16} color={SUPERADMIN} />
              </View>
              <View style={s.recentInfo}>
                <Text style={s.recentName}>{r.name}</Text>
                <Text style={s.recentMeta}>{r.date} • {r.size}</Text>
              </View>
              <TouchableOpacity style={s.downloadBtn} activeOpacity={0.7}>
                <Text style={s.downloadText}>Download</Text>
              </TouchableOpacity>
            </View>
          ))}
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
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20 },
  filterText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  reportCard: { padding: SPACING.lg, borderRadius: 20, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  reportHead: { flexDirection: 'row', gap: 12 },
  reportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  reportDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  reportDate: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 4 },
  generateBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 16, backgroundColor: SUPERADMIN, alignItems: 'center' },
  generateBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: '#FFF' },
  recentCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card, marginTop: 4 },
  sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.lg },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  recentIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  recentInfo: { flex: 1 },
  recentName: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  recentMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  downloadBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8, backgroundColor: SUPERADMIN + '15' },
  downloadText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: SUPERADMIN },
});
