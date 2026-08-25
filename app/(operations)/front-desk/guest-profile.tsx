import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useFrontDesk } from '@/lib/context/frontdesk-context';
import { useGuestStore } from '@/stores/useGuestStore';
import { SRS, SLATE, BG, BLUE, EMERALD, RED, AMBER, PURPLE } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY, SHADOWS } from '@/constants/portal-theme';
import { safeGoBack } from "@/lib/utils";

const DARK = SLATE[900];

const LOYALTY_TIERS: Record<string, { color: string; label: string }> = {
  standard: { color: SLATE[400], label: 'Standard' },
  silver: { color: SLATE[300], label: 'Silver' },
  gold: { color: AMBER[500], label: 'Gold' },
  platinum: { color: PURPLE[500], label: 'Platinum' },
};

const STAY_HISTORY = [
  { id: '1', dates: '3 Aug 2025 — 5 Aug 2025', room: 'Room 303', amount: 'NPR 12,000' },
  { id: '2', dates: '10 Jul 2025 — 12 Jul 2025', room: 'Room 205', amount: 'NPR 18,000' },
  { id: '3', dates: '25 Jun 2025 — 27 Jun 2025', room: 'Room 102', amount: 'NPR 15,000' },
  { id: '4', dates: '15 May 2025 — 17 May 2025', room: 'Room 305', amount: 'NPR 18,000' },
];

const PREFERENCES = ['King Bed', 'Non-Smoking', 'High Floor', 'Late Checkout'];

