import { useEffect, type ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter, useSegments, usePathname, type Href } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import type { PortalType } from '@/types/api';

const UNIFIED_LOGIN = '/(auth)/login';

const PORTAL_LOGIN_MAP: Record<PortalType, string> = {
  guest: UNIFIED_LOGIN,
  host: `${UNIFIED_LOGIN}?portal=host`,
  operations: `${UNIFIED_LOGIN}?portal=operations`,
  superadmin: `${UNIFIED_LOGIN}?portal=superadmin`,
};

const PORTAL_HOME_MAP: Record<PortalType, string> = {
  guest: '/(tabs)',
  host: '/(host)',
  operations: '/(operations)',
  superadmin: '/(superadmin)',
};

/**
 * Login URL for a portal, carrying the current path as a `redirect` so the
 * guest lands back on the screen that bounced them (matches the web
 * ProtectedRoute). Built from `usePathname()`, which resolves dynamic segments
 * but strips route groups — `/profile/bookings/[id]` → `/profile/bookings/bk_1`.
 * That group-less form is the canonical URL and navigates back correctly.
 */
export function buildLoginHref(portal: PortalType, pathname: string): string {
  const base = PORTAL_LOGIN_MAP[portal];
  return `${base}${base.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(pathname)}`;
}

interface AuthGuardProps {
  portal: PortalType;
  children: ReactNode;
}

export function AuthGuard({ portal, children }: AuthGuardProps) {
  const { isLoading, isSignedIn, portal: activePortal } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const colors = useColors();

  const isOnLoginScreen = segments.some((s: string) => s === 'login' || s === 'register');
  const isOnPortalGroup = segments.some((s: string) => s === `(${portal})`) || (portal === 'guest' && segments.some((s: string) => s === '(tabs)'));
  const isCorrectPortal = activePortal === portal;
  const hasSession = isSignedIn && isCorrectPortal;

  // Hoisted so the effect depends on a stable string (`segments` is a fresh
  // array every render).
  const loginHref =
    !hasSession && !isOnLoginScreen && isOnPortalGroup ? buildLoginHref(portal, pathname) : null;

  useEffect(() => {
    if (isLoading) return;

    if (loginHref) {
      router.replace(loginHref as Href);
    } else if (hasSession && isOnLoginScreen && isOnPortalGroup) {
      router.replace(PORTAL_HOME_MAP[portal] as Href);
    }
  }, [isLoading, hasSession, isOnLoginScreen, isOnPortalGroup, loginHref, portal, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isOnLoginScreen) {
    return <>{children}</>;
  }

  if (!hasSession) {
    return null;
  }

  return <>{children}</>;
}
