import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ACCENT } from '@/constants/portal-theme';
import { useGuestStore } from '@/stores/useGuestStore';
import { StatusBadge } from '@/components/ui/StatusBadge';

const TIER_COLORS: Record<string, string> = {
  standard: '#94A3B8',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const PROMOTIONS = [
  { id: 'p1', icon: '☀️', title: 'Summer Special', description: '20% off on Suites', status: 'Active' },
  { id: 'p2', icon: '⭐', title: 'Loyalty Bonus', description: 'Double Points this Month', status: 'Active' },
  { id: 'p3', icon: '👥', title: 'Refer a Friend', description: 'Get 500 Points per Referral', status: 'Active' },
];

export default function GuestCRMScreen() {
  const store = useGuestStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [awardAmount, setAwardAmount] = useState('');
  const [showPromotions, setShowPromotions] = useState(false);

  const filtered = search ? store.findGuest(search) : store.guests;
  const guest = selectedId ? store.getGuest(selectedId) : null;

  const handleAwardPoints = (points: number) => {
    if (!selectedId) return;
    store.earnPoints(selectedId, points);
    Alert.alert('Done', `${points} points awarded`);
  };

  const handleCustomAward = () => {
    if (!selectedId || !awardAmount) return;
    const pts = parseInt(awardAmount, 10);
    if (isNaN(pts) || pts < 1) { Alert.alert('Invalid', 'Enter a valid number'); return; }
    store.earnPoints(selectedId, pts);
    setAwardAmount('');
    Alert.alert('Done', `${pts} points awarded`);
  };

  const handleAddNote = () => {
    if (!selectedId || !noteText.trim()) return;
    store.addNote(selectedId, noteText.trim());
    setNoteText('');
  };

  const handleToggleVip = () => {
    if (!selectedId) return;
    store.toggleVip(selectedId);
    Alert.alert('Done', guest?.vip ? 'VIP status removed' : 'Guest marked as VIP');
  };

  const handleSendPromotion = (title: string) => {
    Alert.alert('Promotion Sent', `Promotion '${title}' sent to ${guest?.name || 'guest'}`);
  };

  const renderGuestDetail = () => {
    if (!guest) return null;
    const tierColor = TIER_COLORS[guest.loyaltyTier] || '#94A3B8';

    return (
      <View style={s.detailCard}>
        <View style={s.detailHeader}>
          <View style={[s.avatar, { backgroundColor: tierColor + '20' }]}>
            <Text style={[s.avatarText, { color: tierColor }]}>{guest.name.charAt(0)}</Text>
          </View>
          <View style={s.detailInfo}>
            <Text style={s.guestName}>{guest.name}</Text>
            <Text style={s.guestMeta}>{guest.email}</Text>
            <Text style={s.guestMeta}>{guest.phone}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedId(null)} style={s.backSmallBtn}>
            <Text style={s.backSmallText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.loyaltyCard, { backgroundColor: '#1A3C5E' }]}>
          <View style={s.loyaltyTop}>
            <View>
              <Text style={s.loyaltyLabel}>Loyalty Status</Text>
              <Text style={[s.loyaltyPoints, { color: tierColor }]}>{guest.loyaltyPoints.toLocaleString()}</Text>
              <Text style={s.loyaltyMeta}>{guest.totalStays} stays · ₹{guest.totalSpent.toLocaleString()} spent</Text>
            </View>
            <StatusBadge label={guest.loyaltyTier} color={tierColor} size="sm" />
          </View>
          <View style={s.ptsRow}>
            <TouchableOpacity onPress={() => handleAwardPoints(100)} style={s.ptsBtn}>
              <Text style={s.ptsBtnText}>+100 pts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAwardPoints(500)} style={s.ptsBtn}>
              <Text style={s.ptsBtnText}>+500 pts</Text>
            </TouchableOpacity>
          </View>
          <View style={s.customPtsRow}>
            <TextInput
              value={awardAmount} onChangeText={setAwardAmount}
              placeholder="Custom pts" placeholderTextColor="#64748B"
              keyboardType="number-pad"
              style={s.customPtsInput}
            />
            <TouchableOpacity onPress={handleCustomAward} style={s.awardBtn}>
              <Text style={s.awardBtnText}>Award</Text>
            </TouchableOpacity>
          </View>
          {guest.vip && (
            <View style={s.vipBadge}>
              <Text style={s.vipText}>VIP</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleToggleVip} style={s.vipToggle}>
          <Text style={s.vipToggleText}>{guest.vip ? 'Remove VIP Status' : 'Mark as VIP'}</Text>
        </TouchableOpacity>

        <View style={s.tierBenefits}>
          <Text style={s.sectionTitle}>{guest.loyaltyTier.charAt(0).toUpperCase() + guest.loyaltyTier.slice(1)} Benefits</Text>
          {getBenefits(guest.loyaltyTier).map((b, i) => (
            <View key={i} style={s.benefitRow}>
              <Text style={s.benefitCheck}>✓</Text>
              <Text style={s.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <View>
          <TouchableOpacity onPress={() => setShowNotes(!showNotes)} style={s.notesToggle}>
            <Text style={s.sectionTitle}>Staff Notes</Text>
            <Text style={{ fontSize: 11, color: '#94A3B8' }}>({guest.notes ? guest.notes.split('\n').length : 0})</Text>
            <Text style={{ fontSize: 12, color: ACCENT }}>{showNotes ? '−' : '+'}</Text>
          </TouchableOpacity>
          {showNotes && (
            <>
              {!guest.notes && <Text style={s.noNotes}>No notes yet.</Text>}
              {guest.notes && guest.notes.split('\n').map((n, i) => (
                <View key={i} style={s.noteItem}>
                  <Text style={s.noteText}>{n}</Text>
                </View>
              ))}
              <View style={s.addNoteRow}>
                <TextInput
                  value={noteText} onChangeText={setNoteText}
                  placeholder="Add a note..." placeholderTextColor="#94A3B8"
                  style={s.noteInput}
                />
                <TouchableOpacity onPress={handleAddNote} style={s.addNoteBtn}>
                  <Text style={s.addNoteBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <TouchableOpacity onPress={() => setShowPromotions(!showPromotions)} style={s.notesToggle}>
            <Text style={s.sectionTitle}>Promotions</Text>
            <Text style={{ fontSize: 12, color: ACCENT }}>{showPromotions ? '−' : '+'}</Text>
          </TouchableOpacity>
          {showPromotions && (
            <>
              {PROMOTIONS.map((p) => (
                <View key={p.id} style={s.promoCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E293B' }}>{p.title}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>{p.description}</Text>
                      </View>
                    </View>
                    <StatusBadge label={p.status} color="#22C55E" size="sm" />
                  </View>
                  <TouchableOpacity onPress={() => handleSendPromotion(p.title)}
                    style={{ marginTop: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: ACCENT, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}>Send to Guest</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={{ fontSize: 18, color: '#475569' }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Guest CRM</Text>
        <Text style={s.subtitle}>{store.guests.length} registered guests</Text>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchInputWrapper}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search by name, email or phone..."
            placeholderTextColor="#94A3B8"
            style={s.searchInput}
          />
        </View>
      </View>

      <View style={s.list}>
        {guest ? renderGuestDetail() : (
          <>
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>👤</Text>
                <Text style={s.emptyTitle}>{search ? 'No guests found' : 'Guest Profiles'}</Text>
                <Text style={s.emptyMsg}>{search ? 'Try a different search term' : 'Guest profiles are created automatically on first booking.'}</Text>
              </View>
            ) : (
              filtered.map((g) => {
                const tc = TIER_COLORS[g.loyaltyTier] || '#94A3B8';
                return (
                  <TouchableOpacity key={g.id} onPress={() => setSelectedId(g.id)} style={s.guestRow}>
                    <View style={[s.rowAvatar, { backgroundColor: tc + '20' }]}>
                      <Text style={[s.rowAvatarText, { color: tc }]}>{g.name.charAt(0)}</Text>
                    </View>
                    <View style={s.rowInfo}>
                      <View style={s.rowNameRow}>
                        <Text style={s.rowName}>{g.name}</Text>
                        {g.vip && <Text style={s.vipDot}>⭐</Text>}
                        {g.blacklisted && <Text style={s.blacklistedDot}>🚫</Text>}
                      </View>
                      <Text style={s.rowEmail}>{g.email}</Text>
                      <View style={s.rowBadges}>
                        <StatusBadge label={g.loyaltyTier} color={tc} size="sm" />
                        <Text style={s.rowPts}>{g.loyaltyPoints.toLocaleString()} pts</Text>
                        <Text style={s.rowStays}>{g.totalStays} stays</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 18, color: '#CBD5E1' }}>›</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function getBenefits(tier: string): string[] {
  switch (tier) {
    case 'platinum': return ['Priority check-in/out', 'Free room upgrades', 'Late checkout 4 PM', 'Welcome amenity', 'Dedicated concierge'];
    case 'gold': return ['Priority check-in', 'Free room upgrades', 'Late checkout 2 PM', 'Welcome amenity'];
    case 'silver': return ['Priority check-in', 'Late checkout 1 PM', 'Welcome drink'];
    default: return ['Welcome drink', 'Free Wi-Fi'];
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 1 },
  searchRow: { paddingHorizontal: 16, marginBottom: 16 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: '#F1F5F9' },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  list: { paddingHorizontal: 16, gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  emptyMsg: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 },
  guestRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9' },
  rowAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowAvatarText: { fontSize: 18, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  vipDot: { fontSize: 12 },
  blacklistedDot: { fontSize: 12 },
  rowEmail: { fontSize: 11, color: '#64748B' },
  rowBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  rowPts: { fontSize: 11, color: '#94A3B8' },
  rowStays: { fontSize: 11, color: '#94A3B8' },
  detailCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  detailInfo: { flex: 1 },
  guestName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  guestMeta: { fontSize: 12, color: '#64748B' },
  backSmallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  backSmallText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  loyaltyCard: { padding: 16, borderRadius: 14, backgroundColor: '#1A3C5E', marginBottom: 12 },
  loyaltyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  loyaltyLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  loyaltyPoints: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  loyaltyMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  ptsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ptsBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
  ptsBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  customPtsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  customPtsInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#FFF' },
  awardBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: ACCENT, justifyContent: 'center' },
  awardBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  vipBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  vipText: { fontSize: 10, fontWeight: '700', color: '#1E293B' },
  vipToggle: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: ACCENT, alignItems: 'center', marginBottom: 16 },
  vipToggleText: { fontSize: 12, fontWeight: '600', color: ACCENT },
  tierBenefits: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  benefitCheck: { fontSize: 12, color: ACCENT, marginTop: 1 },
  benefitText: { fontSize: 12, color: '#475569', flex: 1 },
  notesToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noNotes: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 },
  noteItem: { padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', marginBottom: 6 },
  noteText: { fontSize: 12, color: '#475569' },
  addNoteRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  noteInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1E293B' },
  addNoteBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, backgroundColor: ACCENT, justifyContent: 'center' },
  addNoteBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  promoCard: { padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  promoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  promoName: { fontSize: 13, color: '#1E293B', flex: 1 },
  applyPromoBtn: { paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', marginTop: 4 },
  applyPromoBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
});
