import { Stack } from "expo-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { MODULE_ROLES } from "@/constants/operations-access";
import { KDS } from "@/lib/constants/figma-tokens";

export default function KdsLayout() {
  return (
    <RoleGuard allowedRoles={MODULE_ROLES.kds}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: KDS.bg },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </RoleGuard>
  );
}
