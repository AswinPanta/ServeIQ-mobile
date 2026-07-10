import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { useAuth } from '@/lib/context/auth-context';
import { HostDashboard } from '@/components/host/screens/HostDashboard';
import { HostProperties } from '@/components/host/screens/HostProperties';
import { HostRooms } from '@/components/host/screens/HostRooms';
import { HostPricing } from '@/components/host/screens/HostPricing';
import { HostStaff } from '@/components/host/screens/HostStaff';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SRS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GRAY } from '@/constants/portal-theme';

type Tab = 'dashboard' | 'properties' | 'rooms' | 'pricing' | 'staff';

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'D' },
  { key: 'properties', label: 'Properties', icon: 'P' },
  { key: 'rooms', label: 'Rooms', icon: 'R' },
  { key: 'pricing', label: 'Pricing', icon: 'M' },
  { key: 'staff', label: 'Staff', icon: 'S' },
];

export default function HostDrawerShell() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>('dashboard');

  const userName = user && 'firstName' in user
    ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).name || 'Host'
    : 'Host';

  const renderDrawerContent = () => (
    <View style={[s.drawer, { paddingTop: insets.top }]}>
      <View style={s.drawerHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{userName[0]}</Text>
        </View>
        <Text style={s.drawerName}>{userName}</Text>
        <Text style={s.drawerRole}>Host</Text>
      </View>

      {NAV_ITEMS.map(item => (
        <TouchableOpacity key={item.key} onPress={() => { setActiveTab(item.key); setOpen(false); }}
          style={[s.navItem, activeTab === item.key && s.navItemActive]}>
          <View style={[s.navIcon, activeTab === item.key && s.navIconActive]}>
            <Text style={[s.navIconText, { color: activeTab === item.key ? '#FFF' : GRAY[400] }]}>{item.icon}</Text>
          </View>
          <Text style={[s.navLabel, activeTab === item.key && s.navLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={() => { router.replace('/(host)/listing-wizard'); setOpen(false); }} style={s.newListingBtn}>
        <IconSymbol name="add" size={14} color={SRS.teal} />
        <Text style={s.newListingText}>New Listing</Text>
      </TouchableOpacity>

      <View style={s.divider} />

      <TouchableOpacity onPress={() => { logout(); router.replace('/'); }} style={s.logoutBtn}>
        <IconSymbol name="logout" size={14} color={SRS.red} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <HostDashboard />;
      case 'properties': return <HostProperties />;
      case 'rooms': return <HostRooms />;
      case 'pricing': return <HostPricing />;
      case 'staff': return <HostStaff />;
    }
  };

  return (
    <View style={s.shell}>
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.topBarLeft}>
          <TouchableOpacity onPress={() => setOpen(true)} style={s.menuBtn}>
            <View style={s.hamburger}>
              <View style={s.hamLine} />
              <View style={[s.hamLine, { width: 12 }]} />
              <View style={s.hamLine} />
            </View>
          </TouchableOpacity>
          <View>
            <Text style={s.brand}>StayEasy</Text>
            <Text style={s.tabLabel}>{NAV_ITEMS.find(i => i.key === activeTab)?.label}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => { setOpen(false); router.replace('/(host)/listing-wizard'); }} style={s.newBtn}>
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Drawer
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderDrawerContent={renderDrawerContent}
        drawerType="front"
        drawerStyle={{ width: 280 }}
      >
        {renderScreen()}
      </Drawer>
    </View>
  );
}

const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: GRAY[50] },

  /* Top Bar */
  topBar: { paddingHorizontal: SPACING.lg, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: GRAY[100], backgroundColor: '#FFF' },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { width: 44, height: 44, borderRadius: RADIUS.card, backgroundColor: SRS.teal + '10', alignItems: 'center', justifyContent: 'center' },
  hamburger: { gap: 4 },
  hamLine: { width: 16, height: 2, borderRadius: 2, backgroundColor: SRS.teal },
  brand: { ...TYPOGRAPHY.h3, color: SRS.teal },
  tabLabel: { ...TYPOGRAPHY.caption, color: GRAY[500] },
  newBtn: { paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: RADIUS.card, backgroundColor: SRS.teal },
  newBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  /* Drawer */
  drawer: { flex: 1, backgroundColor: '#FFF' },
  drawerHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: GRAY[100], marginBottom: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: SRS.teal, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  drawerName: { ...TYPOGRAPHY.subtitle, fontWeight: '700', color: SRS.navy },
  drawerRole: { ...TYPOGRAPHY.caption, color: GRAY[500] },

  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 20, marginHorizontal: 8, borderRadius: RADIUS.modal },
  navItemActive: { backgroundColor: SRS.teal + '12' },
  navIcon: { width: 32, height: 32, borderRadius: RADIUS.button, backgroundColor: GRAY[100], alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: SRS.teal },
  navIconText: { fontSize: 14, fontWeight: '700' },
  navLabel: { ...TYPOGRAPHY.body, fontWeight: '500', color: GRAY[700] },
  navLabelActive: { color: SRS.teal, fontWeight: '700' },

  newListingBtn: { margin: 8, paddingVertical: 16, paddingHorizontal: 20, borderRadius: RADIUS.modal, backgroundColor: SRS.teal + '08', flexDirection: 'row', alignItems: 'center', gap: 8 },
  newListingText: { fontSize: 14, fontWeight: '600', color: SRS.teal },
  divider: { height: 1, backgroundColor: GRAY[100], marginHorizontal: SPACING.lg, marginVertical: 4 },
  logoutBtn: { marginHorizontal: 8, marginBottom: 8, paddingVertical: 16, paddingHorizontal: 20, borderRadius: RADIUS.modal, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { fontSize: 14, fontWeight: '500', color: SRS.red },
});
