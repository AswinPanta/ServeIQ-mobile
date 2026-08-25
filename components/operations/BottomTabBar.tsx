import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SRS, BG, SLATE } from '@/lib/constants/figma-tokens';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline' as const, activeIcon: 'home' as const, href: '/(operations)' },
  { key: 'reservations', label: 'Reservations', icon: 'calendar-outline' as const, activeIcon: 'calendar' as const, href: '/(operations)/reservations' },
  { key: 'guests', label: 'Guests', icon: 'people-outline' as const, activeIcon: 'people' as const, href: '/(operations)/guests' },
  { key: 'more', label: 'More', icon: 'grid-outline' as const, activeIcon: 'grid' as const, href: '/(operations)/more' },
];



export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isActive = (href: string) => {
    if (href === '/(operations)') return pathname === '/(operations)' || pathname === '/(operations)/';
    return pathname.startsWith(href);
  };

  return (
    <View style={[s.container, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      {TABS.map((tab, i) => (
        <React.Fragment key={tab.key}>
          {i === 2 && (
            <TouchableOpacity
              onPress={() => router.push('/(operations)/front-desk/new-booking')}
              style={s.fab}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={26} color={BG.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push(tab.href as any)}
            style={s.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive(tab.href) ? tab.activeIcon : tab.icon}
              size={20}
              color={isActive(tab.href) ? SRS.teal : SLATE[400]}
            />
            <Text style={[s.tabLabel, { color: isActive(tab.href) ? SRS.teal : SLATE[400] }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: BG.white, borderTopWidth: 1, borderTopColor: SLATE[100],
    paddingTop: 8, paddingHorizontal: 4,
  },
  tabItem: { alignItems: 'center', gap: 2, minWidth: 56 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  fab: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: SRS.teal,
    alignItems: 'center', justifyContent: 'center', marginTop: -20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
});
