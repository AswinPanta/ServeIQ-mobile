import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";

const ACCENT = '#7C3AED';

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

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Operational: { bg: '#10B98112', text: '#10B981' },
  Degraded: { bg: '#F59E0B12', text: '#F59E0B' },
  Down: { bg: '#EF444412', text: '#EF4444' },
};

export default function HealthScreen() {
  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>System Health</Text>
        </View>

        <View style={s.statusBanner}>
          <View style={[s.statusDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={s.bannerTitle}>Degraded Performance</Text>
          <Text style={s.bannerDesc}>1 service experiencing degraded performance</Text>
        </View>

        {SERVICES.map(svc => {
          const si = STATUS_STYLES[svc.status] || STATUS_STYLES.Operational;
          return (
            <View key={svc.name} style={s.card}>
              <View style={s.cardHead}>
                <View style={[s.dot, { backgroundColor: svc.color }]} />
                <Text style={s.svcName}>{svc.name}</Text>
                <View style={[s.statusBadge, { backgroundColor: si.bg }]}>
                  <Text style={[s.statusText, { color: si.text }]}>{svc.status}</Text>
                </View>
              </View>
              <View style={s.metricsRow}>
                <View>
                  <Text style={s.metricLabel}>Uptime</Text>
                  <Text style={s.metricValue}>{svc.uptime}</Text>
                </View>
                <View>
                  <Text style={s.metricLabel}>Response</Text>
                  <Text style={s.metricValue}>{svc.response}</Text>
                </View>
                <View>
                  <Text style={s.metricLabel}>Last Incident</Text>
                  <Text style={s.metricValue}>{svc.lastIncident}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={s.incidentCard}>
          <Text style={s.sectionTitle}>Recent Incidents</Text>
          {RECENT_INCIDENTS.map((inc, i) => (
            <View key={inc.title} style={[s.incidentRow, i < RECENT_INCIDENTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
              <View style={[s.incidentDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.incidentTitle}>{inc.title}</Text>
                <Text style={s.incidentMeta}>{inc.date} · Duration: {inc.duration}</Text>
              </View>
              <View style={[s.incidentStatus, { backgroundColor: '#10B98112' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>{inc.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1 },
  statusBanner: { padding: 18, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', gap: 8 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  bannerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  bannerDesc: { fontSize: 13, color: '#64748B' },
  card: { padding: 16, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  svcName: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 16 },
  metricLabel: { fontSize: 11, color: '#64748B' },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  incidentCard: { padding: 18, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  incidentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  incidentDot: { width: 8, height: 8, borderRadius: 4 },
  incidentTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  incidentMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  incidentStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
});
