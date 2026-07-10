import { useMemo } from "react";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/context/auth-context";
import { CRMProvider } from "@/lib/context/crm-context";
import { FrontDeskProvider } from "@/lib/context/frontdesk-context";
import type { OperatorProfile } from "@/types/api";

export default function FrontDeskLayout() {
  const colors = useColors();
  const { user } = useAuth();
  const operator = user as OperatorProfile | null;
  const propertyId = operator?.property_id;
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);
  return (
    <CRMProvider>
      <FrontDeskProvider propertyId={propertyId}>
        <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new-booking" />
        <Stack.Screen name="check-in" />
        <Stack.Screen name="check-out" />
        <Stack.Screen name="guest-crm" />
      </Stack>
      </FrontDeskProvider>
    </CRMProvider>
  );
}
