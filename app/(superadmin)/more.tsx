import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/context/auth-context';
import { StatusBadge } from '@/components/superadmin/StatusBadge';
import { AnimatedPressable, Stagger } from '@/components/ui/motion';
import { PURPLE, AMBER, PINK, RED, INDIGO, STATUS, GRAY, SLATE, BG } from '@/lib/constants/figma-tokens';

const ACCENT = PURPLE[700];

const MORE_SECTIONS = [
  {
    title: 'Support',
    items: [
      { label: 'Tickets', icon: 'chat' as const, route: '/(superadmin)/support/tickets', color: AMBER[500] },
      { label: 'Notifications', icon: 'notifications' as const, route: '/(superadmin)/support/notifications', color: PURPLE[700] },
      { label: 'Announcements', icon: 'notifications' as const, route: '/(superadmin)/support/announcements', color: PINK[500] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Health', icon: 'verified' as const, route: '/(superadmin)/system/health', color: RED[500] },
      { label: 'Audit Logs', icon: 'analytics' as const, route: '/(superadmin)/system/audit-logs', color: INDIGO[500] },
      { label: 'Impersonate', icon: 'person.fill' as const, route: '/(superadmin)/system/impersonate', color: PURPLE[500] },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Roles & Permissions', icon: 'lock' as const, route: '/(superadmin)/admin/roles', color: STATUS.activeGreen },
      { label: 'Settings', icon: 'settings' as const, route: '/(superadmin)/admin/settings', color: GRAY[500] },
    ],
  },
];

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const admin = user as any;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{admin?.name?.[0] || 'A'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{admin?.name || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{admin?.email || 'admin@serveiq.com'}</Text>
        </View>
        <StatusBadge status="Active" />
      </View>

      {/* Sections */}
      {MORE_SECTIONS.map((section, sIdx) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            <Stagger step={50} initialDelay={100 + sIdx * 80} portal="superadmin">
              {section.items.map((item, i) => (
                <AnimatedPressable
                  key={item.label}
                  portal="superadmin"
                  haptic="light"
                  scaleTo={0.97}
                  onPress={() => router.push(item.route as any)}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '12' }]}>
                    <IconSymbol name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <IconSymbol name="arrow.forward" size={14} color={SLATE[300]} />
                </AnimatedPressable>
              ))}
            </Stagger>
          </View>
        </View>
      ))}

      {/* Sign Out */}
      <AnimatedPressable
        portal="superadmin"
        haptic="medium"
        scaleTo={0.97}
        onPress={async () => { await logout(); router.replace('/'); }}
        style={styles.signOutBtn}
      >
        <IconSymbol name="logout" size={18} color={RED[500]} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SLATE[50] },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: SLATE[900], letterSpacing: -0.5 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: ACCENT + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: ACCENT },
  profileName: { fontSize: 16, fontWeight: '700', color: SLATE[900] },
  profileEmail: { fontSize: 13, color: SLATE[400], marginTop: 2 },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: SLATE[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: SLATE[100] },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: SLATE[900] },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: RED[50],
    borderWidth: 1,
    borderColor: RED[200],
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: RED[500] },
});
