import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function HousekeepingLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[roomId]" />
    </Stack>
  );
}
