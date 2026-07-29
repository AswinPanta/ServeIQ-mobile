import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, STATUS_COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useShiftStore } from '@/stores/useShiftStore';
import { useActivityStore } from '@/stores/useActivityStore';
import { SystemFlowBar } from '@/components/operations/SystemFlowBar';
import { StatusBadge } from '@/components/ui/StatusBadge';

const QUICK_ACTIONS = [
  { id: 'new-booking', label: 'New Booking', icon: 'booking' as const, desc: 'Walk-in or phone', href: 'new-booking' as const, color: '#2980B9' },
  { id: 'check-in', label: 'Check-in', icon: 'checkin' as const, desc: 'Process arrival', href: 'check-in' as const, color: '#1E8449' },
  { id: 'check-out', label: 'Check-out', icon: 'checkout' as const, desc: 'Process departure', href: 'check-out' as const, color: '#D35400' },
  { id: 'guest-crm', label: 'Guest CRM', icon: 'person.fill' as const, desc: 'Guest profiles', href: 'guest-crm' as const, color: '#7C3AED' },
];

const ROOM_STATUSES = ['available', 'occupied', 'dirty', 'maintenance'] as const;
const STATUS_LABELS: Record<string, string> = {
  available: 'Available', occupied: 'Occupied', dirty: 'Dirty', maintenance: 'Maint.',
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  walk_in: { label: 'Walk-in', color: '#2980B9' },
  phone: { label: 'Phone', color: '#8E44AD' },
  online: { label: 'Online', color: '#1E8449' },
  ota: { label: 'OTA', color: '#D35400' },
  corporate: { label: 'Corporate', color: '#1A3C5E' },
  agent: { label: 'Agent', color: '#F39C12' },
};

