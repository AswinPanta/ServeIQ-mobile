import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, STATUS_COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useShiftStore } from '@/stores/useShiftStore';
import { useAuth } from '@/lib/context/auth-context';
import { staffApi } from '@/lib/api/host-api';
import type { BackendActivityLog } from '@/types/api';
import { SystemFlowBar } from '@/components/operations/SystemFlowBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_COLORS as STATUS_COLORSTokens, SRS as SRSTokens, PURPLE, BRAND, ORANGE, AMBER, BLUE, EMERALD, BG, RED, FLAT, UI, SLATE } from '@/lib/constants/figma-tokens';

const QUICK_ACTIONS = [
  { id: 'new-booking', label: 'New Booking', icon: 'booking' as const, desc: 'Walk-in or phone', href: 'new-booking' as const, color: STATUS_COLORSTokens.occupied },
  { id: 'check-in', label: 'Check-in', icon: 'checkin' as const, desc: 'Process arrival', href: 'check-in' as const, color: SRSTokens.green },
  { id: 'check-out', label: 'Check-out', icon: 'checkout' as const, desc: 'Process departure', href: 'check-out' as const, color: SRSTokens.orange },
  { id: 'guest-crm', label: 'Guest CRM', icon: 'person.fill' as const, desc: 'Guest profiles', href: 'guest-crm' as const, color: PURPLE[700] },
  { id: 'room-status', label: 'Room Status', icon: 'rooms' as const, desc: 'Live grid', href: 'room-status' as const, color: BLUE[500] },
  { id: 'payments', label: 'Payments', icon: 'payment' as const, desc: 'History & refunds', href: 'payments' as const, color: EMERALD[600] },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' as const, desc: 'HK & requests', href: 'tasks' as const, color: AMBER[700] },
  { id: 'notifications', label: 'Inbox', icon: 'bell' as const, desc: 'Alerts', href: 'notifications' as const, color: RED[500] },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function activityIcon(type: string): string {
  const t = type.toUpperCase();
  if (t.includes('CHECK_IN')) return 'checkin';
  if (t.includes('CHECK_OUT')) return 'checkout';
  if (t.includes('CANCEL')) return 'close';
  if (t.includes('CLEAN') || t.includes('INSPECT')) return 'cleaning';
  if (t.includes('MAINTENANCE')) return 'room.maintenance';
  return 'receipt';
}

function activityColor(type: string): string {
  const t = type.toUpperCase();
  if (t.includes('CHECK_IN')) return SRSTokens.green;
  if (t.includes('CHECK_OUT')) return SRSTokens.orange;
  if (t.includes('CANCEL')) return RED[500];
  if (t.includes('CLEAN') || t.includes('INSPECT')) return SRS.teal;
  if (t.includes('MAINTENANCE')) return SRSTokens.orange;
  return STATUS_COLORSTokens.occupied;
}

function relTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ROOM_STATUSES = ['available', 'occupied', 'dirty', 'maintenance'] as const;
const STATUS_LABELS: Record<string, string> = {
  available: 'Available', occupied: 'Occupied', dirty: 'Dirty', maintenance: 'Maint.',
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  walk_in: { label: 'Walk-in', color: STATUS_COLORSTokens.occupied },
  phone: { label: 'Phone', color: STATUS_COLORSTokens.inspected },
  online: { label: 'Online', color: SRSTokens.green },
  ota: { label: 'OTA', color: SRSTokens.orange },
  corporate: { label: 'Corporate', color: BRAND.navyLight },
  agent: { label: 'Agent', color: ORANGE[400] },
};

export default function FrontDeskDashboard() {
  const {
    rooms, bookings, arrivingGuests, checkedInGuests, departingToday,
    summaryStats, occupancySnapshot, updateRoomStatus, searchReservations,
    timeline, cancelBooking, bookingGuestsData,
  } = useFrontDesk();
  const { user } = useAuth();
  const shiftCheckIns = useShiftStore((s) => s.checkIns);
  const [activities, setActivities] = useState<BackendActivityLog[]>([]);

  // Fetch real-time activity feeds from backend
  useEffect(() => {
    const propId = (user as { property_id?: string } | null)?.property_id;
    if (!propId || !UUID_RE.test(propId)) return;
    let cancelled = false;
    Promise.all([
      staffApi.getBookingActivities(propId, { skip: 0, limit: 10 }),
      staffApi.getHousekeepingActivities(propId, { skip: 0, limit: 10 }),
    ])
      .then(([booking, hk]) => {
        if (cancelled) return;
        const merged = [...booking, ...hk]
          .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))
          .slice(0, 8);
        setActivities(merged);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);
  const bookingTotal = useMemo(() => bookings.length, [bookings]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'arrivals' | 'inhouse' | 'departures'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navRef = useRef(false);
  const safeNav = useCallback((href: any) => {
    if (navRef.current) return;
    navRef.current = true;
    router.push(href);
    setTimeout(() => { navRef.current = false; }, 400);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchReservations(searchQuery);
  }, [searchQuery, searchReservations]);

  /** Quick lookup: ref_number → rich guest data from booking-guests endpoint */
  const guestLookup = useMemo(() => {
    const map = new Map<string, typeof bookingGuestsData[0]>();
    bookingGuestsData.forEach(g => map.set(g.ref_number, g));
    return map;
  }, [bookingGuestsData]);

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
    const bgColor = isDeparting ? AMBER[100] : isArriving ? BLUE[50] : isInHouse ? EMERALD[50] : BG.white;
    const guestData = guestLookup.get(b.ref);

    return (
      <TouchableOpacity
        key={b.id}
        onPress={() => {
          Alert.alert(
            `${b.guest_name}`,
            `Ref: ${b.ref}\nRoom: ${b.room_number || 'Not assigned'}\n${b.room_type}\n${b.checkin} → ${b.checkout}\n${guestData ? `Adults: ${guestData.number_of_adults}${guestData.number_of_children ? `, Children: ${guestData.number_of_children}` : ''}\nPayment: ${guestData.payment_status || '—'}\nTotal: NPR ${(guestData.total_amount || 0).toLocaleString()}\n` : ''}${b.source ? `Source: ${sourceInfo?.label || b.source}` : ''}${b.company ? `\nCompany: ${b.company}` : ''}${b.ota_ref ? `\nOTA Ref: ${b.ota_ref}` : ''}\nBalance: NPR ${(b.balance || 0).toLocaleString()}`,
            [
              { text: 'Close', style: 'cancel' },
              ...(isArriving ? [{ text: 'Cancel Booking', style: 'destructive' as const, onPress: () => handleCancelBooking(b.id, b.guest_name) }] : []),
            ],
          );
        }}
        style={[s.bookingCard, { backgroundColor: bgColor }]}
        activeOpacity={0.7}
      >
        <View style={[s.bookingRoomBadge, { backgroundColor: isDeparting ? AMBER[500] + '20' : isArriving ? FLAT.blue + '20' : FLAT.green + '20' }]}>
          <Text style={[s.bookingRoomText, { color: isDeparting ? SRSTokens.orange : isArriving ? STATUS_COLORSTokens.occupied : SRSTokens.green }]}>
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
          {guestData?.payment_status && (
            <Text style={[s.bookingMeta, { color: guestData.payment_status === 'PAID' ? '#10B981' : guestData.payment_status === 'UNPAID' ? '#EF4444' : '#F59E0B', marginTop: 2 }]}>
              {guestData.payment_status === 'PAID' ? '● Paid' : guestData.payment_status === 'UNPAID' ? '● Unpaid' : `● ${guestData.payment_status}`}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {isDeparting && (
            <View style={s.departBadge}>
              <Text style={s.departBadgeText}>Departing</Text>
            </View>
          )}
          {isArriving && (
            <TouchableOpacity
              onPress={() => safeNav({ pathname: '/(operations)/front-desk/check-in', params: { bookingRef: b.ref } })}
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
            <IconSymbol name="search" size={18} color={showSearch ? BG.white : SRS.navy} />
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
            <View style={[s.kpiIcon, { backgroundColor: FLAT.blue + '18' }]}>
              <IconSymbol name="booking" size={16} color={STATUS_COLORSTokens.occupied} />
            </View>
            <Text style={s.kpiValue}>{summaryStats.arrivals}</Text>
            <Text style={s.kpiLabel}>Arrivals</Text>
          </View>
          <View style={[s.kpiCard, SHADOWS.card]}>
            <View style={[s.kpiIcon, { backgroundColor: FLAT.green + '18' }]}>
              <IconSymbol name="hotel" size={16} color={SRSTokens.green} />
            </View>
            <Text style={s.kpiValue}>{summaryStats.inHouse}</Text>
            <Text style={s.kpiLabel}>In House</Text>
          </View>
          <View style={[s.kpiCard, SHADOWS.card]}>
            <View style={[s.kpiIcon, { backgroundColor: UI.warning + '18' }]}>
              <IconSymbol name="checkout" size={16} color={SRSTokens.orange} />
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
              <IconSymbol name={tab.icon} size={14} color={activeTab === tab.key ? BG.white : GRAY[500]} />
              <Text style={[s.tabLabel, activeTab === tab.key && { color: BG.white }]}>{tab.label}</Text>
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
                  <View style={[s.occSegment, { flex: occupancySnapshot.occupied, backgroundColor: SRSTokens.green }]} />
                  <View style={[s.occSegment, { flex: occupancySnapshot.available, backgroundColor: STATUS_COLORSTokens.occupied }]} />
                  <View style={[s.occSegment, { flex: occupancySnapshot.dirty, backgroundColor: AMBER[500] }]} />
                  <View style={[s.occSegment, { flex: occupancySnapshot.maintenance, backgroundColor: RED[500] }]} />
                </View>
                <View style={s.occLegend}>
                  {[
                    { label: 'Occupied', count: occupancySnapshot.occupied, color: SRSTokens.green },
                    { label: 'Available', count: occupancySnapshot.available, color: STATUS_COLORSTokens.occupied },
                    { label: 'Dirty', count: occupancySnapshot.dirty, color: AMBER[500] },
                    { label: 'Maint.', count: occupancySnapshot.maintenance, color: RED[500] },
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
                  <View key={a.id} style={s.actionCardWrap}>
                    <TouchableOpacity
                      onPress={() => safeNav(`/(operations)/front-desk/${a.href}`)}
                      style={[s.actionCard, SHADOWS.card]}
                      activeOpacity={0.8}
                    >
                      <View style={[s.actionIcon, { backgroundColor: a.color + '14' }]}>
                        <IconSymbol name={a.icon} size={22} color={a.color} />
                      </View>
                      <Text style={s.actionLabel}>{a.label}</Text>
                      <Text style={s.actionDesc}>{a.desc}</Text>
                    </TouchableOpacity>
                  </View>
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
                        <View style={[s.filterDot, { backgroundColor: active ? BG.white : color }]} />
                        <Text style={[s.filterText, { color: active ? BG.white : color }]}>
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

              {/* Recent Activity (server feed) */}
              {activities.length > 0 && (
                <View style={{ marginTop: SPACING.lg }}>
                  <Text style={s.sectionTitle}>Recent Activity</Text>
                  {activities.map((a, i) => (
                    <View key={a.id} style={[s.timelineRow, i < activities.length - 1 && { borderBottomWidth: 1, borderBottomColor: GRAY[100] }]}>
                      <View style={[s.timelineDot, { backgroundColor: activityColor(a.activity_type) }]} />
                      <View style={s.timelineContent}>
                        <Text style={s.timelineText} numberOfLines={1}>{a.description}</Text>
                        <Text style={s.timelineMeta}>
                          {a.staff_name}{a.staff_name ? ' · ' : ''}{relTime(a.created_at)}
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
                onPress={() => safeNav('/(operations)/front-desk/new-booking')}
                style={s.quickAddBtn}
              >
                <IconSymbol name="add" size={16} color={BG.white} />
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
                      onPress={() => safeNav({ pathname: '/(operations)/front-desk/check-out', params: { bookingRef: b.ref } })}
                      style={[s.bookingCard, { backgroundColor: AMBER[100] }]}
                      activeOpacity={0.7}
                    >
                      <View style={[s.bookingRoomBadge, { backgroundColor: AMBER[500] + '20' }]}>
                        <Text style={[s.bookingRoomText, { color: SRSTokens.orange }]}>{b.room_number || '-'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.bookingName}>{b.guest_name}</Text>
                        <Text style={s.bookingMeta}>{b.room_type} · {b.ref}</Text>
                        <Text style={s.bookingDate}>Check-out today</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => safeNav({ pathname: '/(operations)/front-desk/check-out', params: { bookingRef: b.ref } })}
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
        <IconSymbol name="add" size={24} color={BG.white} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy },
  headerSub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  searchToggle: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: GRAY[200] },
  searchSection: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, paddingHorizontal: 14, borderWidth: 1, borderColor: GRAY[200], gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: SRS.navy, paddingVertical: 11 },
  searchClear: { fontSize: 12, fontWeight: '600', color: SRS.teal },
  searchResults: { marginTop: SPACING.sm, gap: SPACING.sm },
  searchResultCount: { ...TYPOGRAPHY.caption, color: GRAY[400], marginBottom: 4 },
  noResults: { ...TYPOGRAPHY.body, color: GRAY[400], textAlign: 'center', paddingVertical: SPACING.xl },
  kpiRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  kpiCard: { flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.md, alignItems: 'center', gap: 4 },
  kpiIcon: { width: 30, height: 30, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 18, fontWeight: '800', color: SRS.navy, fontVariant: ['tabular-nums'] },
  kpiLabel: { ...TYPOGRAPHY.caption, color: GRAY[500], textTransform: 'uppercase', letterSpacing: 0.3 },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200] },
  tabBtnActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[600] },
  section: { paddingHorizontal: SPACING.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h3, color: SRS.navy, fontWeight: '700', marginBottom: SPACING.md },
  sectionCount: { ...TYPOGRAPHY.body, color: GRAY[400], fontWeight: '400' },
  clearBtn: { ...TYPOGRAPHY.small, color: SRS.teal, fontWeight: '600' },

  // Occupancy
  occupancyCard: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100], marginBottom: SPACING.lg },
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

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  actionCardWrap: { width: '23.5%', minWidth: 76 },
  actionCard: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', gap: 4 },
  actionIcon: { width: 40, height: 40, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionLabel: { ...TYPOGRAPHY.caption, fontWeight: '700', color: SRS.navy, fontSize: 11 },
  actionDesc: { ...TYPOGRAPHY.caption, color: GRAY[500], textAlign: 'center', fontSize: 9 },

  bookingCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, marginBottom: SPACING.sm, borderWidth: 1, borderColor: GRAY[100], gap: SPACING.md },
  bookingRoomBadge: { width: 40, height: 40, borderRadius: RADIUS.card, alignItems: 'center', justifyContent: 'center' },
  bookingRoomText: { fontSize: 14, fontWeight: '700' },
  bookingName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  bookingMeta: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 1 },
  bookingDate: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 2 },
  vipBadge: { fontSize: 10, fontWeight: '700', color: AMBER[500] },
  departBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: AMBER[500] + '20' },
  departBadgeText: { fontSize: 10, fontWeight: '600', color: SRSTokens.orange },
  quickCheckinBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: SRSTokens.green },
  quickCheckinText: { fontSize: 10, fontWeight: '600', color: BG.white },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceText: { fontSize: 9, fontWeight: '600' },
  departBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: SRSTokens.orange },
  departBtnText: { fontSize: 11, fontWeight: '600', color: BG.white },
  quickAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.card, backgroundColor: SRS.teal, marginTop: SPACING.md },
  quickAddText: { fontSize: 14, fontWeight: '700', color: BG.white },

  emptyState: { padding: SPACING.xxl, alignItems: 'center', gap: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },

  timelineRow: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm, borderLeftWidth: 2, borderLeftColor: SRS.teal + '30', paddingLeft: SPACING.md, marginLeft: 4 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SRS.teal, position: 'absolute', left: -5, top: 14 },
  timelineContent: { flex: 1 },
  timelineText: { ...TYPOGRAPHY.small, color: SRS.navy, fontWeight: '500' },
  timelineMeta: { ...TYPOGRAPHY.caption, color: GRAY[400], marginTop: 1 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center', ...SHADOWS.card },
});