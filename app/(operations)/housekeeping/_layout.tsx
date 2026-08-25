import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { RoleGuard } from "@/components/common/RoleGuard";
import { MODULE_ROLES } from "@/constants/operations-access";

export default function HousekeepingLayout() {
  const colors = useColors();
  return (
    <RoleGuard allowedRoles={MODULE_ROLES.housekeeping}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="[roomId]" />
      </Stack>
    </RoleGuard>
  );
}
