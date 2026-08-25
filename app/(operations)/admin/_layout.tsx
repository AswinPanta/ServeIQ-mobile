import { Stack } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { useMemo } from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';
import { MODULE_ROLES } from '@/constants/operations-access';

export default function AdminLayout() {
  const colors = useColors();
  const screenOptions = useMemo(() => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  }), [colors.background]);

  return (
    <RoleGuard allowedRoles={MODULE_ROLES.admin}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="staff" />
        <Stack.Screen name="approvals" />
        <Stack.Screen name="shifts" />
      </Stack>
    </RoleGuard>
  );
}
