import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { BottomTabBar } from '@/components/operations/BottomTabBar';
import { SRS, SLATE, BG, RED, BLUE, EMERALD, AMBER, PURPLE, ORANGE } from '@/lib/constants/figma-tokens';
import { RADIUS, GRAY } from '@/constants/portal-theme';

const DARK = SLATE[900];

interface MenuItem {
  icon: string;
  label: string;
  href?: string;
  color: string;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Operations',
    items: [
      { icon: 'grid-outline', label: 'Room Plan', href: '/(operations)/room-plan', color: BLUE[600] },
      { icon: 'sparkles-outline', label: 'Housekeeping', href: '/(operations)/housekeeping', color: EMERALD[500] },
      { icon: 'construct-outline', label: 'Maintenance', href: '/(operations)/housekeeping', color: SRS.orange },
      { icon: 'moon-outline', label: 'Night Audit', color: SLATE[600] },
      { icon: 'people-circle-outline', label: 'Guest CRM', href: '/(operations)/front-desk/guest-crm', color: PURPLE[500] },
    ],
  },
  {
    title: 'Staff',
    items: [
      { icon: 'people-outline', label: 'Users & Roles', href: '/(operations)/admin/staff', color: BLUE[600] },
      { icon: 'chatbubbles-outline', label: 'Messages', color: EMERALD[500] },
      { icon: 'finger-print-outline', label: 'Clock History', color: SLATE[600] },
      { icon: 'calendar-outline', label: 'Shift Schedule', color: AMBER[500] },
      { icon: 'checkbox-outline', label: 'Assigned Tasks', color: PURPLE[500] },
      { icon: 'finger-print-outline', label: 'Attendance', color: SRS.teal },
    ],
  },
  {
    title: 'Reports',
    items: [
      { icon: 'bar-chart-outline', label: "Today's Report", href: '/(operations)/reports', color: BLUE[600] },
      { icon: 'receipt-outline', label: 'Cash Drawer', color: EMERALD[500] },
      { icon: 'pie-chart-outline', label: 'Occupancy', color: PURPLE[500] },
      { icon: 'trending-up-outline', label: 'Revenue', color: SRS.teal },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: 'person-outline', label: 'Profile', color: SLATE[600] },
      { icon: 'bed-outline', label: 'Property Info', color: BLUE[600] },
      { icon: 'pricetag-outline', label: 'Pricing', color: SRS.orange },
      { icon: 'notifications-outline', label: 'Notifications', color: RED[500] },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', color: BLUE[600] },
      { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', color: EMERALD[500] },
      { icon: 'information-circle-outline', label: 'About ServeIQ', color: SLATE[500] },
    ],
  },
];

export default function MoreScreen() {
  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.logoContainer}>
              <Text style={s.logoText}>SE</Text>
            </View>
            <Text style={s.headerTitle}>More</Text>
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

        {/* Sections */}
        {SECTIONS.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.menuGrid}>
              {section.items.map(item => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => item.href && router.push(item.href as any)}
                  style={s.menuCard}
                  activeOpacity={0.7}
                >
                  <View style={[s.menuIconWrap, { backgroundColor: item.color + '12' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={s.menuLabel} numberOfLines={2}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: { width: '30%', alignItems: 'center', padding: 12, backgroundColor: BG.white, borderRadius: 12, borderWidth: 1, borderColor: SLATE[100] },
  menuIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 11, fontWeight: '600', color: DARK, textAlign: 'center' },
});
