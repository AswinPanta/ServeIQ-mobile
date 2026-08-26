import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/context/auth-context';
import { SRS, GRAY, RADIUS, SHADOWS } from '@/constants/portal-theme';
import { BG, BORDER, RED } from '@/lib/constants/figma-tokens';

// Port of the reference web app's AdminProfilePage (Thadaw/StayEasy,
// branch `admin-side-change`): profile information, security (change
// password + recent login sessions), and notification preferences.

const TEAL = SRS.teal;
const NAVY = SRS.navy;
const CARD_SHADOW = SHADOWS.card;

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// Mock recent logins — mirrors the web page's session list until the backend
// exposes an audit/sessions endpoint.
const RECENT_LOGINS = [
  { date: 'Aug 25, 2026 10:30 AM', location: 'Kathmandu, Nepal', device: 'App on iPhone', current: true },
  { date: 'Aug 24, 2026 06:15 PM', location: 'Kathmandu, Nepal', device: 'Chrome on Windows', current: false },
  { date: 'Aug 23, 2026 09:22 AM', location: 'Pokhara, Nepal', device: 'Safari on iPhone', current: false },
  { date: 'Aug 21, 2026 08:10 PM', location: 'Butwal, Nepal', device: 'Chrome on Android', current: false },
];

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const u = user as Record<string, any> | null;

  const firstName: string = u?.firstName || u?.first_name || '';
  const lastName: string = u?.lastName || u?.last_name || '';
  const fullName: string = u?.name || u?.full_name || `${firstName} ${lastName}`.trim() || 'Admin';
  const email: string = u?.email || '—';
  const phone: string = u?.phone || u?.phone_number || '—';
  const role: string = u?.role ? String(u.role).replace(/_/g, ' ') : 'Administrator';
  const initials = fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const [tab, setTab] = useState<TabId>('profile');
  const [prefs, setPrefs] = useState({ bookingAlerts: true, marketingEmails: false, pushNotifications: true });

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Admin Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <View style={s.identityCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.identityName}>{fullName}</Text>
          <Text style={s.identityRole}>{role}</Text>
          <Text style={s.identityEmail}>{email}</Text>
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[s.tabBtn, tab === t.id && s.tabActive]}>
              <Ionicons name={t.icon as any} size={16} color={tab === t.id ? '#fff' : GRAY[500]} />
              <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'profile' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Profile Information</Text>
            <InfoRow icon="person-outline" label="Full Name" value={fullName} />
            <InfoRow icon="mail-outline" label="Email" value={email} />
            <InfoRow icon="call-outline" label="Phone" value={phone} />
            <InfoRow icon="business-outline" label="Role" value={role} />
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => router.push('/(host)/profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={s.secondaryBtnText}>Edit Contact Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'security' && (
          <>
            <View style={s.card}>
              <Text style={s.sectionTitle}>Security</Text>
              <TouchableOpacity
                style={s.rowBtn}
                onPress={() => router.push('/(host)/change-password')}
                activeOpacity={0.7}
              >
                <View style={[s.rowIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#059669" />
                </View>
                <View style={sflex1}>
                  <Text style={s.rowTitle}>Change Password</Text>
                  <Text style={s.rowSub}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={GRAY[400]} />
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.sectionTitle}>Recent Logins</Text>
              {RECENT_LOGINS.map((l, i) => (
                <View key={i} style={s.loginRow}>
                  <View style={[s.rowIcon, { backgroundColor: l.current ? '#ECFDF5' : BG.white }]}>
                    <Ionicons name={l.current ? 'phone-portrait-outline' : 'desktop-outline'} size={18} color={l.current ? '#059669' : GRAY[500]} />
                  </View>
                  <View style={sflex1}>
                    <Text style={s.rowTitle}>
                      {l.device}
                      {l.current ? '  · Current session' : ''}
                    </Text>
                    <Text style={s.rowSub}>{l.date} — {l.location}</Text>
                  </View>
                  {!l.current && <View style={s.dot} />}
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'notifications' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Notification Preferences</Text>
            <ToggleRow
              icon="notifications-outline"
              title="Booking Alerts"
              subtitle="New bookings, cancellations and changes"
              value={prefs.bookingAlerts}
              onToggle={(v) => setPrefs((p) => ({ ...p, bookingAlerts: v }))}
            />
            <ToggleRow
              icon="megaphone-outline"
              title="Marketing Emails"
              subtitle="Product updates and offers"
              value={prefs.marketingEmails}
              onToggle={(v) => setPrefs((p) => ({ ...p, marketingEmails: v }))}
            />
            <ToggleRow
              icon="phone-portrait-outline"
              title="Push Notifications"
              subtitle="Real-time alerts on this device"
              value={prefs.pushNotifications}
              onToggle={(v) => setPrefs((p) => ({ ...p, pushNotifications: v }))}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const sflex1 = { flex: 1 };

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <View style={s.rowIcon}>
        <Ionicons name={icon as any} size={18} color={TEAL} />
      </View>
      <View style={sflex1}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ToggleRow({ icon, title, subtitle, value, onToggle }: {
  icon: string; title: string; subtitle: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={s.rowIcon}>
        <Ionicons name={icon as any} size={18} color={NAVY} />
      </View>
      <View style={sflex1}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: GRAY[200], true: TEAL }}
        thumbColor="#fff"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER.light,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: GRAY[100],
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: NAVY },

  body: { padding: 16, paddingBottom: 40 },

  identityCard: {
    alignItems: 'center', padding: 24, borderRadius: RADIUS.card, backgroundColor: BG.white,
    borderWidth: 1, borderColor: BORDER.light, marginBottom: 16,
    ...CARD_SHADOW,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, marginBottom: 12,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  identityName: { fontSize: 18, fontWeight: '700', color: NAVY },
  identityRole: { fontSize: 13, color: TEAL, fontWeight: '600', marginTop: 2 },
  identityEmail: { fontSize: 13, color: GRAY[500], marginTop: 4 },

  tabRow: {
    flexDirection: 'row', backgroundColor: GRAY[100], borderRadius: RADIUS.button,
    padding: 4, marginBottom: 16,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: RADIUS.button,
  },
  tabActive: { backgroundColor: TEAL },
  tabLabel: { fontSize: 13, fontWeight: '600', color: GRAY[500] },
  tabLabelActive: { color: '#fff' },

  card: {
    borderRadius: RADIUS.card, backgroundColor: BG.white, borderWidth: 1,
    borderColor: BORDER.light, padding: 16, marginBottom: 16,
    ...CARD_SHADOW,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 8 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: GRAY[100],
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  infoLabel: { fontSize: 11, color: GRAY[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: NAVY, fontWeight: '600', marginTop: 1 },

  rowBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: NAVY },
  rowSub: { fontSize: 12, color: GRAY[500], marginTop: 1 },

  loginRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER.light },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED[500] },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: TEAL, borderRadius: RADIUS.button, paddingVertical: 13, marginTop: 12,
  },
  secondaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
