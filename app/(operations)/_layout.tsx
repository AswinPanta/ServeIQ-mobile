import { Stack, usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/context/auth-context";
import { FrontDeskProvider } from "@/lib/context/frontdesk-context";
import { AuthGuard } from "@/components/common/AuthGuard";
import { OperationsHeader } from "@/components/operations/OperationsHeader";
import type { OperatorProfile } from "@/types/api";

import { useEffect, useMemo } from "react";
import { getMustChangeStaffEmails } from "@/lib/context/host-utils";

function OperationsContent({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { isSignedIn, portal, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isHousekeeping = pathname.startsWith("/(operations)/housekeeping");
  const showHeader = isSignedIn && portal === "operations" && !isHousekeeping;

  // Force staff signed in with a temporary password to change it before using
  // the portal. The flag is set when an admin creates the staff member.
  const operatorEmail = (user as OperatorProfile | null)?.email?.toLowerCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSignedIn || portal !== "operations" || !operatorEmail) return;
      const map = await getMustChangeStaffEmails();
      if (cancelled) return;
      const mustChange = !!map[operatorEmail];
      const onChangeRoute = pathname === "/(operations)/change-password";
      if (mustChange && !onChangeRoute) {
        router.replace("/(operations)/change-password");
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, portal, operatorEmail, pathname, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showHeader && <OperationsHeader />}
      {children}
    </View>
  );
}

export default function OperationsLayout() {
  const colors = useColors();
  const { user } = useAuth();
  const operator = user as OperatorProfile | null;
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);

  return (
    <AuthGuard portal="operations">
      <FrontDeskProvider propertyId={operator?.property_id}>
        <OperationsContent>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" />
            <Stack.Screen name="front-desk" />
            <Stack.Screen name="housekeeping" />
            <Stack.Screen name="pos" />
            <Stack.Screen name="kds" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="change-password" options={{ animation: "slide_from_right" }} />
          </Stack>
        </OperationsContent>
      </FrontDeskProvider>
    </AuthGuard>
  );
}
