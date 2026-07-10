import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";

export default function SystemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRAY[50] },
      }}
    >
      <Stack.Screen name="health" />
      <Stack.Screen name="audit-logs" />
      <Stack.Screen name="impersonate" />
    </Stack>
  );
}
