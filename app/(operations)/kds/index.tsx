import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useOrderStore } from '@/stores/useOrderStore';
import { useAuth } from '@/lib/context/auth-context';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { SystemFlowBar } from '@/components/operations/SystemFlowBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Animated, { LinearTransition } from 'react-native-reanimated';
import type { KdsTicket } from '@/stores/useOrderStore';

const DARK_BG = '#0D1117';
const DARK_CARD = '#161B22';
const DARK_BORDER = '#30363D';
const DARK_TEXT = '#E6EDF3';
const DARK_MUTED = '#8B949E';

const COLUMN_COLORS: Record<string, string> = {
  pending: SRS.orange,
  in_progress: '#2980B9',
  ready: SRS.green,
};

const COLUMN_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  ready: 'Ready',
};

const STATIONS = ['All', 'Main Kitchen', 'Grill', 'Drinks', 'Dessert', 'Bakery'];

const STATION_KEYWORDS: Record<string, string[]> = {
  'Main Kitchen': ['pizza', 'pasta', 'rice', 'curry', 'chicken', 'burger', 'fries', 'soup', 'salad', 'naan', 'butter', 'french'],
  Grill: ['grill', 'steak', 'kebab', 'bbq', 'barbecue', 'tandoori', 'seared'],
  Drinks: ['tea', 'water', 'juice', 'soda', 'cola', 'coffee', 'shake', 'smoothie', 'beverage', 'iced'],
  Dessert: ['brownie', 'tiramisu', 'cake', 'ice cream', 'dessert', 'pudding', 'mousse'],
  Bakery: ['bread', 'croissant', 'pastry', 'muffin', 'bagel', 'toast', 'roll'],
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTimerColor(seconds: number): string {
  if (seconds < 300) return SRS.green;
  if (seconds < 600) return SRS.orange;
  return SRS.red;
}

function matchesStation(ticket: KdsTicket, station: string): boolean {
  if (station === 'All') return true;
  const keywords = STATION_KEYWORDS[station];
  if (!keywords) return true;
  return ticket.items.some(item =>
    keywords.some(kw => item.name.toLowerCase().includes(kw))
  );
}

function isPremiumTicket(ticket: KdsTicket): boolean {
  return ticket.items.some(item => item.name.toLowerCase().includes('premium'));
}

function getLastFour(id: string): string {
  return id.length > 4 ? id.slice(-4) : id;
}

const ticketStartTimes = new Map<string, number>();

export default function KDScreen() {
  const { user } = useAuth();
  const operator = user as { property_id?: string } | null;
  const setOrderPropertyId = useOrderStore((s) => s.setPropertyId);

  useEffect(() => {
    setOrderPropertyId(operator?.property_id || 'prop-1');
  }, [operator?.property_id, setOrderPropertyId]);

  const tickets = useOrderStore((s) => s.tickets);
  const completedOrders = useOrderStore((s) => s.completedOrders);
  const [station, setStation] = useState('All');
  const [now, setNow] = useState(() => Date.now());

  // Track start times via module-level store (avoids ref-during-render lint)
  const ticketIdsKey = tickets.map(t => t.id).join(',');
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    tickets.forEach(t => {
      if (!ticketStartTimes.has(t.id)) ticketStartTimes.set(t.id, Date.now());
    });
  }, [ticketIdsKey]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedSeconds = (ticket: KdsTicket): number => {
    const start = ticketStartTimes.get(ticket.id);
    if (!start) return ticket.elapsed_seconds;
    return ticket.elapsed_seconds + Math.floor((now - start) / 1000);
  };

  const pendingTickets = useMemo(() => tickets.filter(t => t.status === 'pending' && matchesStation(t, station)), [tickets, station]);
  const inProgressTickets = useMemo(() => tickets.filter(t => t.status === 'in_progress' && matchesStation(t, station)), [tickets, station]);
  const readyTickets = useMemo(() => tickets.filter(t => t.status === 'ready' && matchesStation(t, station)), [tickets, station]);

  const columns = useMemo(() => [
    { status: 'pending' as const, data: pendingTickets },
    { status: 'in_progress' as const, data: inProgressTickets },
    { status: 'ready' as const, data: readyTickets },
  ], [pendingTickets, inProgressTickets, readyTickets]);

  const totalPendingCount = tickets.filter(t => t.status === 'pending').length;
  const totalProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const totalReadyCount = tickets.filter(t => t.status === 'ready').length;
  const totalActive = tickets.length;

  const delayedCount = useMemo(() =>
    tickets.filter(t => t.status !== 'ready' && getElapsedSeconds(t) > 600).length,
    [tickets, now]
  );

  const avgTimeSeconds = useMemo(() => {
    const active = tickets.filter(t => t.status !== 'ready');
    if (active.length === 0) return 0;
    const total = active.reduce((sum, t) => sum + getElapsedSeconds(t), 0);
    return Math.round(total / active.length);
  }, [tickets, now]);

  const handleAdvance = (ticket: KdsTicket) => {
    const nextStatusMap: Record<string, string> = {
      pending: 'in_progress',
      in_progress: 'ready',
    };
    const nextStatus = nextStatusMap[ticket.status];
    if (!nextStatus) return;

    useOrderStore.getState().advanceTicketStatus(ticket.id);

    useActivityStore.getState().addActivity({
      type: 'order',
      title: `Ticket ${getLastFour(ticket.id)} → ${COLUMN_LABELS[nextStatus]}`,
      description: `Table ${ticket.table_number} · ${ticket.items.length} items`,
      icon: '🍽️',
      color: COLUMN_COLORS[nextStatus],
      property_id: operator?.property_id || 'prop-1',
    });

    if (nextStatus === 'ready') {
      useNotificationStore.getState().addNotification({
        type: 'kitchen_ready',
        title: 'Order Ready',
        message: `Table ${ticket.table_number} order ready`,
        data: { ticketId: ticket.id, tableNumber: String(ticket.table_number) },
      });
    }
  };

  // Summary row for the header
  const flowItems = useMemo(() => [
    { label: 'Pending', count: totalPendingCount, active: totalPendingCount > 0 },
    { label: 'Preparing', count: totalProgressCount, active: totalProgressCount > 0 },
    { label: 'Ready', count: totalReadyCount, active: totalReadyCount > 0 },
  ], [totalPendingCount, totalProgressCount, totalReadyCount]);

  return (
    <View style={{ flex: 1, backgroundColor: DARK_BG }}>
      <SystemFlowBar items={flowItems} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
        {/* Header */}
        <View style={kdsStyles.header}>
          <View>
            <Text style={kdsStyles.headerTitle}>Kitchen Display</Text>
            <Text style={kdsStyles.headerSub}>{totalActive} active tickets</Text>
          </View>
          <View style={kdsStyles.liveDot}>
            <View style={kdsStyles.liveIndicator} />
            <Text style={kdsStyles.liveText}>Live</Text>
          </View>
        </View>

        {/* KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }} contentContainerStyle={kdsStyles.kpiRow}>
          <KpiCardDark label="Pending" value={totalPendingCount} icon="pending" color={COLUMN_COLORS.pending} />
          <KpiCardDark label="Preparing" value={totalProgressCount} icon="progress" color={COLUMN_COLORS.in_progress} />
          <KpiCardDark label="Ready" value={totalReadyCount} icon="ready" color={COLUMN_COLORS.ready} />
          <KpiCardDark label="Delayed" value={delayedCount} icon="warning.triangle" color={SRS.red} subtitle={delayedCount > 0 ? '>10 min' : undefined} />
          <KpiCardDark label="Avg Time" value={formatTime(avgTimeSeconds)} icon="clock" color="#8B5CF6" />
          <KpiCardDark label="Completed" value={completedOrders.length} icon="done.all" color="#0D9488" />
        </ScrollView>

        {/* Station Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }} contentContainerStyle={kdsStyles.stationRow}>
          {STATIONS.map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setStation(s)}
              style={[kdsStyles.stationChip, { backgroundColor: station === s ? '#1F6FEB' : DARK_CARD, borderColor: station === s ? '#1F6FEB' : DARK_BORDER }]}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: station === s ? '#FFF' : DARK_MUTED }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Kanban Columns */}
        {totalActive === 0 ? (
          <View style={{ paddingTop: 40 }}>
            <EmptyState icon="✅" title="All Caught Up! 🎉" message="No pending orders in the kitchen" />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={kdsStyles.kanbanRow} style={{ flex: 1 }}>
            {columns.map(col => (
              <View key={col.status} style={kdsStyles.column}>
                <View style={kdsStyles.columnHeader}>
                  <View style={kdsStyles.columnLabelRow}>
                    <View style={[kdsStyles.columnDot, { backgroundColor: COLUMN_COLORS[col.status] }]} />
                    <Text style={kdsStyles.columnLabel}>{COLUMN_LABELS[col.status]}</Text>
                  </View>
                  <View style={[kdsStyles.columnBadge, { backgroundColor: COLUMN_COLORS[col.status] + '25' }]}>
                    <Text style={[kdsStyles.columnCount, { color: COLUMN_COLORS[col.status] }]}>{col.data.length}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.xl }} nestedScrollEnabled>
                  {col.data.length === 0 ? (
                    <View style={kdsStyles.emptyColumn}>
                      <Text style={kdsStyles.emptyText}>No tickets</Text>
                    </View>
                  ) : (
                    col.data.map(ticket => {
                      const elapsedSeconds = getElapsedSeconds(ticket);
                      const timerColor = getTimerColor(elapsedSeconds);

                      return (
                        <Animated.View key={ticket.id} style={[kdsStyles.ticketCard, { borderTopColor: COLUMN_COLORS[col.status] }]} layout={LinearTransition.springify().damping(20)}>
                          <View style={kdsStyles.ticketHeader}>
                            <View style={kdsStyles.ticketIdRow}>
                              <Text style={kdsStyles.ticketId}>#{getLastFour(ticket.order_id)}</Text>
                              {isPremiumTicket(ticket) && (
                                <View style={kdsStyles.vipBadge}><Text style={kdsStyles.vipText}>VIP</Text></View>
                              )}
                            </View>
                            <StatusBadge label={`T${ticket.table_number}`} color="#0D9488" size="sm" />
                          </View>

                          <View style={kdsStyles.ticketTimerRow}>
                            <Text style={kdsStyles.timerLabel}>Table</Text>
                            <Text style={kdsStyles.timerTable}>{ticket.table_number}</Text>
                            <View style={{ flex: 1 }} />
                            <View style={[kdsStyles.timerBadge, { backgroundColor: timerColor + '20' }]}>
                              <IconSymbol name="clock" size={12} color={timerColor} />
                              <Text style={[kdsStyles.timerValue, { color: timerColor }]}> {formatTime(elapsedSeconds)}</Text>
                            </View>
                          </View>

                          <View style={kdsStyles.itemsList}>
                            {ticket.items.map((item, idx) => (
                              <View key={idx} style={kdsStyles.itemRow}>
                                <Text style={kdsStyles.itemBullet}>•</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={kdsStyles.itemName}>
                                    <Text style={{ fontWeight: '700' }}>{item.quantity}×</Text> {item.name}
                                  </Text>
                                  {item.modifiers ? <Text style={kdsStyles.itemMod}>{item.modifiers}</Text> : null}
                                </View>
                                {item.item_status !== 'ready' && item.item_status !== 'served' && item.item_status !== 'cancelled' && col.status !== 'ready' && (
                                  <TouchableOpacity
                                    onPress={() => {
                                      const next = item.item_status === 'pending' ? 'in_progress' : 'ready';
                                      useOrderStore.getState().updateItemStatus(ticket.id, item.id, next);
                                    }}
                                    style={[kdsStyles.itemAdvance, { backgroundColor: COLUMN_COLORS[col.status] + '30' }]}
                                  >
                                    <IconSymbol name="chevron.right" size={10} color={COLUMN_COLORS[col.status]} />
                                  </TouchableOpacity>
                                )}
                              </View>
                            ))}
                          </View>

                          {col.status === 'ready' ? (
                            <View style={{ gap: SPACING.sm }}>
                              {ticket.items.map((item, idx) => {
                                if (item.item_status === 'served') return null;
                                return (
                                  <TouchableOpacity
                                    key={idx}
                                    onPress={() => useOrderStore.getState().updateItemStatus(ticket.id, item.id, 'served')}
                                    style={[kdsStyles.serveBtn, { backgroundColor: item.item_status === 'ready' ? SRS.green + '15' : '#8B5CF615', borderColor: item.item_status === 'ready' ? SRS.green + '30' : '#8B5CF630' }]}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: item.item_status === 'ready' ? SRS.green : '#8B5CF6' }}>
                                      {item.item_status === 'ready' ? `🍽️ Mark ${item.quantity}× ${item.name} Served` : `✅ ${item.name} Served`}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                              {ticket.items.every(i => i.item_status === 'served') && (
                                <View style={{ borderRadius: RADIUS.card, paddingVertical: SPACING.md, alignItems: 'center', backgroundColor: '#8B5CF615' }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#8B5CF6' }}>✅ All Items Served</Text>
                                </View>
                              )}
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleAdvance(ticket)}
                              style={[kdsStyles.advanceBtn, { backgroundColor: col.status === 'pending' ? '#238636' : '#1F6FEB' }]}
                            >
                              <Text style={kdsStyles.advanceBtnText}>
                                {col.status === 'pending' ? 'Accept' : 'Mark Ready'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </Animated.View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function KpiCardDark({ label, value, icon, color, subtitle }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <View style={kdsStyles.kpiDarkCard}>
      <View style={kdsStyles.kpiDarkHeader}>
        <View style={[kdsStyles.kpiDarkIcon, { backgroundColor: color + '20' }]}>
          <IconSymbol name={icon as any} size={14} color={color} />
        </View>
        <Text style={kdsStyles.kpiDarkLabel}>{label}</Text>
      </View>
      <Text style={kdsStyles.kpiDarkValue}>{value}</Text>
      {subtitle ? <Text style={[kdsStyles.kpiDarkSub, { color }]}>{subtitle}</Text> : null}
    </View>
  );
}

const kdsStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  headerSub: {
    fontSize: 13,
    color: DARK_MUTED,
    marginTop: 2,
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SRS.green,
  },
  liveText: {
    fontSize: 12,
    color: DARK_MUTED,
  },
  kpiRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  kpiDarkCard: {
    backgroundColor: DARK_CARD,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    minWidth: 100,
  },
  kpiDarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  kpiDarkIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiDarkLabel: {
    fontSize: 10,
    color: DARK_MUTED,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  kpiDarkValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_TEXT,
    fontVariant: ['tabular-nums' as any],
  },
  kpiDarkSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  stationRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  stationChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  kanbanRow: {
    paddingHorizontal: SPACING.lg,
    gap: 14,
  },
  column: {
    width: 290,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  columnLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  columnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  columnBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  columnCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyColumn: {
    backgroundColor: DARK_CARD,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderTopWidth: 3,
    borderTopColor: DARK_BORDER,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: DARK_MUTED,
  },
  ticketCard: {
    backgroundColor: DARK_CARD,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    borderTopWidth: 3,
    padding: SPACING.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ticketId: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK_TEXT,
    fontVariant: ['tabular-nums' as any],
  },
  vipBadge: {
    backgroundColor: '#7C3AED25',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.badge,
  },
  vipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  ticketTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  timerLabel: {
    fontSize: 11,
    color: DARK_MUTED,
  },
  timerTable: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_TEXT,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.button,
  },
  timerValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums' as any],
  },
  itemsList: {
    marginBottom: SPACING.sm,
    gap: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemBullet: {
    fontSize: 12,
    color: DARK_MUTED,
  },
  itemName: {
    fontSize: 12,
    color: DARK_TEXT,
  },
  itemMod: {
    fontSize: 11,
    color: DARK_MUTED,
  },
  itemAdvance: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.badge,
  },
  serveBtn: {
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  advanceBtn: {
    borderRadius: RADIUS.card,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  advanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});
