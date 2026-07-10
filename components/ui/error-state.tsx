import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-col items-center justify-center py-16">
      <View className="w-12 h-12 rounded-xl bg-red-50 items-center justify-center mb-4">
        <Text className="text-destructive text-lg">⚠</Text>
      </View>
      <Text className="text-sm font-medium text-foreground">{message}</Text>
      <Text className="text-xs text-muted-foreground mt-1 text-center max-w-sm">{description}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="mt-4 px-4 py-2 rounded-xl border border-border bg-card"
        >
          <Text className="text-sm font-medium text-foreground">Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
