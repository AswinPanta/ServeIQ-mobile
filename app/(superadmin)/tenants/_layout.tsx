import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";

export default function TenantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRAY[50] },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
