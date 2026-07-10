import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const SERVICES = [
  { name: 'API Server', status: 'Operational', uptime: '99.97%', response: '45ms', lastIncident: '2025-04-15', color: '#10B981' },
  { name: 'Database', status: 'Operational', uptime: '99.99%', response: '12ms', lastIncident: '2025-03-22', color: '#10B981' },
  { name: 'Cache (Redis)', status: 'Operational', uptime: '99.95%', response: '3ms', lastIncident: '2025-05-10', color: '#10B981' },
  { name: 'File Storage', status: 'Degraded', uptime: '98.50%', response: '320ms', lastIncident: '2025-06-28', color: '#F59E0B' },
  { name: 'Email Service', status: 'Operational', uptime: '99.88%', response: '210ms', lastIncident: '2025-06-20', color: '#10B981' },
  { name: 'Payment Gateway', status: 'Operational', uptime: '99.92%', response: '180ms', lastIncident: '2025-06-15', color: '#10B981' },
];

const RECENT_INCIDENTS = [
  { title: 'File Storage Slow Response', date: '2025-06-28', status: 'Resolved', duration: '1h 23m' },
  { title: 'Email Delivery Delay', date: '2025-06-20', status: 'Resolved', duration: '45m' },
  { title: 'Payment Gateway Timeout', date: '2025-06-15', status: 'Resolved', duration: '32m' },
  { title: 'Database Connection Pool Exhaustion', date: '2025-05-10', status: 'Resolved', duration: '2h 10m' },
];

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  Operational: { bg: '#10B98115', text: '#10B981' }, Degraded: { bg: '#F59E0B15', text: '#F59E0B' }, Down: { bg: '#EF444415', text: '#EF4444' },
};

export default function HealthScreen() {
  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>System Health</Text>
        </View>

        <View style={s.statusBanner}>
          <View style={[s.statusDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={s.statusTitle}>Degraded Performance</Text>
          <Text style={s.statusDesc}>1 service experiencing degraded performance</Text>
        </View>

        {SERVICES.map(svc => {
          const si = STATUS_MAP[svc.status] || STATUS_MAP.Operational;
          return (
            <View key={svc.name} style={s.svcCard}>
              <View style={s.svcHead}>
                <View style={[s.svcDot, { backgroundColor: svc.color }]} />
                <Text style={s.svcName}>{svc.name}</Text>
                <View style={[s.svcStatus, { backgroundColor: si.bg }]}>
                  <Text style={[s.svcStatusText, { color: si.text }]}>{svc.status}</Text>
                </View>
              </View>
              <View style={s.svcMetrics}>
                <View><Text style={s.metricLabel}>Uptime</Text><Text style={s.metricValue}>{svc.uptime}</Text></View>
                <View><Text style={s.metricLabel}>Response</Text><Text style={s.metricValue}>{svc.response}</Text></View>
                <View><Text style={s.metricLabel}>Last Incident</Text><Text style={s.metricValue}>{svc.lastIncident}</Text></View>
              </View>
            </View>
          );
        })}

        <View style={s.incidentCard}>
          <Text style={s.sectionTitle}>Recent Incidents</Text>
          {RECENT_INCIDENTS.map((inc, i) => (
            <View key={inc.title} style={[s.incidentRow, i < RECENT_INCIDENTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
              <View style={s.incidentDot} />
              <View style={s.incidentInfo}>
                <Text style={s.incidentTitle}>{inc.title}</Text>
                <Text style={s.incidentMeta}>{inc.date} • Duration: {inc.duration}</Text>
              </View>
              <View style={[s.incidentStatus, { backgroundColor: '#10B98115' }]}>
                <Text style={s.incidentStatusText}>{inc.status}</Text>
              </View>
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
  statusBanner: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card, gap: 8 },
  statusDot: { width: 16, height: 16, borderRadius: 8 },
  statusTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy },
  statusDesc: { ...TYPOGRAPHY.small, color: GRAY[500] },
  svcCard: { padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', ...SHADOWS.card },
  svcHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  svcDot: { width: 10, height: 10, borderRadius: 5 },
  svcName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, flex: 1 },
  svcStatus: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  svcStatusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  svcMetrics: { flexDirection: 'row', gap: SPACING.lg },
  metricLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  metricValue: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  incidentCard: { padding: 20, borderRadius: 20, backgroundColor: '#FFF', ...SHADOWS.card, marginTop: 4 },
  sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.lg },
  incidentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  incidentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  incidentInfo: { flex: 1 },
  incidentTitle: { ...TYPOGRAPHY.body, fontWeight: '600', color: SRS.navy },
  incidentMeta: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  incidentStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  incidentStatusText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: '#10B981' },
});
