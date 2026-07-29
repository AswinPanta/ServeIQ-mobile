import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";

const ACCENT = '#7C3AED';
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
  Open: { bg: '#3B82F612', text: '#3B82F6' },
  'In Progress': { bg: '#F59E0B12', text: '#F59E0B' },
  Resolved: { bg: '#10B98112', text: '#10B981' },
  Closed: { bg: '#6B728012', text: '#6B7280' },
};

export default function TicketsScreen() {
  const [filter, setFilter] = useState<string>('All');
  const filtered = filter === 'All' ? TICKETS : TICKETS.filter(t => t.status === filter);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Support Tickets</Text>
          <View style={[s.urgentBadge, { backgroundColor: '#EF444412' }]}>
            <Text style={s.urgentText}>{TICKETS.filter(t => t.priority === 'Urgent').length} urgent</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                style={[s.filterChip, filter === f && s.filterActive]}>
                <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filtered.map(ticket => {
          const st = STATUS_STYLES[ticket.status];
          return (
            <TouchableOpacity key={ticket.id} style={[s.card, { borderLeftColor: ticket.priorityColor }]} activeOpacity={0.7}>
              <View style={s.cardTop}>
                <Text style={s.ticketId}>#{ticket.id}</Text>
                <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[s.statusText, { color: st.text }]}>{ticket.status}</Text>
                </View>
              </View>
              <Text style={s.subject}>{ticket.subject}</Text>
              <Text style={s.tenant}>{ticket.tenant}</Text>
              <View style={s.cardBottom}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[s.priorityBadge, { backgroundColor: ticket.priorityColor + '12' }]}>
                    <Text style={[s.priorityText, { color: ticket.priorityColor }]}>{ticket.priority}</Text>
                  </View>
                  <Text style={s.meta}>{ticket.date}</Text>
                </View>
                <Text style={s.meta}>{ticket.assignee}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  urgentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  urgentText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterActive: { backgroundColor: ACCENT },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  card: { padding: 16, borderRadius: 14, backgroundColor: '#FFF', borderLeftWidth: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ticketId: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  subject: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  tenant: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12, color: '#64748B' },
});
