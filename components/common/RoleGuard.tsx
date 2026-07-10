import { type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/lib/context/auth-context';
import { useColors } from '@/hooks/use-colors';
import type { OperatorRole } from '@/types/api';

interface RoleGuardProps {
  allowedRoles: OperatorRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();
  const colors = useColors();

  const userRole = user && 'role' in user ? (user as { role: string }).role : null;

  if (!userRole || !allowedRoles.includes(userRole as OperatorRole)) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text
          className="text-lg font-semibold text-center"
          style={{ color: colors.icon }}
        >
          You don't have permission to access this section.
        </Text>
        <Text
          className="text-sm mt-2 text-center"
          style={{ color: colors.icon }}
        >
          Required role: {allowedRoles.join(' or ')}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