export default function GuestProfileScreen() {
  const { guestName } = useLocalSearchParams<{ guestName: string }>();
  const { bookings } = useFrontDesk();
  const guestStore = useGuestStore();

  const booking = useMemo(() => bookings.find(b => b.guest_name === guestName), [bookings, guestName]);
  const guestRecord = useMemo(() => guestStore.guests.find(g => g.name === guestName), [guestStore.guests, guestName]);

  const [newNote, setNewNote] = useState('');

  const displayName = guestName || booking?.guest_name || 'Guest';
  const email = booking?.email || 'guest@email.com';
  const phone = booking?.phone || '+977-9812345678';
  const room = booking?.room_number || '305';
  const roomType = booking?.room_type || 'Deluxe';
  const checkin = booking?.checkin || '5 Aug 2025';
  const checkout = booking?.checkout || '7 Aug 2025';
  const totalStays = guestRecord?.totalStays || 8;
  const loyaltyPoints = guestRecord?.loyaltyPoints || 1250;
  const loyaltyTier = guestRecord?.loyaltyTier || 'standard';
  const tierInfo = LOYALTY_TIERS[loyaltyTier] || LOYALTY_TIERS.standard;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={DARK} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Guest Profile</Text>
        <TouchableOpacity style={s.editBtn}>
          <Ionicons name="create-outline" size={20} color={DARK} />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={s.profileCard}>
        <View style={[s.profileAvatar, { backgroundColor: SRS.teal + '15' }]}>
          <Text style={s.profileInitial}>{displayName.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.profileName}>{displayName}</Text>
            <View style={[s.vipBadge, { backgroundColor: AMBER[500] + '18' }]}>
              <Text style={s.vipText}>VIP</Text>
            </View>
          </View>
          <Text style={s.profileEmail}>{email}</Text>
          <Text style={s.profilePhone}>{phone}</Text>
          <Text style={s.profileMeta}>Nepal · ramesh.thapa@email.com</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{totalStays}</Text>
          <Text style={s.statLabel}>Total Stays</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statValue, { color: tierInfo.color }]}>{loyaltyPoints.toLocaleString()}</Text>
          <Text style={s.statLabel}>Loyalty Points</Text>
        </View>
      </View>

      {/* Current Stay */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Current Stay</Text>
        <View style={s.stayCard}>
          <View style={s.stayInfo}>
            <Text style={s.stayRoom}>Room {room}</Text>
            <View style={s.inHouseBadge}>
              <Text style={s.inHouseText}>In House</Text>
            </View>
          </View>
          <View style={s.stayDetails}>
            <Ionicons name="calendar-outline" size={14} color={SLATE[400]} />
            <Text style={s.stayDates}>{checkin} — {checkout}</Text>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Preferences</Text>
        <View style={s.preferenceRow}>
          {PREFERENCES.map(pref => (
            <View key={pref} style={s.preferenceTag}>
              <Text style={s.preferenceText}>{pref}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Guest Notes */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Guest Notes</Text>
        <View style={s.notesCard}>
          <Text style={s.noteText}>• Prefers room with mountain view if available</Text>
          <Text style={s.noteText}>• Allergic to shellfish — inform restaurant</Text>
        </View>
        <View style={s.noteInputRow}>
          <TextInput
            placeholder="Add a note..."
            placeholderTextColor={SLATE[400]}
            value={newNote}
            onChangeText={setNewNote}
            style={s.noteInput}
          />
          <TouchableOpacity style={s.addNoteBtn}>
            <Ionicons name="add" size={20} color={BG.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stay History */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Stay History</Text>
          <TouchableOpacity>
            <Text style={s.viewAll}>View All History</Text>
          </TouchableOpacity>
        </View>
        <View style={s.historyCard}>
          {STAY_HISTORY.map((stay, i) => (
            <View key={stay.id} style={[s.historyRow, i < STAY_HISTORY.length - 1 && s.historyRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={s.historyDates}>{stay.dates}</Text>
                <Text style={s.historyRoom}>{stay.room}</Text>
              </View>
              <Text style={s.historyAmount}>{stay.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={s.section}>
        <View style={s.actionsGrid}>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(operations)/front-desk/check-in')}>
            <Ionicons name="call-outline" size={20} color={SRS.teal} />
            <Text style={[s.actionBtnText, { color: SRS.teal }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={SRS.teal} />
            <Text style={[s.actionBtnText, { color: SRS.teal }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Ionicons name="mail-outline" size={20} color={SRS.teal} />
            <Text style={[s.actionBtnText, { color: SRS.teal }]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Ionicons name="document-text-outline" size={20} color={SRS.teal} />
            <Text style={[s.actionBtnText, { color: SRS.teal }]}>Add Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={SRS.teal} />
            <Text style={[s.actionBtnText, { color: SRS.teal }]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: DARK, letterSpacing: -0.3 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16, marginBottom: 12,
    backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], gap: 14, ...SHADOWS.card,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  profileInitial: { fontSize: 24, fontWeight: '700', color: SRS.teal },
  profileName: { fontSize: 18, fontWeight: '700', color: DARK },
  profileEmail: { fontSize: 13, color: SLATE[400], marginTop: 2 },
  profilePhone: { fontSize: 13, color: SLATE[400], marginTop: 1 },
  profileMeta: { fontSize: 12, color: SLATE[500], marginTop: 1 },
  vipBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  vipText: { fontSize: 10, fontWeight: '700', color: AMBER[500] },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: DARK, fontVariant: ['tabular-nums' as any] },
  statLabel: { fontSize: 11, fontWeight: '600', color: SLATE[500], marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 10 },
  viewAll: { fontSize: 12, fontWeight: '600', color: SRS.teal },

  stayCard: { backgroundColor: BG.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SLATE[100] },
  stayInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stayRoom: { fontSize: 16, fontWeight: '700', color: DARK },
  inHouseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: EMERALD[50] },
  inHouseText: { fontSize: 10, fontWeight: '600', color: SRS.green },
  stayDetails: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stayDates: { fontSize: 13, color: SLATE[400] },

  preferenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preferenceTag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: SLATE[100] },
  preferenceText: { fontSize: 12, fontWeight: '600', color: SLATE[600] },

  notesCard: { backgroundColor: BG.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: SLATE[100], marginBottom: 10, gap: 6 },
  noteText: { fontSize: 13, color: SLATE[500] },

  noteInputRow: { flexDirection: 'row', gap: 8 },
  noteInput: { flex: 1, backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[200], paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: DARK },
  addNoteBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },

  historyCard: { backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], overflow: 'hidden' },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  historyDates: { fontSize: 13, fontWeight: '600', color: DARK },
  historyRoom: { fontSize: 12, color: SLATE[400], marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: '700', color: DARK },

  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100], gap: 4 },
  actionBtnText: { fontSize: 10, fontWeight: '600' },
});
