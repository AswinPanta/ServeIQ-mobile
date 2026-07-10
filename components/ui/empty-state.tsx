import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  message = 'No data',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-col items-center justify-center py-16', className)}>
      {icon ? (
        <View className="w-12 h-12 rounded-xl bg-muted items-center justify-center mb-4">
          {icon}
        </View>
      ) : (
        <View className="w-12 h-12 rounded-xl bg-muted items-center justify-center mb-4">
          <Text className="text-muted-foreground text-lg">📭</Text>
        </View>
      )}
      <Text className="text-sm font-medium text-foreground">{message}</Text>
      {description && (
        <Text className="text-xs text-muted-foreground mt-1 text-center max-w-xs">{description}</Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
