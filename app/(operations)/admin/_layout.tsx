import { Stack } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { useMemo } from 'react';

export default function AdminLayout() {
  const colors = useColors();
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="staff" />
      <Stack.Screen name="approvals" />
      <Stack.Screen name="shifts" />
    </Stack>
  );
}
