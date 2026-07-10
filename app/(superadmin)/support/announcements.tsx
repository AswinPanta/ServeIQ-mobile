import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

const SUPERADMIN = '#8E44AD';

const INITIAL_ANNOUNCEMENTS = [
  { id: '1', title: 'New Feature: Dynamic Pricing', body: 'We are excited to announce the launch of AI-driven dynamic pricing for all Pro and Enterprise plans.', audience: 'All', status: 'Published', date: '2025-06-28' },
  { id: '2', title: 'Scheduled Maintenance: June 30', body: 'The platform will undergo scheduled maintenance on June 30, 2025 from 2:00 AM to 4:00 AM NPT.', audience: 'All', status: 'Published', date: '2025-06-25' },
  { id: '3', title: 'Holiday Booking Season Tips', body: 'Get ready for the upcoming holiday season! Here are our top tips to maximize your bookings.', audience: 'Hosts', status: 'Draft', date: '2025-06-22' },
  { id: '4', title: 'Payment Gateway Update', body: 'We have upgraded our payment gateway to support additional payment methods including Connect IPS and Khalti.', audience: 'Guests', status: 'Published', date: '2025-06-18' },
  { id: '5', title: 'Platform Upgrade: v2.5 Release Notes', body: 'Version 2.5 is here with improved performance, new reporting features, and enhanced security.', audience: 'All', status: 'Published', date: '2025-06-15' },
];

const AUDIENCE_COLORS: Record<string, string> = { All: SUPERADMIN, Hosts: '#3B82F6', Guests: '#10B981' };

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Announcement', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAnnouncements(prev => prev.filter(a => a.id !== id)) },
    ]);
  };

  const handleCreate = () => Alert.alert('Create Announcement', 'Creation form would open here.');

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <IconSymbol name="arrow.back" size={18} color={SUPERADMIN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Announcements</Text>
          <TouchableOpacity onPress={handleCreate} style={s.createBtn} activeOpacity={0.7}>
            <IconSymbol name="add" size={14} color="#FFF" />
            <Text style={s.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        {announcements.map(ann => (
          <View key={ann.id} style={[s.card, { borderLeftColor: ann.status === 'Published' ? '#10B981' : '#F59E0B' }]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>{ann.title}</Text>
              <View style={[s.statusBadge, { backgroundColor: ann.status === 'Published' ? '#10B98115' : '#F59E0B15' }]}>
                <Text style={[s.statusText, { color: ann.status === 'Published' ? '#10B981' : '#F59E0B' }]}>{ann.status}</Text>
              </View>
            </View>
            <Text style={s.cardBody} numberOfLines={2}>{ann.body}</Text>
            <View style={s.cardBottom}>
              <View style={s.audienceRow}>
                <View style={[s.audienceBadge, { backgroundColor: AUDIENCE_COLORS[ann.audience] + '15' }]}>
                  <Text style={[s.audienceText, { color: AUDIENCE_COLORS[ann.audience] }]}>{ann.audience}</Text>
                </View>
                <Text style={s.date}>{ann.date}</Text>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: SUPERADMIN + '12' }]} activeOpacity={0.7}>
                  <Text style={[s.actionBtnText, { color: SUPERADMIN }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(ann.id, ann.title)} style={[s.actionBtn, { backgroundColor: '#EF444415' }]} activeOpacity={0.7}>
                  <Text style={[s.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY[50] },
  scroll: { padding: SPACING.xl, paddingTop: 60, gap: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.modal, backgroundColor: SUPERADMIN + '12', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPOGRAPHY.h2, color: SRS.navy, flex: 1 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.lg, paddingVertical: 14, borderRadius: 12, backgroundColor: SUPERADMIN },
  createBtnText: { ...TYPOGRAPHY.body, fontWeight: '700', color: '#FFF' },
  card: { padding: SPACING.lg, borderRadius: 20, backgroundColor: '#FFF', borderLeftWidth: 4, ...SHADOWS.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { ...TYPOGRAPHY.body, fontWeight: '700', color: SRS.navy, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  cardBody: { ...TYPOGRAPHY.small, color: GRAY[500], marginBottom: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audienceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audienceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  audienceText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
  date: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8 },
  actionBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700' },
});
