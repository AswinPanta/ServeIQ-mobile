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
          <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="admin-profile" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="change-password" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="listing-wizard" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="property/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/edit/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/dashboard" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/bookings" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/rooms" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/guests" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/staff" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/housekeeping" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/pricing" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/reports" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/company" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/general" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/booking" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/room-rate" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/amenities" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/notifications" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/taxes" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/payments" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/integrations" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/logs" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="property/[id]/settings/support" options={{ animation: "slide_from_right" }} />
        </Stack>
      </HostProvider>
    </AuthGuard>
  );
}
