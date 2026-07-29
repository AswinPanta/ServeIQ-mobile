import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";
import { AuthGuard } from "@/components/common/AuthGuard";
import { HostProvider } from "@/lib/context/host-context";

export default function HostLayout() {
  return (
    <AuthGuard portal="host">
      <HostProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: GRAY[50] },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="landing" />
          <Stack.Screen name="listing-wizard" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="property/[id]" options={{ animation: "slide_from_right" }} />
        </Stack>
      </HostProvider>
    </AuthGuard>
  );
}
