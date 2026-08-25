import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { safeGoBack } from "@/lib/utils";
import { PURPLE, BLUE, STATUS, BG, AMBER, RED, SLATE, TEXT, EMERALD } from '@/lib/constants/figma-tokens';
;
;

const ACCENT = PURPLE[700];

const INITIAL_ANNOUNCEMENTS = [
  { id: '1', title: 'New Feature: Dynamic Pricing', body: 'We are excited to announce the launch of AI-driven dynamic pricing for all Pro and Enterprise plans.', audience: 'All', status: 'Published', date: '2025-06-28' },
  { id: '2', title: 'Scheduled Maintenance: June 30', body: 'The platform will undergo scheduled maintenance on June 30, 2025 from 2:00 AM to 4:00 AM NPT.', audience: 'All', status: 'Published', date: '2025-06-25' },
  { id: '3', title: 'Holiday Booking Season Tips', body: 'Get ready for the upcoming holiday season! Here are our top tips to maximize your bookings.', audience: 'Hosts', status: 'Draft', date: '2025-06-22' },
  { id: '4', title: 'Payment Gateway Update', body: 'We have upgraded our payment gateway to support additional payment methods including Connect IPS and Khalti.', audience: 'Guests', status: 'Published', date: '2025-06-18' },
  { id: '5', title: 'Platform Upgrade: v2.5 Release Notes', body: 'Version 2.5 is here with improved performance, new reporting features, and enhanced security.', audience: 'All', status: 'Published', date: '2025-06-15' },
];

const AUDIENCE_COLORS: Record<string, string> = { All: ACCENT, Hosts: BLUE[500], Guests: STATUS.activeGreen };

type Audience = 'All' | 'Hosts' | 'Guests';
type Draft = { id: string; title: string; body: string; audience: Audience; status: 'Published' | 'Draft'; date: string };

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    id: '', title: '', body: '', audience: 'All', status: 'Draft', date: new Date().toISOString().slice(0, 10),
  });

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Announcement', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAnnouncements(prev => prev.filter(a => a.id !== id)) },
    ]);
  };

  const openCreate = () => {
    setDraft({
      id: `a-${Date.now()}`,
      title: '',
      body: '',
      audience: 'All',
      status: 'Draft',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowCreate(true);
  };

  const saveDraft = (publish: boolean) => {
    if (!draft.title.trim() || !draft.body.trim()) {
      Alert.alert('Missing fields', 'Please add a title and body before saving.');
      return;
    }
    const newAnn: typeof draft = { ...draft, status: publish ? 'Published' : 'Draft' };
    setAnnouncements(prev => [newAnn, ...prev]);
    setShowCreate(false);
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} contentInsetAdjustmentBehavior="automatic">
        <View style={s.header}>
          <TouchableOpacity onPress={() => safeGoBack()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={ACCENT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Announcements</Text>
          <TouchableOpacity onPress={openCreate} style={s.createBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color={BG.white} />
            <Text style={s.createText}>Create</Text>
          </TouchableOpacity>
        </View>

        {announcements.map(ann => (
          <View key={ann.id} style={[s.card, { borderLeftColor: ann.status === 'Published' ? STATUS.activeGreen : AMBER[500] }]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>{ann.title}</Text>
              <View style={[s.statusBadge, { backgroundColor: ann.status === 'Published' ? EMERALD[500] + '12' : AMBER[500] + '12' }]}>
                <Text style={[s.statusText, { color: ann.status === 'Published' ? STATUS.activeGreen : AMBER[500] }]}>{ann.status}</Text>
              </View>
            </View>
            <Text style={s.cardBody} numberOfLines={2}>{ann.body}</Text>
            <View style={s.cardBottom}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.audienceBadge, { backgroundColor: (AUDIENCE_COLORS[ann.audience] || ACCENT) + '12' }]}>
                  <Text style={[s.audienceText, { color: AUDIENCE_COLORS[ann.audience] || ACCENT }]}>{ann.audience}</Text>
                </View>
                <Text style={s.date}>{ann.date}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: ACCENT + '10' }]} activeOpacity={0.7}>
                  <Text style={[s.actionText, { color: ACCENT }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(ann.id, ann.title)} style={[s.actionBtn, { backgroundColor: RED[500] + '10' }]} activeOpacity={0.7}>
                  <Text style={[s.actionText, { color: RED[500] }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* Create / Edit announcement modal (real flow, replaces stub Alert) */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.header}>
              <Text style={m.headerTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={m.closeBtn}>
                <Text style={m.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
              <View>
                <Text style={m.label}>Title</Text>
                <TextInput
                  value={draft.title}
                  onChangeText={t => setDraft(d => ({ ...d, title: t }))}
                  placeholder="e.g. Q3 Platform Update"
                  placeholderTextColor={SLATE[400]}
                  style={m.input}
                />
              </View>

              <View>
                <Text style={m.label}>Body</Text>
                <TextInput
                  value={draft.body}
                  onChangeText={t => setDraft(d => ({ ...d, body: t }))}
                  placeholder="Write the announcement body…"
                  placeholderTextColor={SLATE[400]}
                  multiline
                  numberOfLines={6}
                  style={[m.input, { minHeight: 120, textAlignVertical: 'top' }]}
                />
              </View>

              <View>
                <Text style={m.label}>Audience</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  {(['All', 'Hosts', 'Guests'] as Audience[]).map(a => (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setDraft(d => ({ ...d, audience: a }))}
                      style={[m.audChip, draft.audience === a && m.audChipActive]}
                    >
                      <Text style={[m.audChipText, draft.audience === a && m.audChipTextActive]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <TouchableOpacity onPress={() => saveDraft(false)} style={[m.btn, m.btnGhost]} activeOpacity={0.85}>
                  <Text style={[m.btnText, { color: ACCENT }]}>Save Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveDraft(true)} style={[m.btn, m.btnPrimary]} activeOpacity={0.85}>
                  <Text style={[m.btnText, { color: BG.white }]}>Publish</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1,backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: BG.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: SLATE[100],
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: SLATE[900] },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22, color: SLATE[400], fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', color: SLATE[500], marginBottom: 6 },
  input: {
    fontSize: 15,
    color: SLATE[900],
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: SLATE[50],
    borderWidth: 1,
    borderColor: SLATE[200],
  },
  audChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: SLATE[100], borderWidth: 1, borderColor: SLATE[200] },
  audChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  audChipText: { fontSize: 13, fontWeight: '600', color: SLATE[600] },
  audChipTextActive: { color: BG.white },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: ACCENT },
  btnGhost: { backgroundColor: ACCENT + '0F', borderWidth: 1, borderColor: ACCENT + '30' },
  btnText: { fontSize: 15, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: SLATE[900], flex: 1 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: ACCENT },
  createText: { fontSize: 14, fontWeight: '700', color: BG.white },
  card: { padding: 16, borderRadius: 16, backgroundColor: BG.white, borderLeftWidth: 4, borderWidth: 1, borderColor: SLATE[100] },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: SLATE[900], flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: { fontSize: 13, color: SLATE[500], marginBottom: 12, lineHeight: 18 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audienceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  audienceText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: SLATE[500] },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 },
  actionText: { fontSize: 12, fontWeight: '700' },
});