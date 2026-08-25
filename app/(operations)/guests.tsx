import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { BottomTabBar } from '@/components/operations/BottomTabBar';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { SRS, SLATE, BG, BLUE, EMERALD, AMBER, RED } from '@/lib/constants/figma-tokens';
import { RADIUS } from '@/constants/portal-theme';

const DARK = SLATE[900];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  checked_in: { bg: EMERALD[50], text: SRS.green, label: 'In House' },
  confirmed: { bg: BLUE[50], text: BLUE[600], label: 'Confirmed' },
  checked_out: { bg: SLATE[50], text: SLATE[500], label: 'Checked Out' },
};

type FilterType = 'all' | 'in_house' | 'frequent' | 'vip';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_house', label: 'In House' },
  { key: 'frequent', label: 'Frequent' },
  { key: 'vip', label: 'VIP' },
];

const AVATAR_COLORS = [SRS.teal, BLUE[600], AMBER[500], SRS.green, RED[500], SLATE[500]];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function GuestsScreen() {
  const { bookings } = useFrontDesk();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const guests = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string; status: string; stays: number; vip: boolean }>();
    bookings.forEach(b => {
      const key = b.guest_name;
      if (map.has(key)) {
        const g = map.get(key)!;
        g.stays += 1;
        if (b.status === 'checked_in') g.status = 'checked_in';
      } else {
        map.set(key, {
          name: b.guest_name,
          phone: b.phone || '',
          email: b.email || '',
          status: b.status,
          stays: 1,
          vip: !!b.vip,
        });
      }
    });
    return Array.from(map.values());
  }, [bookings]);

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (activeFilter === 'in_house') list = list.filter(g => g.status === 'checked_in');
    else if (activeFilter === 'vip') list = list.filter(g => g.vip);
    else if (activeFilter === 'frequent') list = list.filter(g => g.stays > 1);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [guests, activeFilter, searchQuery]);

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.logoContainer}>
              <Text style={s.logoText}>SE</Text>
            </View>
            <Text style={s.headerTitle}>Guests</Text>
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
              placeholder="Search by name, phone, email..."
              placeholderTextColor={SLATE[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={SLATE[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={s.filterRow}>
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
        </View>

        {/* Guest List */}
        <View style={s.section}>
          {filteredGuests.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={40} color={SLATE[300]} />
              <Text style={s.emptyText}>No guests found</Text>
            </View>
          ) : (
            filteredGuests.map((g, i) => {
              const sc = STATUS_COLORS[g.status] || STATUS_COLORS.confirmed;
              const color = getAvatarColor(g.name);
              return (
                <TouchableOpacity key={`${g.name}-${i}`} style={s.guestCard} activeOpacity={0.7}>
                  <View style={[s.guestAvatar, { backgroundColor: color + '18' }]}>
                    <Text style={[s.guestInitials, { color }]}>{getInitials(g.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.guestHeader}>
                      <Text style={s.guestName}>{g.name}</Text>
                      {g.vip && <Text style={s.vipBadge}>★ VIP</Text>}
                    </View>
                    <Text style={s.guestPhone}>{g.phone || 'No phone'}</Text>
                    <Text style={s.guestEmail}>{g.email || 'No email'}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[s.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <BottomTabBar />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 14, fontWeight: '800', color: BG.white },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: RED[500], alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: BG.white },
  avatarContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: SRS.green },

  searchSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG.white, borderRadius: RADIUS.card, paddingHorizontal: 14, borderWidth: 1, borderColor: SLATE[200], gap: 8, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: DARK },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[200] },
  filterChipActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  filterText: { fontSize: 12, fontWeight: '600', color: SLATE[500] },
  filterTextActive: { color: BG.white },

  section: { paddingHorizontal: 16 },

  guestCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: BG.white, borderWidth: 1, borderColor: SLATE[100], marginBottom: 8, gap: 12 },
  guestAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guestInitials: { fontSize: 14, fontWeight: '700' },
  guestHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guestName: { fontSize: 14, fontWeight: '700', color: DARK },
  vipBadge: { fontSize: 10, fontWeight: '700', color: AMBER[500] },
  guestPhone: { fontSize: 12, color: SLATE[500], marginTop: 2 },
  guestEmail: { fontSize: 11, color: SLATE[400], marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: SLATE[400] },
});
