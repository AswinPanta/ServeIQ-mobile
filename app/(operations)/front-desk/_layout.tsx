import { useMemo } from "react";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { RoleGuard } from "@/components/common/RoleGuard";
import { MODULE_ROLES } from "@/constants/operations-access";

export default function FrontDeskLayout() {
  const colors = useColors();
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);
  return (
    <RoleGuard allowedRoles={MODULE_ROLES['front-desk']}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new-booking" />
        <Stack.Screen name="check-in" />
        <Stack.Screen name="check-out" />
        <Stack.Screen name="guest-crm" />
      </Stack>
    </RoleGuard>
  );
}
