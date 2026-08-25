import { View, Text } from 'react-native';
import { SLATE } from '@/lib/constants/figma-tokens';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📋', title, message, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '600', color: SLATE[800], textAlign: 'center', marginBottom: 4 }}>{title}</Text>
      {message && (
        <Text style={{ fontSize: 13, color: SLATE[500], textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>{message}</Text>
      )}
      {action}
    </View>
  );
}
