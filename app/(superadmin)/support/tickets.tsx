import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';
const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const;

const TICKETS = [
  { id: '1234', tenant: 'Himalayan Heights Hotels', subject: 'Payment gateway integration failing on checkout', priority: 'Urgent', status: 'Open', date: '2025-06-30', assignee: 'Ram P.', priorityColor: '#EF4444' },
  { id: '1235', tenant: 'Pokhara Lake Resort', subject: 'Unable to update room photos in dashboard', priority: 'High', status: 'In Progress', date: '2025-06-29', assignee: 'Sita K.', priorityColor: '#F59E0B' },
  { id: '1236', tenant: 'Buddha B&B Chain', subject: 'How to set up seasonal pricing?', priority: 'Medium', status: 'Open', date: '2025-06-28', assignee: 'Unassigned', priorityColor: '#3B82F6' },
  { id: '1237', tenant: 'Everest Base Camp Lodges', subject: 'Multi-language support not showing on mobile', priority: 'High', status: 'In Progress', date: '2025-06-27', assignee: 'Hari G.', priorityColor: '#F59E0B' },
  { id: '1238', tenant: 'Lumbini Garden Hotel', subject: 'Invoice discrepancy for May billing', priority: 'Medium', status: 'Resolved', date: '2025-06-26', assignee: 'Ram P.', priorityColor: '#3B82F6' },
  { id: '1239', tenant: 'Garden Retreat', subject: 'Account setup assistance needed', priority: 'Low', status: 'Open', date: '2025-06-25', assignee: 'Unassigned', priorityColor: '#6B7280' },
  { id: '1240', tenant: 'Mountain View Inn', subject: 'Trial period extension request', priority: 'Low', status: 'Closed', date: '2025-06-24', assignee: 'Sita K.', priorityColor: '#6B7280' },
  { id: '1241', tenant: 'Chitwan Safari Lodge', subject: 'Billing address update not saving', priority: 'Urgent', status: 'Open', date: '2025-06-30', assignee: 'Unassigned', priorityColor: '#EF4444' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Open: { bg: '#3B82F615', text: '#3B82F6' }, 'In Progress': { bg: '#F59E0B15', text: '#F59E0B' },
  Resolved: { bg: '#10B98115', text: '#10B981' }, Closed: { bg: '#6B728015', text: '#6B7280' },
};

export default function TicketsScreen() {
  const [filter, setFilter] = useState<string>('All');
  const filtered = filter === 'All' ? TICKETS : TICKETS.filter(t => t.status === filter);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Support Tickets</Text>
          <View style={[s.urgentBadge, { backgroundColor: '#EF444415' }]}>
            <Text style={s.urgentText}>{TICKETS.filter(t => t.priority === 'Urgent').length} urgent</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                style={[s.filterChip, { backgroundColor: filter === f ? SUPERADMIN : GRAY[100] }]}>
                <Text style={[s.filterText, { color: filter === f ? '#FFF' : GRAY[500] }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filtered.map(ticket => {
          const st = STATUS_STYLES[ticket.status];
          return (
            <TouchableOpacity key={ticket.id} style={[s.ticketCard, { borderLeftColor: ticket.priorityColor }]} activeOpacity={0.7}>
              <View style={s.ticketTop}>
                <Text style={s.ticketId}>#{ticket.id}</Text>
                <View style={[s.ticketStatus, { backgroundColor: st.bg }]}>
                  <Text style={[s.ticketStatusText, { color: st.text }]}>{ticket.status}</Text>
                </View>
              </View>
              <Text style={s.ticketSubject}>{ticket.subject}</Text>
              <Text style={s.ticketTenant}>{ticket.tenant}</Text>
              <View style={s.ticketBottom}>
                <View style={s.ticketMeta}>
                  <View style={[s.priorityBadge, { backgroundColor: ticket.priorityColor + '15' }]}>
                    <Text style={[s.priorityText, { color: ticket.priorityColor }]}>{ticket.priority}</Text>
                  </View>
                  <Text style={s.ticketDate}>{ticket.date}</Text>
                </View>
                <Text style={s.ticketAssignee}>{ticket.assignee}</Text>
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
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  urgentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  urgentText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: '#EF4444' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20 },
  filterText: { ...TYPOGRAPHY.body, fontWeight: '600' },
  ticketCard: { padding: SPACING.lg, borderRadius: 16, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ticketId: { ...TYPOGRAPHY.caption, fontWeight: '700', color: GRAY[400] },
  ticketStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ticketStatusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  ticketSubject: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, marginBottom: 4 },
  ticketTenant: { ...TYPOGRAPHY.caption, color: GRAY[500], marginBottom: 8 },
  ticketBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  ticketDate: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  ticketAssignee: { ...TYPOGRAPHY.caption, color: GRAY[500] },
});
