import { Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { GRAY } from "@/constants/portal-theme";
import { useAuth } from "@/lib/context/auth-context";
import { AuthGuard } from "@/components/common/AuthGuard";
import { SuperAdminHeader } from "@/components/superadmin/SuperAdminHeader";

function SuperAdminContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn, portal } = useAuth();
  const segments = useSegments();
  const isOnLoginScreen = segments.some((s: string) => s === "login" || s === "register");
  const showHeader = isSignedIn && portal === "superadmin" && !isOnLoginScreen;

  return (
    <View style={{ flex: 1, backgroundColor: GRAY[50] }}>
      {showHeader && <SuperAdminHeader />}
      {children}
    </View>
  );
}

export default function SuperAdminLayout() {
  return (
    <AuthGuard portal="superadmin">
      <SuperAdminContent>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: GRAY[50] },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="index" />
          <Stack.Screen name="tenants" />
          <Stack.Screen name="commerce" />
          <Stack.Screen name="platform" />
          <Stack.Screen name="support" />
          <Stack.Screen name="system" />
          <Stack.Screen name="admin" />
        </Stack>
      </SuperAdminContent>
    </AuthGuard>
  );
}
