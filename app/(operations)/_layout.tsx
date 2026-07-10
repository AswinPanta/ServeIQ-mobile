import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/context/auth-context";
import { AuthGuard } from "@/components/common/AuthGuard";
import { OperationsHeader } from "@/components/operations/OperationsHeader";

function OperationsContent({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { isSignedIn, portal } = useAuth();
  const segments = useSegments();
  const isOnLoginScreen = segments.some((s: string) => s === "login" || s === "register");
  const showHeader = isSignedIn && portal === "operations" && !isOnLoginScreen;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showHeader && <OperationsHeader />}
      {children}
    </View>
  );
}

import { useMemo } from "react";

export default function OperationsLayout() {
  const colors = useColors();
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);

  return (
    <AuthGuard portal="operations">
      <OperationsContent>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="login" />
          <Stack.Screen name="index" />
          <Stack.Screen name="front-desk" />
          <Stack.Screen name="housekeeping" />
          <Stack.Screen name="pos" />
          <Stack.Screen name="kds" />
          <Stack.Screen name="analytics" />
        </Stack>
      </OperationsContent>
    </AuthGuard>
  );
}
