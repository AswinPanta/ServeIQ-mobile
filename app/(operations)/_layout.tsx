import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/context/auth-context";
import { AuthGuard } from "@/components/common/AuthGuard";
import { OperationsHeader } from "@/components/operations/OperationsHeader";
import { OperationsInviteProvider } from "@/lib/context/operations-invite-context";

import { useMemo } from "react";

function OperationsContent({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { isSignedIn, portal } = useAuth();
  const pathname = usePathname();
  const isHousekeeping = pathname.startsWith("/(operations)/housekeeping");
  const showHeader = isSignedIn && portal === "operations" && !isHousekeeping;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showHeader && <OperationsHeader />}
      {children}
    </View>
  );
}

export default function OperationsLayout() {
  const colors = useColors();
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);

  return (
    <OperationsInviteProvider>
      <AuthGuard portal="operations">
        <OperationsContent>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" />
            <Stack.Screen name="front-desk" />
            <Stack.Screen name="housekeeping" />
            <Stack.Screen name="pos" />
            <Stack.Screen name="kds" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="admin" />
          </Stack>
        </OperationsContent>
      </AuthGuard>
    </OperationsInviteProvider>
  );
}
