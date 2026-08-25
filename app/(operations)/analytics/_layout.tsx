import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { RoleGuard } from "@/components/common/RoleGuard";
import { MODULE_ROLES } from "@/constants/operations-access";

export default function AnalyticsLayout() {
  const colors = useColors();
  return (
    <RoleGuard allowedRoles={MODULE_ROLES.analytics}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </RoleGuard>
  );
}
