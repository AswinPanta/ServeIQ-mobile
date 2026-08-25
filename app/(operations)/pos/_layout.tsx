import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { RoleGuard } from "@/components/common/RoleGuard";
import { MODULE_ROLES } from "@/constants/operations-access";

export default function POSLayout() {
  const colors = useColors();
  return (
    <RoleGuard allowedRoles={MODULE_ROLES.pos}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="table/[id]" />
        <Stack.Screen name="checkout" />
      </Stack>
    </RoleGuard>
  );
}
