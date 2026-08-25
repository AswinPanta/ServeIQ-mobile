import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { BottomTabBar } from '@/components/operations/BottomTabBar';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { SRS, SLATE, BG, BLUE, EMERALD, RED, AMBER } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY } from '@/constants/portal-theme';

const DARK = SLATE[900];

type FilterType = 'today' | 'arrivals' | 'departures' | 'confirmed' | 'in_house';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'arrivals', label: 'Arrivals' },
  { key: 'departures', label: 'Departures' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_house', label: 'In House' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: BLUE[50], text: BLUE[600] },
  checked_in: { bg: EMERALD[50], text: SRS.green },
  checked_out: { bg: SLATE[50], text: SLATE[500] },
  cancelled: { bg: RED[50], text: RED[500] },
};

const AVATAR_COLORS = [SRS.teal, BLUE[600], AMBER[500], SRS.green, RED[500], PURPLE[700]];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

import { PURPLE } from '@/lib/constants/figma-tokens';

export default function ReservationsScreen() {
  const { bookings } = useFrontDesk();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrow = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }, []);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (activeFilter === 'arrivals') {
      list = list.filter(b => b.status === 'confirmed');
    } else if (activeFilter === 'departures') {
      list = list.filter(b => b.status === 'checked_in' && b.checkout === today);
    } else if (activeFilter === 'confirmed') {
      list = list.filter(b => b.status === 'confirmed');
    } else if (activeFilter === 'in_house') {
      list = list.filter(b => b.status === 'checked_in');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.guest_name.toLowerCase().includes(q) ||
        b.ref.toLowerCase().includes(q) ||
        b.room_type.toLowerCase().includes(q) ||
        (b.phone && b.phone.includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [bookings, activeFilter, searchQuery, today]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredBookings> = {};
    filteredBookings.forEach(b => {
      const date = b.checkin || 'Unknown';
      let label: string;
      if (date === today) {
        label = `Today, ${new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      } else if (date === tomorrow) {
        label = `Tomorrow, ${new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      } else {
        label = new Date(date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(b);
    });
    return Object.entries(groups);
  }, [filteredBookings, today, tomorrow]);

  const getRoomPrice = (roomType: string) => {
    switch (roomType) {
      case 'Suite': return 15000;
      case 'Deluxe': return 9000;
      default: return 6000;
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.logoContainer}>
              <Text style={s.logoText}>SE</Text>
            </View>
            <Text style={s.headerTitle}>Reservations</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.headerIconBtn}>
              <Ionicons name="notifications-outline" size={22} color={DARK} />
              <View style={s.notifBadge}><Text style={s.notifBadgeText}>3</Text></View>
            </TouchableOpacity>
            <View style={s.avatarContainer}>
              <Ionicons name="person" size={18} color={SLATE[400]} />
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchSection}>
          <View style={s.searchInputRow}>
            <Ionicons name="search" size={16} color={SLATE[400]} />
            <TextInput
              placeholder="Search by name, ref, phone, email..."
              placeholderTextColor={SLATE[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
            />
            <TouchableOpacity style={s.filterIconBtn}>
              <Ionicons name="options-outline" size={18} color={DARK} />
            </TouchableOpacity>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={SLATE[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[s.filterChip, active && s.filterChipActive]}
              >
                <Text style={[s.filterText, active && s.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bookings */}
        <View style={s.section}>
          {grouped.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="calendar-outline" size={40} color={SLATE[300]} />
              <Text style={s.emptyText}>No reservations found</Text>
            </View>
          ) : (
            grouped.map(([dateLabel, items]) => (
              <View key={dateLabel} style={s.dateGroup}>
                <Text style={s.dateLabel}>{dateLabel}</Text>
                {items.map(b => {
                  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.confirmed;
                  const price = getRoomPrice(b.room_type);
                  const color = getAvatarColor(b.guest_name);
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={s.bookingCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (b.status === 'confirmed') {
                          router.push({ pathname: '/(operations)/front-desk/check-in', params: { bookingRef: b.ref } });
                        } else if (b.status === 'checked_in') {
                          router.push({ pathname: '/(operations)/front-desk/check-out', params: { bookingRef: b.ref } });
                        }
                      }}
                    >
                      <View style={[s.bookingAvatar, { backgroundColor: color + '18' }]}>
                        <Text style={[s.bookingInitial, { color }]}>{b.guest_name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={s.bookingHeader}>
                          <Text style={s.guestName}>{b.guest_name}</Text>
                          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                            <Text style={[s.statusText, { color: sc.text }]}>{b.status === 'checked_in' ? 'Checked In' : b.status === 'confirmed' ? 'Confirmed' : 'Checked Out'}</Text>
                          </View>
                        </View>
                        <Text style={s.roomType}>{b.room_type} Room</Text>
                        <View style={s.bookingDates}>
                          <Text style={s.dateText}>{b.checkin}</Text>
                          <Text style={s.dateSep}>→</Text>
                          <Text style={s.dateText}>{b.checkout}</Text>
                        </View>
                        <View style={s.bookingFooter}>
                          <Text style={s.refText}>REF {b.ref}</Text>
                          <Text style={s.priceText}>NPR {price.toLocaleString()}</Text>
                        </View>
                        {(b.balance || 0) > 0 && (
                          <Text style={s.outstandingText}>Outstanding NPR {b.balance!.toLocaleString()}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <BottomTabBar />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 14, fontWeight: '800', color: BG.white },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: RED[500], alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: BG.white },
  avatarContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: SRS.green },

  searchSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, paddingHorizontal: 14, borderWidth: 1, borderColor: SLATE[200], gap: 8, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: DARK },
  filterIconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },

  filterScroll: { paddingHorizontal: 16, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200] },
  filterChipActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  filterText: { fontSize: 13, fontWeight: '600', color: SLATE[500] },
  filterTextActive: { color: BG.white },

  section: { paddingHorizontal: 16 },
  dateGroup: { marginBottom: 16 },
  dateLabel: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 8 },

  bookingCard: {
    flexDirection: 'row', padding: 12, borderRadius: 12,
    backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100],
    marginBottom: 8, gap: 12,
  },
  bookingAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookingInitial: { fontSize: 18, fontWeight: '700' },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guestName: { fontSize: 14, fontWeight: '700', color: DARK, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  roomType: { fontSize: 12, color: SLATE[500], marginTop: 2 },
  bookingDates: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dateText: { fontSize: 11, color: SLATE[400] },
  dateSep: { fontSize: 11, color: SLATE[300] },
  bookingFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  refText: { fontSize: 11, color: SRS.teal, fontWeight: '600' },
  priceText: { fontSize: 14, fontWeight: '700', color: DARK },
  outstandingText: { fontSize: 11, fontWeight: '600', color: SRS.orange, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: SLATE[400] },
});
