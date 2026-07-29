import React from 'react';
import { Stack, useSegments, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { GRAY } from '@/constants/portal-theme';
import { useAuth } from '@/lib/context/auth-context';
import { AuthGuard } from '@/components/common/AuthGuard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SuperAdminProvider } from '@/lib/context/superadmin-context';

const ACCENT = '#7C3AED';
const INACTIVE = '#94A3B8';

const TABS = [
  { key: 'index', label: 'Dashboard', icon: 'home' as const, route: '/(superadmin)' },
  { key: 'tenants', label: 'Tenants', icon: 'group' as const, route: '/(superadmin)/tenants' },
  { key: 'commerce', label: 'Commerce', icon: 'payment' as const, route: '/(superadmin)/commerce/subscriptions' },
  { key: 'platform', label: 'Platform', icon: 'settings' as const, route: '/(superadmin)/platform/feature-flags' },
  { key: 'more', label: 'More', icon: 'menu' as const, route: '/(superadmin)/more' },
];

function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, portal } = useAuth();
  const segments = useSegments();

  const isSubScreen = segments.length > 2 && !(segments as string[]).includes('more');

  if (!isSignedIn || portal !== 'superadmin' || isSubScreen) return null;

  const activeTab = TABS.find(t => {
    if (t.key === 'index') return pathname === '/(superadmin)' || pathname === '/(superadmin)/index';
    return pathname.startsWith(`/(superadmin)/${t.key}`);
  })?.key || 'index';

  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.inner}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => router.push(tab.route as any)}
              style={tabStyles.tab}
              activeOpacity={0.7}
            >
              <View style={[tabStyles.iconWrap, isActive && { backgroundColor: ACCENT + '12' }]}>
                <IconSymbol name={tab.icon} size={20} color={isActive ? ACCENT : INACTIVE} />
              </View>
              <Text style={[tabStyles.label, isActive && { color: ACCENT, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SuperAdminContent({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: GRAY[50] }}>
      {children}
      <BottomTabBar />
    </View>
  );
}

export default function SuperAdminLayout() {
  return (
    <AuthGuard portal="superadmin">
      <SuperAdminProvider>
        <SuperAdminContent>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: GRAY[50] },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="tenants" />
            <Stack.Screen name="commerce" />
            <Stack.Screen name="platform" />
            <Stack.Screen name="support" />
            <Stack.Screen name="system" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="more" />
          </Stack>
        </SuperAdminContent>
      </SuperAdminProvider>
    </AuthGuard>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: INACTIVE,
    fontWeight: '500',
  },
});
