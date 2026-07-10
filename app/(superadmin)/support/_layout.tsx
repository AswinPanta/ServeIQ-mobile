import { Stack } from "expo-router";
import { GRAY } from "@/constants/portal-theme";

export default function SupportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GRAY[50] },
      }}
    >
      <Stack.Screen name="tickets" />
      <Stack.Screen name="announcements" />
    </Stack>
  );
}