export default function FrontDeskDashboard() {
  const {
    rooms, bookings, arrivingGuests, checkedInGuests, departingToday,
    summaryStats, occupancySnapshot, updateRoomStatus, searchReservations,
    timeline, cancelBooking,
  } = useFrontDesk();
  const shiftCheckIns = useShiftStore((s) => s.checkIns);
  const bookingTotal = useMemo(() => bookings.length, [bookings]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'arrivals' | 'inhouse' | 'departures'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchReservations(searchQuery);
  }, [searchQuery, searchReservations]);

  const showStatusMenu = useCallback((room: typeof rooms[0]) => {
    const isMaintenance = room.status === 'maintenance';
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];
    if (isMaintenance) {
      buttons.push({ text: 'Mark Available', onPress: () => updateRoomStatus(room.room_number, 'available') });
    }
    if (room.status !== 'maintenance') {
      buttons.push({ text: 'Mark Maintenance', onPress: () => updateRoomStatus(room.room_number, 'maintenance') });
    }
    if (room.status === 'dirty') {
      buttons.push({ text: 'Mark Available', onPress: () => updateRoomStatus(room.room_number, 'available') });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(`Room ${room.room_number} (${room.room_type})`, 'Change status:', buttons);
  }, [updateRoomStatus]);

  const handleCancelBooking = useCallback((bookingId: string, guestName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel reservation for ${guestName}? This will apply cancellation policy.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            cancelBooking(bookingId, 'Guest requested');
          },
        },
      ],
    );
  }, [cancelBooking]);

  const filteredRooms = statusFilter ? rooms.filter(r => r.status === statusFilter) : rooms;
  const statusCounts: Record<string, number> = {};
  rooms.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const numA = parseInt(a.room_number.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.room_number.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  const systemBarItems = [
    { label: 'Bookings', count: bookingTotal, active: true },
    { label: 'Check-Ins', count: shiftCheckIns },
    { label: 'Rooms', count: rooms.length },
    { label: 'Occupancy', count: occupancySnapshot.occupancyRate, suffix: '%' as const },
  ];

  const renderBookingCard = (b: typeof bookings[0]) => {
    const sourceInfo = b.source ? SOURCE_BADGES[b.source] : null;
    const isArriving = b.status === 'confirmed';
    const isInHouse = b.status === 'checked_in';
    const today = new Date().toISOString().slice(0, 10);
    const isDeparting = b.status === 'checked_in' && b.checkout === today;
    const bgColor = isDeparting ? '#FEF3C7' : isArriving ? '#EFF6FF' : isInHouse ? '#ECFDF5' : '#FFF';

    return (
      <TouchableOpacity
        key={b.id}
        onPress={() => {
          Alert.alert(
            `${b.guest_name}`,
            `Ref: ${b.ref}\nRoom: ${b.room_number || 'Not assigned'}\n${b.room_type}\n${b.checkin} → ${b.checkout}\n${b.source ? `Source: ${sourceInfo?.label || b.source}` : ''}${b.company ? `\nCompany: ${b.company}` : ''}${b.ota_ref ? `\nOTA Ref: ${b.ota_ref}` : ''}\nBalance: NPR ${(b.balance || 0).toLocaleString()}`,
            [
              { text: 'Close', style: 'cancel' },
              ...(isArriving ? [{ text: 'Cancel Booking', style: 'destructive' as const, onPress: () => handleCancelBooking(b.id, b.guest_name) }] : []),
            ],
          );
        }}
        style={[s.bookingCard, { backgroundColor: bgColor }]}
        activeOpacity={0.7}
      >
        <View style={[s.bookingRoomBadge, { backgroundColor: isDeparting ? '#F59E0B20' : isArriving ? '#2980B920' : '#1E844920' }]}>
          <Text style={[s.bookingRoomText, { color: isDeparting ? '#D35400' : isArriving ? '#2980B9' : '#1E8449' }]}>
            {b.room_number || '-'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.bookingName}>{b.guest_name}</Text>
            {b.vip && <Text style={s.vipBadge}>★ VIP</Text>}
          </View>
          <Text style={s.bookingMeta}>{b.room_type} · {b.ref}</Text>
          <Text style={s.bookingDate}>{b.checkin} → {b.checkout}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {isDeparting && (
            <View style={s.departBadge}>
              <Text style={s.departBadgeText}>Departing</Text>
            </View>
          )}
          {isArriving && (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(operations)/front-desk/check-in', params: { bookingRef: b.ref } })}
              style={s.quickCheckinBtn}
            >
              <Text style={s.quickCheckinText}>Check-in</Text>
            </TouchableOpacity>
          )}
          {sourceInfo && (
            <View style={[s.sourceBadge, { backgroundColor: sourceInfo.color + '15' }]}>
              <Text style={[s.sourceText, { color: sourceInfo.color }]}>{sourceInfo.label}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = (message: string) => (
    <View style={s.emptyState}>
      <IconSymbol name="booking" size={32} color={GRAY[300]} />
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: GRAY[50] }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Front Desk</Text>
            <Text style={s.headerSub}>
              {arrivingGuests.length} arrivals · {departingToday.length} departures · {occupancySnapshot.occupancyRate}% full
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={s.searchToggle}>
            <IconSymbol name="search" size={18} color={showSearch ? '#FFF' : SRS.navy} />
          </TouchableOpacity>
        </View>

        {/* Universal Search */}
        {showSearch && (
          <View style={s.searchSection}>
            <View style={s.searchInputRow}>
              <IconSymbol name="search" size={16} color={GRAY[400]} />
              <TextInput
                placeholder="Search by name, ref, email, phone, room, company, OTA ref, ID..."
                placeholderTextColor={GRAY[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                style={s.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={s.searchClear}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchResults.length > 0 && (
              <View style={s.searchResults}>
                <Text style={s.searchResultCount}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Text>
                {searchResults.map(renderBookingCard)}
              </View>
            )}
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <Text style={s.noResults}>No reservations found</Text>
            )}
          </View>
        )}

        <SystemFlowBar items={systemBarItems} />

        {/* KPI Row */}
        <View style={s.kpiRow}>
          <View style={[s.kpiCard, SHADOWS.card]}>
            <View style={[s.kpiIcon, { backgroundColor: SRS.green + '18' }]}>
              <IconSymbol name="checkin" size={16} color={SRS.green} />
            </View>
            <Text style={s.kpiValue}>{shiftCheckIns}</Text>
            <Text style={s.kpiLabel}>Check-ins</Text>
          </View>
          <View style={[s.kpiCard, SHADOWS.card]}>
            <View style={[s.kpiIcon, { backgroundColor: '#2980B918' }]}>
              <IconSymbol name="booking" size={16} color="#2980B9" />
            </View>
            <Text style={s.kpiValue}>{summaryStats.arrivals}</Text>
            <Text style={s.kpiLabel}>Arrivals</Text>
          </View>
          <View style={[s.kpiCard, SHADOWS.card]}>
            <View style={[s.kpiIcon, { backgroundColor: '#1E844918' }]}>
              <IconSymbol name="hotel" size={16} color="#1E8449" />
            </View>
            <Text style={s.kpiValue}>{summaryStats.inHouse}</Text>
            <Text style={s.kpiLabel}>In House</Text>
          </View>
          <View style={[s.kpiCard, SHADOWS.card]}>
            <View style={[s.kpiIcon, { backgroundColor: '#D3540018' }]}>
              <IconSymbol name="checkout" size={16} color="#D35400" />
            </View>
            <Text style={s.kpiValue}>{departingToday.length}</Text>
            <Text style={s.kpiLabel}>Departures</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={s.tabRow}>
          {[
            { key: 'overview' as const, label: 'Overview', icon: 'analytics' as const },
            { key: 'arrivals' as const, label: `Arrivals (${arrivingGuests.length})`, icon: 'checkin' as const },
            { key: 'inhouse' as const, label: `In House (${checkedInGuests.length})`, icon: 'hotel' as const },
            { key: 'departures' as const, label: `Departures (${departingToday.length})`, icon: 'checkout' as const },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            >
              <IconSymbol name={tab.icon} size={14} color={activeTab === tab.key ? '#FFF' : GRAY[500]} />
              <Text style={[s.tabLabel, activeTab === tab.key && { color: '#FFF' }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={s.section}>
          {activeTab === 'overview' && (
            <>
              {/* Occupancy Bar */}
              <View style={s.occupancyCard}>
                <Text style={s.occupancyTitle}>Occupancy</Text>
                <View style={s.occupancyBar}>
                  <View style={[s.occSegment, { flex: occupancySnapshot.occupied, backgroundColor: '#1E8449' }]} />
                  <View style={[s.occSegment, { flex: occupancySnapshot.available, backgroundColor: '#2980B9' }]} />
                  <View style={[s.occSegment, { flex: occupancySnapshot.dirty, backgroundColor: '#F59E0B' }]} />
                  <View style={[s.occSegment, { flex: occupancySnapshot.maintenance, backgroundColor: '#EF4444' }]} />
                </View>
                <View style={s.occLegend}>
                  {[
                    { label: 'Occupied', count: occupancySnapshot.occupied, color: '#1E8449' },
                    { label: 'Available', count: occupancySnapshot.available, color: '#2980B9' },
                    { label: 'Dirty', count: occupancySnapshot.dirty, color: '#F59E0B' },
                    { label: 'Maint.', count: occupancySnapshot.maintenance, color: '#EF4444' },
                  ].map(item => (
                    <View key={item.label} style={s.occLegendItem}>
                      <View style={[s.occDot, { backgroundColor: item.color }]} />
                      <Text style={s.occLegendText}>{item.label} ({item.count})</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Quick Actions */}
              <Text style={s.sectionTitle}>Quick Actions</Text>
              <View style={s.actionsRow}>
                {QUICK_ACTIONS.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => router.push(`/(operations)/front-desk/${a.href}`)}
                    style={[s.actionCard, SHADOWS.card]}
                    activeOpacity={0.8}
                  >
                    <View style={[s.actionIcon, { backgroundColor: a.color + '14' }]}>
                      <IconSymbol name={a.icon} size={22} color={a.color} />
                    </View>
                    <Text style={s.actionLabel}>{a.label}</Text>
                    <Text style={s.actionDesc}>{a.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Room Grid */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>
                  {statusFilter ? `Rooms — ${STATUS_LABELS[statusFilter]}` : 'All Rooms'}
                  <Text style={s.sectionCount}> ({filteredRooms.length})</Text>
                </Text>
                {statusFilter && (
                  <TouchableOpacity onPress={() => setStatusFilter(null)}>
                    <Text style={s.clearBtn}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  {ROOM_STATUSES.map(roomStatus => {
                    const color = STATUS_COLORS[roomStatus] || GRAY[400];
                    const active = statusFilter === roomStatus;
                    return (
                      <TouchableOpacity
                        key={roomStatus}
                        onPress={() => setStatusFilter(active ? null : roomStatus)}
                        style={[s.filterChip, { backgroundColor: active ? color : color + '15' }]}
                      >
                        <View style={[s.filterDot, { backgroundColor: active ? '#FFF' : color }]} />
                        <Text style={[s.filterText, { color: active ? '#FFF' : color }]}>
                          {STATUS_LABELS[roomStatus]} ({statusCounts[roomStatus] || 0})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={s.roomGrid}>
                {sortedRooms.map(room => {
                  const color = STATUS_COLORS[room.status] || GRAY[400];
                  return (
                    <View key={room.id} style={[s.roomCard, { borderColor: color + '25', backgroundColor: color + '08' }]}>
                      <TouchableOpacity
                        onPress={() => showStatusMenu(room)}
                        style={s.roomMenu}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <IconSymbol name="more.vert" size={14} color={GRAY[500]} />
                      </TouchableOpacity>
                      <Text style={s.roomNumber}>{room.room_number}</Text>
                      <Text style={s.roomType}>{room.room_type || ''}</Text>
                      <View style={[s.roomDot, { backgroundColor: color }]} />
                    </View>
                  );
                })}
              </View>

              {/* Timeline */}
              {timeline.length > 0 && (
                <View style={{ marginTop: SPACING.lg }}>
                  <Text style={s.sectionTitle}>Recent Timeline</Text>
                  {timeline.slice(0, 6).map(event => (
                    <View key={event.id} style={s.timelineRow}>
                      <View style={s.timelineDot} />
                      <View style={s.timelineContent}>
                        <Text style={s.timelineText}>{event.description}</Text>
                        <Text style={s.timelineMeta}>
                          {new Date(event.timestamp).toLocaleTimeString()} · {event.performedBy}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'arrivals' && (
            <>
              <Text style={s.sectionTitle}>
                {"Today's Arrivals"}
                <Text style={s.sectionCount}> ({arrivingGuests.length})</Text>
              </Text>
              {arrivingGuests.length === 0 ? renderEmpty('No arrivals today') : arrivingGuests.map(renderBookingCard)}
              <TouchableOpacity
                onPress={() => router.push('/(operations)/front-desk/new-booking')}
                style={s.quickAddBtn}
              >
                <IconSymbol name="add" size={16} color="#FFF" />
                <Text style={s.quickAddText}>Quick Walk-in Booking</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'inhouse' && (
            <>
              <Text style={s.sectionTitle}>
                {"Currently In House"}
                <Text style={s.sectionCount}> ({checkedInGuests.length})</Text>
              </Text>
              {checkedInGuests.length === 0
                ? renderEmpty('No guests currently checked in')
                : checkedInGuests.map(renderBookingCard)
              }
            </>
          )}

          {activeTab === 'departures' && (
            <>
              <Text style={s.sectionTitle}>
                {"Today's Departures"}
                <Text style={s.sectionCount}> ({departingToday.length})</Text>
              </Text>
              {departingToday.length === 0
                ? renderEmpty('No departures today')
                : departingToday.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => router.push({ pathname: '/(operations)/front-desk/check-out', params: { bookingRef: b.ref } })}
                      style={[s.bookingCard, { backgroundColor: '#FEF3C7' }]}
                      activeOpacity={0.7}
                    >
                      <View style={[s.bookingRoomBadge, { backgroundColor: '#F59E0B20' }]}>
                        <Text style={[s.bookingRoomText, { color: '#D35400' }]}>{b.room_number || '-'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.bookingName}>{b.guest_name}</Text>
                        <Text style={s.bookingMeta}>{b.room_type} · {b.ref}</Text>
                        <Text style={s.bookingDate}>Check-out today</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(operations)/front-desk/check-out', params: { bookingRef: b.ref } })}
                        style={s.departBtn}
                      >
                        <Text style={s.departBtnText}>Check-out</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
              }
            </>
          )}
        </View>
      </ScrollView>

      {/* Quick Booking FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(operations)/front-desk/new-booking')}
        style={s.fab}
        activeOpacity={0.85}
      >
        <IconSymbol name="add" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  headerSub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  searchToggle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GRAY[200] },
  searchSection: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: RADIUS.card, paddingHorizontal: 14, borderWidth: 1, borderColor: GRAY[200], gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 11 },
  searchClear: { fontSize: 12, fontWeight: '600', color: SRS.teal },
  searchResults: { marginTop: SPACING.sm, gap: SPACING.sm },
  searchResultCount: { ...TYPOGRAPHY.caption, color: GRAY[400], marginBottom: 4 },
  noResults: { ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', paddingVertical: SPACING.xl },
  kpiRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  kpiCard: { flex: 1, backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.md, alignItems: 'center', gap: 4 },
  kpiIcon: { width: 30, height: 30, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '800', color: SRS.navy, fontVariant: ['tabular-nums'] as any },
  kpiLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], textTransform: 'uppercase', letterSpacing: 0.3 },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: '#FFF', borderWidth: 1, borderColor: GRAY[200] },
  tabBtnActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[600] },
  section: { paddingHorizontal: SPACING.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h3, color: SRS.navy, fontWeight: '700', marginBottom: SPACING.md },
  sectionCount: { ...TYPOGRAPHY.body, color: GRAY[400], fontWeight: '400' },
  clearBtn: { ...TYPOGRAPHY.small, color: SRS.teal, fontWeight: '600' },

  // Occupancy
  occupancyCard: { backgroundColor: '#FFF', borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100], marginBottom: SPACING.lg },
  occupancyTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  occupancyBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: SPACING.md },
  occSegment: { height: '100%' },
  occLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  occLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  occDot: { width: 8, height: 8, borderRadius: 4 },
  occLegendText: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { ...TYPOGRAPHY.caption, fontWeight: '700' },

  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  roomCard: { width: '31%', paddingVertical: SPACING.md, borderRadius: RADIUS.card, alignItems: 'center', borderWidth: 1 },
  roomMenu: { position: 'absolute', top: 6, right: 8, zIndex: 1 },
  roomNumber: { fontSize: 16, fontWeight: '700', color: SRS.navy },
  roomType: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 2 },
  roomDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: '#FFF', alignItems: 'center', gap: 4 },
  actionIcon: { width: 40, height: 40, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', color: SRS.navy, fontSize: 11 },
  actionDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], textAlign: 'center', fontSize: 9 },

  bookingCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, marginBottom: SPACING.sm, borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md },
  bookingRoomBadge: { width: 40, height: 40, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  bookingRoomText: { fontSize: 14, fontWeight: '700' },
  bookingName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  bookingMeta: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 1 },
  bookingDate: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 2 },
  vipBadge: { fontSize: 10, fontWeight: '700', color: '#F59E0B' },
  departBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F59E0B20' },
  departBadgeText: { fontSize: 10, fontWeight: '600', color: '#D35400' },
  quickCheckinBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#1E8449' },
  quickCheckinText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceText: { fontSize: 9, fontWeight: '600' },
  departBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#D35400' },
  departBtnText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  quickAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.card, backgroundColor: SRS.teal, marginTop: SPACING.md },
  quickAddText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  emptyState: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },

  timelineRow: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm, borderLeftWidth: 2, borderLeftColor: SRS.teal + '30', paddingLeft: SPACING.md, marginLeft: 4 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SRS.teal, position: 'absolute', left: -5, top: 14 },
  timelineContent: { flex: 1 },
  timelineText: { ...TYPOGRAPHY.small, color: SRS.navy, fontWeight: '500' },
  timelineMeta: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 1 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center', ...SHADOWS.card },
});
