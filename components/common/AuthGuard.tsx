import { useEffect, type ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter, useSegments } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import type { PortalType } from '@/types/api';

const UNIFIED_LOGIN = '/(auth)/login';

const PORTAL_LOGIN_MAP: Record<PortalType, string> = {
  guest: UNIFIED_LOGIN,
  host: UNIFIED_LOGIN,
  operations: UNIFIED_LOGIN,
  superadmin: UNIFIED_LOGIN,
};

const PORTAL_HOME_MAP: Record<PortalType, string> = {
  guest: '/(tabs)',
  host: '/(host)',
  operations: '/(operations)',
  superadmin: '/(superadmin)',
};

interface AuthGuardProps {
  portal: PortalType;
  children: ReactNode;
}

export function AuthGuard({ portal, children }: AuthGuardProps) {
  const { isLoading, isSignedIn, portal: activePortal } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colors = useColors();

  const isOnLoginScreen = segments.some((s: string) => s === 'login' || s === 'register');
  const isOnPortalGroup = segments.some((s: string) => s === `(${portal})`) || (portal === 'guest' && segments.some((s: string) => s === '(tabs)'));
  const isCorrectPortal = activePortal === portal;
  const hasSession = isSignedIn && isCorrectPortal;

  useEffect(() => {
    if (isLoading) return;

    if (!hasSession && !isOnLoginScreen && isOnPortalGroup) {
      router.replace(PORTAL_LOGIN_MAP[portal] as any);
    } else if (hasSession && isOnLoginScreen && isOnPortalGroup) {
      router.replace(PORTAL_HOME_MAP[portal] as any);
    }
  }, [isLoading, hasSession, isOnLoginScreen, isOnPortalGroup]);

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
