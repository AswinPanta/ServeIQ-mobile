import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';
import { useGuestStore } from '@/stores/useGuestStore';
import { safeGoBack } from "@/lib/utils";
import { STATUS_COLORS, BG, SRS as SRSTokens, AMBER, FLAT } from '@/lib/constants/figma-tokens';
;
;

type Tab = 'search' | 'profile' | 'recent';

const LOYALTY_TIER_CONFIG: Record<string, { color: string; label: string; minPoints: number }> = {
  standard: { color: STATUS_COLORS.bronze, label: 'Standard', minPoints: 0 },
  silver: { color: STATUS_COLORS.silver, label: 'Silver', minPoints: 500 },
  gold: { color: STATUS_COLORS.gold, label: 'Gold', minPoints: 2000 },
  platinum: { color: STATUS_COLORS.platinum, label: 'Platinum', minPoints: 5000 },
};

export default function GuestCRMScreen() {
  const guestStore = useGuestStore();
  const { guests, findGuest, addGuest, addNote, recordStay, earnPoints, toggleVip } = guestStore;

  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  // New guest form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNationality, setNewNationality] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');

  const selectedGuest = selectedGuestId ? guests.find(g => g.id === selectedGuestId) : null;

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return findGuest(searchQuery);
  }, [searchQuery, findGuest]);

  const recentGuests = useMemo(() => {
    return [...guests].sort((a, b) => b.totalStays - a.totalStays).slice(0, 20);
  }, [guests]);

  const tierColor = (tier: string) => LOYALTY_TIER_CONFIG[tier]?.color || GRAY[500];
  const tierLabel = (tier: string) => LOYALTY_TIER_CONFIG[tier]?.label || tier;

  const handleAddNote = () => {
    if (!selectedGuestId || !newNote.trim()) return;
    addNote(selectedGuestId, newNote.trim());
    setNewNote('');
    Alert.alert('Note Added', 'Guest note saved successfully');
  };

  const handleCreateGuest = () => {
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim()) {
      Alert.alert('Incomplete', 'Name, email and phone are required');
      return;
    }
    addGuest({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      nationality: newNationality,
      documentType: 'Passport',
      documentNumber: newDocNumber,
      notes: '',
    });
    setShowNewForm(false);
    setNewName(''); setNewEmail(''); setNewPhone('');
    setNewNationality(''); setNewDocNumber('');
    Alert.alert('Guest Added', 'New guest profile created');
  };

  const nextTierInfo = (points: number) => {
    if (points >= 5000) return null;
    if (points >= 2000) return { next: 'Platinum', need: 5000 - points };
    if (points >= 500) return { next: 'Gold', need: 2000 - points };
    return { next: 'Silver', need: 500 - points };
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
          <IconSymbol name="arrow.back" size={18} color={GRAY[500]} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Guest CRM</Text>
          <Text style={s.sub}>{guests.length} total guests</Text>
        </View>
        <TouchableOpacity onPress={() => setShowNewForm(true)} style={s.addBtn}>
          <IconSymbol name="add" size={16} color={BG.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {[
          { key: 'search' as Tab, label: 'Search', icon: 'search' as const },
          { key: 'profile' as Tab, label: 'Profile', icon: 'person.fill' as const },
          { key: 'recent' as Tab, label: 'Top Guests', icon: 'star' as const },
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

      <View style={s.body}>
        {activeTab === 'search' && (
          <View>
            <TextInput
              placeholder="Search by name, email, or phone..."
              placeholderTextColor={GRAY[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={s.searchInput}
              autoFocus
            />

            {searchResults.length === 0 && searchQuery.length > 0 && (
              <View style={s.emptyState}>
                <Text style={s.emptyText}>No guests found</Text>
                <TouchableOpacity onPress={() => { setShowNewForm(true); setSearchQuery(''); }} style={s.createBtn}>
                  <Text style={s.createBtnText}>Create new guest</Text>
                </TouchableOpacity>
              </View>
            )}

            {searchResults.map(g => (
              <TouchableOpacity key={g.id} onPress={() => { setSelectedGuestId(g.id); setActiveTab('profile'); }}
                style={s.guestCard}
              >
                <View style={[s.guestAvatar, { backgroundColor: g.vip ? AMBER[500] + '20' : SRS.teal + '12' }]}>
                  <Text style={[s.guestInitial, { color: g.vip ? SRSTokens.orange : SRS.teal }]}>{g.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.guestName}>{g.name}</Text>
                    {g.vip && <Text style={s.vipBadge}>★ VIP</Text>}
                  </View>
                  <Text style={s.guestMeta}>{g.email} · {g.phone}</Text>
                  <Text style={s.guestMeta}>{g.totalStays} stays · NPR {g.totalSpent.toLocaleString()}</Text>
                </View>
                <View style={[s.tierBadge, { backgroundColor: tierColor(g.loyaltyTier) + '18' }]}>
                  <Text style={[s.tierBadgeText, { color: tierColor(g.loyaltyTier) }]}>{tierLabel(g.loyaltyTier)}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {searchQuery.length === 0 && (
              <View style={s.emptyState}>
                <IconSymbol name="search" size={40} color={GRAY[300]} />
                <Text style={s.hintText}>Search guests by name, email, or phone number</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'profile' && selectedGuest ? (
          <View style={{ gap: SPACING.lg }}>
            {/* Profile Header */}
            <View style={s.profileCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <View style={[s.profileAvatar, { backgroundColor: selectedGuest.vip ? AMBER[500] + '20' : SRS.teal + '15' }]}>
                  <Text style={[s.profileInitial, { color: selectedGuest.vip ? SRSTokens.orange : SRS.teal, fontSize: 24 }]}>
                    {selectedGuest.name[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.profileName}>{selectedGuest.name}</Text>
                    <TouchableOpacity onPress={() => toggleVip(selectedGuest.id)}>
                      <Text style={{ fontSize: 18 }}>{selectedGuest.vip ? '⭐' : '☆'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.profileMeta}>{selectedGuest.email}</Text>
                  <Text style={s.profileMeta}>{selectedGuest.phone}</Text>
                  <Text style={s.profileMeta}>ID: {selectedGuest.documentNumber} · {selectedGuest.nationality}</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={s.statValue}>{selectedGuest.totalStays}</Text>
                <Text style={s.statLabel}>Stays</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statValue}>NPR {selectedGuest.totalSpent.toLocaleString()}</Text>
                <Text style={s.statLabel}>Total Spent</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statValue, { color: tierColor(selectedGuest.loyaltyTier) }]}>{selectedGuest.loyaltyPoints}</Text>
                <Text style={s.statLabel}>Points</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statValue, { color: tierColor(selectedGuest.loyaltyTier) }]}>{tierLabel(selectedGuest.loyaltyTier)}</Text>
                <Text style={s.statLabel}>Tier</Text>
              </View>
            </View>

            {/* Loyalty Progress */}
            {(() => {
              const info = nextTierInfo(selectedGuest.loyaltyPoints);
              if (!info) return (
                <View style={[s.loyaltyCard, { backgroundColor: FLAT.gold + '15', borderColor: STATUS_COLORS.gold }]}>
                  <Text style={s.loyaltyTitle}>🏆 Platinum Member</Text>
                  <Text style={s.loyaltyDesc}>Top tier — all premium benefits unlocked</Text>
                </View>
              );
              const progress = selectedGuest.loyaltyPoints / (selectedGuest.loyaltyPoints + info.need);
              return (
                <View style={s.loyaltyCard}>
                  <Text style={s.loyaltyTitle}>{info.need} points to {info.next}</Text>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: tierColor(selectedGuest.loyaltyTier) }]} />
                  </View>
                  <Text style={s.loyaltyDesc}>{selectedGuest.loyaltyPoints} points earned</Text>
                </View>
              );
            })()}

            {/* Notes */}
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Notes</Text>
              <View style={s.noteInputRow}>
                <TextInput
                  placeholder="Add a note..."
                  placeholderTextColor={GRAY[400]}
                  value={newNote}
                  onChangeText={setNewNote}
                  style={s.noteInput}
                  multiline
                />
                <TouchableOpacity onPress={handleAddNote} disabled={!newNote.trim()} style={[s.noteAddBtn, { opacity: newNote.trim() ? 1 : 0.4 }]}>
                  <Text style={s.noteAddText}>Add</Text>
                </TouchableOpacity>
              </View>
              {selectedGuest.notes ? (
                selectedGuest.notes.split('\n').filter(n => n.trim()).map((note, i) => (
                  <View key={i} style={s.noteRow}>
                    <View style={s.noteDot} />
                    <Text style={s.noteText}>{note}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.noNotes}>No notes yet</Text>
              )}
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              <TouchableOpacity onPress={() => { earnPoints(selectedGuest.id, 100); Alert.alert('Points Added', '100 bonus points awarded'); }} style={s.actionBtn}>
                <Text style={s.actionBtnText}>+100 Points</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { recordStay(selectedGuest.id, 1); }} style={s.actionBtn}>
                <Text style={s.actionBtnText}>Record Stay</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'profile' && !selectedGuest ? (
          <View style={s.emptyState}>
            <IconSymbol name="person.fill" size={40} color={GRAY[300]} />
            <Text style={s.hintText}>Search and select a guest to view their profile</Text>
          </View>
        ) : null}

        {activeTab === 'recent' && (
          <View>
            <Text style={s.sectionTitle}>Top Guests by Stays</Text>
            {recentGuests.map((g, i) => (
              <TouchableOpacity key={g.id} onPress={() => { setSelectedGuestId(g.id); setActiveTab('profile'); }}
                style={[s.guestCard, i === 0 && { backgroundColor: FLAT.gold + '10', borderColor: STATUS_COLORS.gold }]}
              >
                <View style={s.rankBadge}>
                  <Text style={s.rankText}>{i + 1}</Text>
                </View>
                <View style={[s.guestAvatar, { backgroundColor: g.vip ? AMBER[500] + '20' : SRS.teal + '12' }]}>
                  <Text style={[s.guestInitial, { color: g.vip ? SRSTokens.orange : SRS.teal }]}>{g.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.guestName}>{g.name}</Text>
                    {g.vip && <Text style={s.vipBadge}>VIP</Text>}
                  </View>
                  <Text style={s.guestMeta}>{g.totalStays} stays · NPR {g.totalSpent.toLocaleString()}</Text>
                </View>
                <View style={[s.tierBadge, { backgroundColor: tierColor(g.loyaltyTier) + '18' }]}>
                  <Text style={[s.tierBadgeText, { color: tierColor(g.loyaltyTier) }]}>{tierLabel(g.loyaltyTier)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* New Guest Modal */}
      {showNewForm && (
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Guest</Text>
            <View style={{ gap: SPACING.md }}>
              {[
                { label: 'Full Name', val: newName, set: setNewName, required: true },
                { label: 'Email', val: newEmail, set: setNewEmail, keyboard: 'email-address' as const },
                { label: 'Phone', val: newPhone, set: setNewPhone, keyboard: 'phone-pad' as const },
                { label: 'Nationality', val: newNationality, set: setNewNationality },
                { label: 'ID/Passport', val: newDocNumber, set: setNewDocNumber },
              ].map(f => (
                <View key={f.label}>
                  <Text style={s.fieldLabel}>{f.label}{f.required ? <Text style={{ color: SRS.red }}> *</Text> : null}</Text>
                  <TextInput
                    placeholder={`Enter ${f.label.toLowerCase()}`} placeholderTextColor={GRAY[400]}
                    value={f.val} onChangeText={f.set}
                    keyboardType={(f as any).keyboard || 'default'} autoCapitalize="none"
                    style={s.input}
                  />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg }}>
              <TouchableOpacity onPress={() => setShowNewForm(false)} style={s.modalCancel}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateGuest} style={s.modalConfirm}>
                <Text style={s.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.card, backgroundColor: BG.white, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  sub: { ...TYPOGRAPHY.small, color: GRAY[500], marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200] },
  tabBtnActive: { backgroundColor: SRS.navy, borderColor: SRS.navy },
  tabLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: GRAY[600] },
  body: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  searchInput: { backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: SRS.navy, marginBottom: SPACING.md },

  guestCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.card, backgroundColor: BG.white, borderWidth: 1, borderColor: GRAY[100], marginBottom: SPACING.sm, gap: SPACING.md },
  guestAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  guestInitial: { fontSize: 16, fontWeight: '700' },
  guestName: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy },
  guestMeta: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 1 },
  vipBadge: { fontSize: 10, fontWeight: '700', color: SRSTokens.orange, backgroundColor: AMBER[500] + '15', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierBadgeText: { fontSize: 10, fontWeight: '700' },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: SRS.teal + '15', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: SRS.teal },

  profileCard: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileInitial: { fontWeight: '700' },
  profileName: { fontSize: 18, fontWeight: '700', color: SRS.navy },
  profileMeta: { ...TYPOGRAPHY.caption, color: GRAY[500], marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: GRAY[100], gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: SRS.navy, fontVariant: ['tabular-nums'] as any },
  statLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  loyaltyCard: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  loyaltyTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.sm },
  loyaltyDesc: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: GRAY[200], overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },

  sectionCard: { backgroundColor: BG.white, borderRadius: RADIUS.card, padding: SPACING.lg, borderWidth: 1, borderColor: GRAY[100] },
  sectionTitle: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy, marginBottom: SPACING.md },
  noteInputRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  noteInput: { flex: 1, backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: SRS.navy, minHeight: 36 },
  noteAddBtn: { paddingHorizontal: 16, borderRadius: RADIUS.card, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center' },
  noteAddText: { fontSize: 13, fontWeight: '600', color: BG.white },
  noteRow: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: 4 },
  noteDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SRS.teal, marginTop: 6 },
  noteText: { ...TYPOGRAPHY.small, color: GRAY[600], flex: 1 },
  noNotes: { ...TYPOGRAPHY.caption, color: GRAY[400], fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', gap: SPACING.md },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal + '12', borderWidth: 1, borderColor: SRS.teal + '25' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: SRS.teal },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2, gap: SPACING.md },
  emptyText: { ...TYPOGRAPHY.body, color: GRAY[400] },
  hintText: { ...TYPOGRAPHY.small, color: GRAY[400], textAlign: 'center' },
  createBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.card, backgroundColor: SRS.teal },
  createBtnText: { fontSize: 13, fontWeight: '600', color: BG.white },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: BG.white, borderRadius: RADIUS.card * 2, padding: SPACING.xl, width: '90%', maxWidth: 400 },
  modalTitle: { ...TYPOGRAPHY.h3, color: SRS.navy, marginBottom: SPACING.lg },
  fieldLabel: { ...TYPOGRAPHY.small, fontWeight: '600', color: SRS.navy, marginBottom: 4 },
  input: { backgroundColor: GRAY[50], borderWidth: 1, borderColor: GRAY[200], borderRadius: RADIUS.card, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: SRS.navy },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: GRAY[100] },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: GRAY[600] },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.card, alignItems: 'center', backgroundColor: SRS.teal },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: BG.white },
});