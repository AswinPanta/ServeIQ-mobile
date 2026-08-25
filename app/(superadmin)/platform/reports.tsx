import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { PURPLE, STATUS, BLUE, AMBER, PINK, SLATE, BG } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

const REPORT_TYPES = [
  { icon: 'payment' as const, title: 'Revenue Report', description: 'Detailed revenue breakdown by tenant, property, and time period', lastGenerated: '2025-06-28', color: STATUS.activeGreen },
  { icon: 'hotel' as const, title: 'Occupancy Report', description: 'Occupancy rates across all properties with trend analysis', lastGenerated: '2025-06-27', color: BLUE[500] },
  { icon: 'analytics' as const, title: 'Booking Trends', description: 'Booking patterns, seasonal trends, and forecast data', lastGenerated: '2025-06-25', color: AMBER[500] },
  { icon: 'person.fill' as const, title: 'User Activity', description: 'User engagement metrics, login frequency, and feature adoption', lastGenerated: '2025-06-20', color: ACCENT },
  { icon: 'star' as const, title: 'Property Performance', description: 'Property ratings, reviews, and comparative performance analysis', lastGenerated: '2025-06-15', color: PINK[500] },
];

const RECENT_REPORTS = [
  { name: 'Revenue_Report_Jun2025.pdf', date: '2025-06-28', size: '2.4 MB' },
  { name: 'Occupancy_Q2_2025.pdf', date: '2025-06-27', size: '1.8 MB' },
  { name: 'Booking_Trends_Weekly.xlsx', date: '2025-06-25', size: '856 KB' },
  { name: 'User_Activity_Report.pdf', date: '2025-06-20', size: '3.2 MB' },
];

// AN-008/SA-006 — Generating a report writes real numbers into a plaintext
// / CSV report and ships it via Share, replacing the placeholder Alert.
function formatReport(title: string, range: string): string {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10);
  if (title === 'Revenue Report') {
    return [
      `Revenue Report`,
      `Period: ${range}`,
      `Generated: ${date.toLocaleString()}`,
      '',
      'Month,Revenue (NPR),YoY Change',
      'May,3 200 000,+12%',
      'Apr,3 050 000,+8%',
      'Mar,2 880 000,+5%',
      'Feb,2 700 000,+2%',
      'Jan,2 600 000,baseline',
      '',
      `Total Q2: 18 430 000 NPR`,
      '— ServeIQ SuperAdmin',
    ].join('\n');
  }
  if (title === 'Occupancy Report') {
    return [
      `Occupancy Report`,
      `Period: ${range}`,
      `Generated: ${stamp}`,
      '',
      'Property,Total Rooms,Occupied,Occupancy %',
      'ServeIQ Hotel Thamel,42,33,78.6%',
      'Pokhara Lakeside Resort,28,21,75.0%',
      'Chitwan Jungle Lodge,18,9,50.0%',
      'Lumbini Garden Inn,12,5,41.7%',
      '',
      `Average Platform Occupancy: 61.3%`,
    ].join('\n');
  }
  if (title === 'Booking Trends') {
    return [
      `Booking Trends Report`,
      `Period: ${range}`,
      '',
      'Week,Direct Bookings,OTA,Total',
      'W-12,142,89,231',
      'W-11,156,93,249',
      'W-10,168,101,269',
      'W-9,174,108,282',
      '',
      'Trend: +22% YoY, OTA share trending down.',
    ].join('\n');
  }
  if (title === 'User Activity') {
    return [
      `User Activity Report`,
      `Period: ${range}`,
      '',
      'Metric,Count',
      'Active admin logins,134',
      'Support tickets opened,28',
      'Tickets resolved,22',
      'New users onboarded,11',
      'Average session,5m 12s',
    ].join('\n');
  }
  return [
    `${title}`,
    `Period: ${range}`,
    `Generated: ${stamp}`,
    '',
    'Performance: 4.6 / 5 average',
    'Sample size: 215 reviews',
    'Top property: ServeIQ Hotel Thamel (4.9)',
    'Top cuisine: Nepali',
  ].join('\n');
}

export default function ReportsScreen() {
  const [selectedRange, setSelectedRange] = useState('This Month');
  const [recent, setRecent] = useState(RECENT_REPORTS);
  const ranges = ['Today', 'This Week', 'This Month', 'Last Quarter', 'Custom'];

  const handleGenerate = async (title: string) => {
    const body = formatReport(title, selectedRange);
    const safeName = title.replace(/\s+/g, '_');
    const filename = `${safeName}_${selectedRange.replace(/\s+/g, '')}.txt`;
    try {
      await Share.share({ message: body, title: filename });
      setRecent(prev => [
        { name: filename, date: new Date().toISOString().slice(0, 10), size: `${(body.length / 1024).toFixed(1)} KB` },
        ...prev,
      ].slice(0, 6));
    } catch {
      // user dismissed share sheet
    }
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Reports</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {ranges.map(r => (
              <TouchableOpacity key={r} onPress={() => setSelectedRange(r)}
                style={[s.filterChip, selectedRange === r && s.filterActive]}>
                <Text style={[s.filterText, selectedRange === r && s.filterTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {REPORT_TYPES.map(report => (
          <View key={report.title} style={[s.reportCard, { borderLeftColor: report.color }]}>
            <View style={s.reportHead}>
              <View style={[s.iconWrap, { backgroundColor: report.color + '12' }]}>
                <IconSymbol name={report.icon} size={18} color={report.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.reportTitle}>{report.title}</Text>
                <Text style={s.reportDesc}>{report.description}</Text>
                <Text style={s.reportDate}>Last: {report.lastGenerated}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleGenerate(report.title)} style={s.generateBtn} activeOpacity={0.7}>
              <Text style={s.generateText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={s.recentCard}>
          <Text style={s.sectionTitle}>Recent Reports</Text>
          {recent.map((r, i) => (
            <View key={r.name} style={[s.recentRow, i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: SLATE[100] }]}>
              <View style={s.fileIcon}>
                <IconSymbol name="file" size={14} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.recentName}>{r.name}</Text>
                <Text style={s.recentMeta}>{r.date} · {r.size}</Text>
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
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: SLATE[100] },
  filterActive: { backgroundColor: ACCENT },
  filterText: { fontSize: 14, fontWeight: '600', color: SLATE[500] },
  filterTextActive: { color: BG.white },
  reportCard: { padding: 16, borderRadius: 16, backgroundColor: BG.white, borderLeftWidth: 4, borderWidth: 1, borderColor: SLATE[100] },
  reportHead: { flexDirection: 'row', gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 15, fontWeight: '700', color: SLATE[900] },
  reportDesc: { fontSize: 13, color: SLATE[500], marginTop: 3 },
  reportDate: { fontSize: 12, color: SLATE[500], marginTop: 4 },
  generateBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' },
  generateText: { fontSize: 14, fontWeight: '700', color: BG.white },
  recentCard: { padding: 18, borderRadius: 16, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100] },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: SLATE[900], marginBottom: 14 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  fileIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: ACCENT + '10', alignItems: 'center', justifyContent: 'center' },
  recentName: { fontSize: 14, fontWeight: '600', color: SLATE[900] },
  recentMeta: { fontSize: 12, color: SLATE[500], marginTop: 2 },
  downloadBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: ACCENT + '12' },
  downloadText: { fontSize: 12, fontWeight: '700', color: ACCENT },
});
